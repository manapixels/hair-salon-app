import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAppointmentsForReminders, markReminderSent } from '@/lib/database';
import { sendBulkReminders } from '@/services/reminderService';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin or cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it for authentication
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Starting appointment reminders job...');

    // Get appointments that need reminders (24 hours ahead)
    const upcomingAppointments = await getUpcomingAppointmentsForReminders(24);

    if (upcomingAppointments.length === 0) {
      console.log('📅 No appointments found needing reminders');
      return NextResponse.json({
        message: 'No appointments found needing reminders',
        appointmentsProcessed: 0,
        results: [],
      });
    }

    console.log(`📬 Found ${upcomingAppointments.length} appointments needing reminders`);

    // Send reminders
    const reminderResults = await sendBulkReminders(upcomingAppointments);

    // Mark successful reminders as sent
    const successfulReminders = reminderResults.filter(r => r.success);
    for (const result of successfulReminders) {
      try {
        await markReminderSent(result.appointmentId);
      } catch (error) {
        console.error(
          `Failed to mark reminder as sent for appointment ${result.appointmentId}:`,
          error,
        );
      }
    }

    // Log results
    const successful = reminderResults.filter(r => r.success).length;
    const failed = reminderResults.filter(r => !r.success).length;

    console.log(`✅ Reminders sent successfully: ${successful}`);
    console.log(`❌ Reminders failed: ${failed}`);

    if (failed > 0) {
      console.log(
        'Failed reminders:',
        reminderResults.filter(r => !r.success),
      );
    }

    return NextResponse.json({
      message: `Processed ${upcomingAppointments.length} appointments`,
      appointmentsProcessed: upcomingAppointments.length,
      successful,
      failed,
      results: reminderResults,
    });
  } catch (error) {
    console.error('❌ Error in reminders job:', error);
    return NextResponse.json(
      {
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

// GET endpoint for manual testing and status checking
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hoursAhead = parseInt(searchParams.get('hours') || '24', 10);

    // Get upcoming appointments that would need reminders
    const upcomingAppointments = await getUpcomingAppointmentsForReminders(hoursAhead);

    return NextResponse.json({
      message: `Found ${upcomingAppointments.length} appointments needing reminders in ${hoursAhead} hours`,
      hoursAhead,
      appointmentsCount: upcomingAppointments.length,
      appointments: upcomingAppointments.map(apt => ({
        id: apt.id,
        customerName: apt.customerName,
        date: apt.date,
        time: apt.time,
        services: apt.services.map(s => s.name),
        stylist: apt.stylist?.name,
        userId: apt.userId,
        userProvider: apt.user?.authProvider,
      })),
    });
  } catch (error) {
    console.error('Error checking reminders:', error);
    return NextResponse.json(
      {
        error: 'Failed to check reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
