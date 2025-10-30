import { prisma } from '@/lib/prisma';
import type { User, Appointment } from '@prisma/client';
import { RETENTION_CONFIG } from '@/config/retention';

/**
 * Get appointments completed within the feedback delay window that need feedback requests
 */
export async function getCompletedAppointmentsNeedingFeedback(): Promise<
  Array<Appointment & { user: User | null }>
> {
  const now = new Date();
  const delayMs = RETENTION_CONFIG.feedback.delayHours * 60 * 60 * 1000;
  const targetTime = new Date(now.getTime() - delayMs);

  return prisma.appointment.findMany({
    where: {
      status: 'COMPLETED',
      completedAt: {
        lte: targetTime,
      },
      feedbackSent: false,
      userId: { not: null },
    },
    include: { user: true },
  });
}

/**
 * Get users who need rebooking nudges (configured weeks since last visit)
 * Only counts COMPLETED appointments (excludes NO_SHOW)
 */
export async function getUsersNeedingRebooking(): Promise<
  Array<User & { appointments: Appointment[] }>
> {
  const now = new Date();
  const weeksAgo = RETENTION_CONFIG.rebooking.weeksSinceVisit;
  const targetDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
  const rateLimitDate = new Date(
    now.getTime() - RETENTION_CONFIG.rateLimit.daysBetweenMessages * 24 * 60 * 60 * 1000,
  );

  return prisma.user.findMany({
    where: {
      lastVisitDate: {
        lt: targetDate,
      },
      totalVisits: { gte: 1 },
      OR: [
        { lastRetentionMessageSent: null },
        {
          lastRetentionMessageSent: {
            lt: rateLimitDate,
          },
        },
      ],
    },
    include: {
      appointments: {
        where: { status: 'COMPLETED' }, // Only COMPLETED, excludes NO_SHOW
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  });
}

/**
 * Get users for win-back campaigns (configured weeks inactive)
 * Only counts COMPLETED appointments (excludes NO_SHOW)
 */
export async function getUsersForWinBack(): Promise<Array<User & { appointments: Appointment[] }>> {
  const now = new Date();
  const weeksAgo = RETENTION_CONFIG.winback.weeksSinceVisit;
  const targetDate = new Date(now.getTime() - weeksAgo * 7 * 24 * 60 * 60 * 1000);

  return prisma.user.findMany({
    where: {
      lastVisitDate: {
        lt: targetDate,
      },
      totalVisits: { gte: 2 }, // Only customers who've visited at least twice (COMPLETED only)
    },
    include: {
      appointments: {
        where: { status: 'COMPLETED' }, // Only COMPLETED, excludes NO_SHOW
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  });
}

/**
 * Mark appointment as completed and update user stats
 */
export async function markAppointmentCompleted(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (!appointment || !appointment.userId) return;

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: appointment.userId },
      data: {
        lastVisitDate: new Date(),
        totalVisits: { increment: 1 },
      },
    }),
  ]);
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
  await prisma.$transaction([
    prisma.retentionMessage.create({
      data: {
        userId,
        messageType,
        daysSinceLastVisit,
        deliveryStatus,
        deliveryError,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { lastRetentionMessageSent: new Date() },
    }),
  ]);
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
  await prisma.$transaction([
    prisma.feedback.create({ data }),
    prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { feedbackSent: true },
    }),
  ]);
}
