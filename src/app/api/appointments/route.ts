/**
 * API Route: /api/appointments
 *
 * App Router API handler for appointments
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  bookNewAppointment,
  getAppointments,
  updateAppointmentCalendarId,
  findUserByEmail,
  createUserFromOAuth,
  getAdminSettings,
} from '../../../lib/database';
import { createCalendarEvent } from '../../../lib/google';
import { sendAppointmentConfirmation } from '../../../services/messagingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDateParam = searchParams.get('fromDate');
    const toDateParam = searchParams.get('toDate');

    const options: { fromDate?: Date; toDate?: Date } = {};

    if (fromDateParam) {
      options.fromDate = new Date(fromDateParam);
    }
    if (toDateParam) {
      options.toDate = new Date(toDateParam);
    }

    // If 'all' parameter is set, fetch all appointments (no date filter)
    const fetchAll = searchParams.get('all') === 'true';

    const appointments = fetchAll
      ? await getAppointments({ fromDate: new Date(0), toDate: new Date('2100-01-01') })
      : await getAppointments(options);

    return NextResponse.json(appointments, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch appointments.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      date: string;
      time: string;
      services?: any[];
      stylistId?: string;
      customerName: string;
      customerEmail: string;
      categoryId?: string;
      estimatedDuration?: number;
    };
    const {
      date,
      time,
      services,
      stylistId,
      customerName,
      customerEmail,
      // Category-based booking fields
      categoryId,
      estimatedDuration,
    } = body;

    // Validate required fields (either category-based OR service-based)
    const hasCategory = Boolean(categoryId);
    const hasServices = Boolean(services && Array.isArray(services) && services.length > 0);

    if (!date || !time || !customerName || !customerEmail) {
      return NextResponse.json({ message: 'Missing required appointment data.' }, { status: 400 });
    }

    if (!hasCategory && !hasServices) {
      return NextResponse.json(
        { message: 'Either categoryId or services must be provided.' },
        { status: 400 },
      );
    }

    // Look up user by email to link appointment to user account
    let existingUser: any = await findUserByEmail(customerEmail);

    // If user doesn't exist and it's a real email, create a new user
    const isMessagingEmail =
      customerEmail.endsWith('@whatsapp.local') || customerEmail.endsWith('@telegram.local');
    let isNewUser = false;

    if (!existingUser && !isMessagingEmail) {
      try {
        console.log(`[Appointment] Creating new user for ${customerEmail}`);
        existingUser = await createUserFromOAuth({
          email: customerEmail,
          name: customerName,
          authProvider: 'email',
        });
        isNewUser = true;

        // Send welcome email asynchronously
        Promise.all([import('@/services/emailService'), getAdminSettings()]).then(
          ([{ sendWelcomeEmail }, settings]) => {
            sendWelcomeEmail(customerEmail, customerName, {
              businessName: settings.businessName,
              businessAddress: settings.businessAddress,
              businessPhone: settings.businessPhone,
            }).catch(err => console.error('[Appointment] Failed to send welcome email:', err));
          },
        );
      } catch (userError) {
        console.error('[Appointment] Failed to create new user:', userError);
        // Continue without linking user if creation fails
      }
    }

    const appointmentData = {
      date: new Date(date),
      time,
      services: services || [], // Empty array for category-based booking
      stylistId,
      customerName,
      customerEmail,
      userId: existingUser?.id, // Link to user if they have an account
      bookingSource: 'WEB' as const,
      // Category-based fields (optional)
      categoryId,
      estimatedDuration,
    };

    const newAppointment = await bookNewAppointment(appointmentData);
    console.log(
      `[Appointment] Created appointment ${newAppointment.id} for ${newAppointment.customerName}`,
    );

    // After successfully creating the appointment in our DB,
    // create a corresponding event in Google Calendar.
    console.log(
      `[Appointment] Attempting Google Calendar sync for appointment ${newAppointment.id}...`,
    );
    const calendarEventId = await createCalendarEvent(newAppointment);

    // Update the appointment with the calendar event ID if successful
    if (calendarEventId) {
      await updateAppointmentCalendarId(newAppointment.id, calendarEventId);
      newAppointment.calendarEventId = calendarEventId;
      console.log(`[Appointment] ✅ Calendar event created: ${calendarEventId}`);
    } else {
      console.warn(
        `[Appointment] ⚠️ No calendar event created for appointment ${newAppointment.id}`,
      );
    }

    // Send appointment confirmation via WhatsApp/Telegram
    try {
      let user = null;
      if (existingUser) {
        user = {
          ...existingUser,
          roles: existingUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
          authProvider:
            (existingUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
          telegramId: existingUser.telegramId ?? undefined,
          whatsappPhone: existingUser.whatsappPhone ?? undefined,
          avatar: existingUser.avatar ?? undefined,
        };
      }
      const messageSent = await sendAppointmentConfirmation(user, newAppointment, 'confirmation');
      if (messageSent) {
        console.log(`✅ Appointment confirmation sent to ${newAppointment.customerEmail}`);
      }
    } catch (error) {
      console.error('Failed to send appointment confirmation:', error);
      // Don't fail the appointment creation if messaging fails
    }

    // Send email confirmation for real email addresses (not messaging platform users)
    // Note: Email will be sent after deposit payment if deposit is required
    // isMessagingEmail is already defined above

    if (!isMessagingEmail) {
      // Check if deposit is required - if so, email will be sent after payment
      const { requiresDeposit } = await import('@/services/paymentService');
      const depositCheck = await requiresDeposit(customerEmail);

      if (!depositCheck.required) {
        // No deposit required - send confirmation email now
        try {
          const { sendBookingConfirmationEmail } = await import('@/services/emailService');
          const { format } = await import('date-fns');
          const settings = await getAdminSettings();

          // Get category name
          const db = await import('@/db').then(m => m.getDb());
          const schema = await import('@/db/schema');
          const { eq } = await import('drizzle-orm');
          let serviceName = 'Appointment';
          if (categoryId) {
            const catResult = await (await db)
              .select({ title: schema.serviceCategories.title })
              .from(schema.serviceCategories)
              .where(eq(schema.serviceCategories.id, categoryId))
              .limit(1);
            if (catResult[0]) serviceName = catResult[0].title;
          }

          // Get stylist name and avatar
          let stylistName: string | null = null;
          let stylistAvatarUrl: string | undefined = undefined;

          if (stylistId) {
            const stylistResult = await (await db)
              .select({ name: schema.stylists.name, avatar: schema.stylists.avatar })
              .from(schema.stylists)
              .where(eq(schema.stylists.id, stylistId))
              .limit(1);
            if (stylistResult[0]) {
              stylistName = stylistResult[0].name;
              stylistAvatarUrl = stylistResult[0].avatar || undefined;
            }
          }

          await sendBookingConfirmationEmail(
            {
              customerName,
              customerEmail,
              appointmentId: newAppointment.id,
              serviceName,
              stylistName,
              stylistAvatarUrl,
              date: format(new Date(date), 'EEEE, MMMM d, yyyy'),
              time,
              duration: estimatedDuration || 60,
            },
            {
              businessName: settings.businessName,
              businessAddress: settings.businessAddress,
              businessPhone: settings.businessPhone,
            },
          );
          console.log(`✉️ Confirmation email sent to ${customerEmail}`);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail appointment creation if email fails
        }
      }
    }

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'An error occurred during booking.' },
      { status: 409 },
    );
  }
}
