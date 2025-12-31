import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

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
