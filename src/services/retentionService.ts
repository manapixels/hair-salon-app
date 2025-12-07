import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, lt, and, desc, gte, or, isNull } from 'drizzle-orm';
import { RETENTION_CONFIG } from '@/config/retention';

// Types for compatibility
type AppointmentWithUser = typeof schema.appointments.$inferSelect & {
  user: typeof schema.users.$inferSelect | null;
};
type UserWithAppointments = typeof schema.users.$inferSelect & {
  appointments: (typeof schema.appointments.$inferSelect)[];
};

/**
 * Get appointments completed within the feedback delay window that need feedback requests
 */
export async function getCompletedAppointmentsNeedingFeedback(): Promise<AppointmentWithUser[]> {
  const db = await getDb();
  const now = new Date();
  const delayMs = RETENTION_CONFIG.feedback.delayHours * 60 * 60 * 1000;
  const targetTime = new Date(now.getTime() - delayMs);

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.status, 'COMPLETED'),
        lt(schema.appointments.completedAt, targetTime),
        eq(schema.appointments.feedbackSent, false),
      ),
    );

  // Fetch associated users
  const userIds = Array.from(new Set(appointments.map(a => a.userId).filter(Boolean))) as string[];
  const users =
    userIds.length > 0
      ? await db
          .select()
          .from(schema.users)
          .where(or(...userIds.map(id => eq(schema.users.id, id))))
      : [];

  return appointments
    .filter(a => a.userId)
    .map(a => ({
      ...a,
      user: users.find(u => u.id === a.userId) || null,
    }));
}

/**
 * Get users who need rebooking nudges (configured weeks since last visit)
 */
export async function getUsersNeedingRebooking(): Promise<UserWithAppointments[]> {
  const db = await getDb();
  const now = new Date();
  const weeksAgo = RETENTION_CONFIG.rebooking.weeksSinceVisit;
  const targetDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
  const rateLimitDate = new Date(
    now.getTime() - RETENTION_CONFIG.rateLimit.daysBetweenMessages * 24 * 60 * 60 * 1000,
  );

  const users = await db
    .select()
    .from(schema.users)
    .where(and(lt(schema.users.lastVisitDate, targetDate), gte(schema.users.totalVisits, 1)));

  // Filter by rate limit
  const eligibleUsers = users.filter(
    u => !u.lastRetentionMessageSent || u.lastRetentionMessageSent < rateLimitDate,
  );

  // Fetch last completed appointment for each user
  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.status, 'COMPLETED'))
    .orderBy(desc(schema.appointments.completedAt));

  return eligibleUsers.map(u => ({
    ...u,
    appointments: appointments.filter(a => a.userId === u.id).slice(0, 1),
  }));
}

/**
 * Get users for win-back campaigns (configured weeks inactive)
 */
export async function getUsersForWinBack(): Promise<UserWithAppointments[]> {
  const db = await getDb();
  const now = new Date();
  const weeksAgo = RETENTION_CONFIG.winback.weeksSinceVisit;
  const targetDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);

  const users = await db
    .select()
    .from(schema.users)
    .where(and(lt(schema.users.lastVisitDate, targetDate), gte(schema.users.totalVisits, 2)));

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.status, 'COMPLETED'))
    .orderBy(desc(schema.appointments.completedAt));

  return users.map(u => ({
    ...u,
    appointments: appointments.filter(a => a.userId === u.id).slice(0, 1),
  }));
}

/**
 * Mark appointment as completed and update user stats
 */
export async function markAppointmentCompleted(appointmentId: string): Promise<void> {
  const db = await getDb();

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, appointmentId))
    .limit(1);
  const appointment = appointments[0];

  if (!appointment || !appointment.userId) return;

  // Update appointment
  await db
    .update(schema.appointments)
    .set({ status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.appointments.id, appointmentId));

  // Update user stats
  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, appointment.userId))
    .limit(1);
  const user = userResult[0];

  if (user) {
    await db
      .update(schema.users)
      .set({
        lastVisitDate: new Date(),
        totalVisits: (user.totalVisits || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, appointment.userId));
  }
}

/**
 * Log that a retention message was sent
 */
export async function logRetentionMessage(
  userId: string,
  messageType: 'FEEDBACK_REQUEST' | 'REBOOKING_NUDGE' | 'WIN_BACK',
  daysSinceLastVisit: number,
  deliveryStatus: 'SENT' | 'FAILED' = 'SENT',
  deliveryError?: string,
): Promise<void> {
  const db = await getDb();

  await db.insert(schema.retentionMessages).values({
    userId,
    messageType,
    daysSinceLastVisit,
    deliveryStatus,
    deliveryError,
  });

  await db
    .update(schema.users)
    .set({ lastRetentionMessageSent: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

/**
 * Create feedback record
 */
export async function createFeedback(data: {
  appointmentId: string;
  userId: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  const db = await getDb();

  await db.insert(schema.feedback).values(data);

  await db
    .update(schema.appointments)
    .set({ feedbackSent: true, updatedAt: new Date() })
    .where(eq(schema.appointments.id, data.appointmentId));
}
