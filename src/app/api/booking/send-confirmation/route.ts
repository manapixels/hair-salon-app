/**
 * API Route: /api/booking/send-confirmation
 * Send booking confirmation email
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendBookingConfirmationEmail } from '@/services/emailService';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = (await request.json()) as { appointmentId: string };

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const db = await getDb();

    // Get appointment with related data
    const result = await db
      .select({
        id: schema.appointments.id,
        customerName: schema.appointments.customerName,
        customerEmail: schema.appointments.customerEmail,
        date: schema.appointments.date,
        time: schema.appointments.time,
        estimatedDuration: schema.appointments.estimatedDuration,
        categoryTitle: schema.serviceCategories.title,
        stylistName: schema.stylists.name,
      })
      .from(schema.appointments)
      .leftJoin(
        schema.serviceCategories,
        eq(schema.appointments.categoryId, schema.serviceCategories.id),
      )
      .leftJoin(schema.stylists, eq(schema.appointments.stylistId, schema.stylists.id))
      .where(eq(schema.appointments.id, appointmentId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const appointment = result[0];

    // Don't send email for messaging platform users
    if (
      appointment.customerEmail.endsWith('@whatsapp.local') ||
      appointment.customerEmail.endsWith('@telegram.local')
    ) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Format date
    const appointmentDate = new Date(appointment.date);
    const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy');

    // Send confirmation email
    const emailResult = await sendBookingConfirmationEmail({
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      appointmentId: appointment.id,
      serviceName: appointment.categoryTitle || 'Appointment',
      stylistName: appointment.stylistName,
      date: formattedDate,
      time: appointment.time,
      duration: appointment.estimatedDuration || 60,
    });

    if (!emailResult.success) {
      console.error('[SendConfirmation] Email failed:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SendConfirmation] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
