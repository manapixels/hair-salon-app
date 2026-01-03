import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Deposit, DepositStatus } from '@/types';

export interface PendingBooking {
  appointmentId: string;
  date: Date;
  time: string;
  categoryTitle?: string;
  stylistName?: string;
  deposit?: {
    id: string;
    amount: number;
    status: DepositStatus;
    paymentUrl?: string;
  };
}

/**
 * Get pending bookings by customer email (for guest recovery)
 */
export async function getPendingBookingsByEmail(email: string): Promise<PendingBooking[]> {
  const db = await getDb();

  // Get deposits with their appointments
  const depositsWithAppts = await db
    .select({
      depositId: schema.deposits.id,
      depositAmount: schema.deposits.amount,
      depositStatus: schema.deposits.status,
      depositPaymentUrl: schema.deposits.hitpayPaymentUrl,
      appointmentId: schema.appointments.id,
      appointmentDate: schema.appointments.date,
      appointmentTime: schema.appointments.time,
      categoryId: schema.appointments.categoryId,
      stylistId: schema.appointments.stylistId,
    })
    .from(schema.deposits)
    .innerJoin(schema.appointments, eq(schema.deposits.appointmentId, schema.appointments.id))
    .where(and(eq(schema.deposits.customerEmail, email), eq(schema.deposits.status, 'PENDING')))
    .orderBy(desc(schema.deposits.createdAt));

  // Fetch category and stylist names
  const categories = await db.select().from(schema.serviceCategories);
  const stylists = await db.select().from(schema.stylists);

  return depositsWithAppts.map(row => ({
    appointmentId: row.appointmentId,
    date: row.appointmentDate,
    time: row.appointmentTime,
    categoryTitle: categories.find(c => c.id === row.categoryId)?.title,
    stylistName: stylists.find(s => s.id === row.stylistId)?.name,
    deposit: {
      id: row.depositId,
      amount: row.depositAmount,
      status: row.depositStatus as DepositStatus,
      paymentUrl: row.depositPaymentUrl ?? undefined,
    },
  }));
}
