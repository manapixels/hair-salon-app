import { NextRequest, NextResponse } from 'next/server';
import {
  getStylistsNeedingCalendarReminders,
  updateLastCalendarReminderSent,
} from '@/lib/database';
import { sendBulkCalendarReminders } from '@/services/calendarReminderService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/calendar-reminders/send
 * Sends daily reminders to stylists with expired Google Calendar tokens.
 * Should be triggered by a cron job (GitHub Actions, Inngest, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check for admin or cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it for authentication
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📆 Starting calendar reconnection reminders job...');

    // Get stylists that need reminders
    const stylistsNeedingReminders = await getStylistsNeedingCalendarReminders();

    if (stylistsNeedingReminders.length === 0) {
      console.log('✅ No stylists need calendar reconnection reminders');
      return NextResponse.json({
        message: 'No stylists need calendar reconnection reminders',
        stylistsProcessed: 0,
        results: [],
      });
    }

    console.log(
      `📬 Found ${stylistsNeedingReminders.length} stylists needing calendar reconnection reminders`,
    );

    // Send reminders
    const reminderResults = await sendBulkCalendarReminders(stylistsNeedingReminders);

    // Mark successful reminders as sent
    const successfulReminders = reminderResults.filter(r => r.success);
    for (const result of successfulReminders) {
      try {
        await updateLastCalendarReminderSent(result.stylistId);
      } catch (error) {
        console.error(`Failed to mark reminder as sent for stylist ${result.stylistId}:`, error);
      }
    }

    // Log results
    const successful = reminderResults.filter(r => r.success).length;
    const failed = reminderResults.filter(r => !r.success).length;

    console.log(`✅ Calendar reminders sent successfully: ${successful}`);
    console.log(`❌ Calendar reminders failed: ${failed}`);

    if (failed > 0) {
      console.log(
        'Failed reminders:',
        reminderResults.filter(r => !r.success),
      );
    }

    return NextResponse.json({
      message: `Processed ${stylistsNeedingReminders.length} stylists`,
      stylistsProcessed: stylistsNeedingReminders.length,
      successful,
      failed,
      results: reminderResults,
    });
  } catch (error) {
    console.error('❌ Error in calendar reminders job:', error);
    return NextResponse.json(
      {
        error: 'Failed to process calendar reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/calendar-reminders/send
 * Returns a list of stylists that would receive reminders (for debugging/testing)
 */
export async function GET(request: NextRequest) {
  try {
    const stylistsNeedingReminders = await getStylistsNeedingCalendarReminders();

    return NextResponse.json({
      message: `Found ${stylistsNeedingReminders.length} stylists needing calendar reconnection reminders`,
      count: stylistsNeedingReminders.length,
      stylists: stylistsNeedingReminders.map(({ stylist, user }) => ({
        id: stylist.id,
        name: stylist.name,
        googleEmail: stylist.googleEmail,
        lastReminderSent: stylist.lastCalendarReminderSent,
        userAuthProvider: user.authProvider,
        hasTelegram: !!user.telegramId,
        hasWhatsApp: !!user.whatsappPhone,
      })),
    });
  } catch (error) {
    console.error('Error checking calendar reminders:', error);
    return NextResponse.json(
      {
        error: 'Failed to check calendar reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
