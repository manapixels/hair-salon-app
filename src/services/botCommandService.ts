/**
 * Bot Command Service
 * Handles structured commands and button interactions for both WhatsApp and Telegram
 */

import { getServices, findAppointmentsByEmail, findUserByEmail, getStylists } from '@/lib/database';
import { formatDisplayDate } from '@/lib/timeUtils';
import type { User } from '@/types';
import { setBookingContext, getBookingContext } from './conversationHistory';

/**
 * Command response type with optional inline keyboards
 */
export interface CommandResponse {
  text: string;
  keyboard?: InlineKeyboard;
  parseMode?: 'Markdown' | 'HTML';
  editPreviousMessage?: boolean; // If true, edit the previous message instead of sending new
}

/**
 * Inline keyboard button for Telegram
 */
export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

/**
 * Inline keyboard structure for Telegram
 */
export interface InlineKeyboard {
  inline_keyboard: Array<Array<InlineKeyboardButton>>;
}

/**
 * Handle /start command - Welcome message with action menu
 */
export async function handleStartCommand(user: User | null): Promise<CommandResponse> {
  const userName = user?.name || 'there';

  const text = `👋 *Welcome to Luxe Cuts Hair Salon, ${userName}!*

I'm your personal booking assistant. I can help you with:

✂️ *Book appointments* - Schedule your next visit
📅 *View bookings* - See your upcoming appointments
💇‍♀️ *Browse services* - Check our services and prices
🔄 *Manage bookings* - Cancel or reschedule
💬 *Ask questions* - I'm here to help!

*Quick Commands:*
/book - Start booking
/appointments - View your bookings
/services - Browse services
/cancel - Cancel a booking
/reschedule - Reschedule a booking
/hours - Business hours & location
/help - Show all commands

What would you like to do today?`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      [
        { text: '📅 Book Appointment', callback_data: 'cmd_book' },
        { text: '📋 My Appointments', callback_data: 'cmd_appointments' },
      ],
      [
        { text: '✂️ View Services', callback_data: 'cmd_services' },
        { text: '🕐 Business Hours', callback_data: 'cmd_hours' },
      ],
      [
        { text: '❌ Cancel Booking', callback_data: 'cmd_cancel' },
        { text: '🔄 Reschedule', callback_data: 'cmd_reschedule' },
      ],
      [{ text: '❓ Help', callback_data: 'cmd_help' }],
    ],
  };

  return { text, keyboard, parseMode: 'Markdown' };
}

/**
 * Handle /services command - List all services
 */
export async function handleServicesCommand(): Promise<CommandResponse> {
  const services = await getServices();

  let text = `✂️ *Our Services*\n\n`;
  text += `Select a service to book:\n\n`;

  services.forEach(service => {
    text += `*${service.name}* - $${service.price}\n`;
    text += `⏱️ ${service.duration} minutes\n`;
    text += `${service.description}\n\n`;
  });

  // Create booking buttons for each service
  const keyboard: InlineKeyboard = {
    inline_keyboard: services.map(service => [
      {
        text: `📅 Book ${service.name} - $${service.price}`,
        callback_data: `book_service_${service.id}`,
      },
    ]),
  };

  return { text, keyboard, parseMode: 'Markdown' };
}

/**
 * Handle /appointments command - List user's appointments
 */
export async function handleAppointmentsCommand(user: User | null): Promise<CommandResponse> {
  if (!user || !user.email) {
    return {
      text: `📧 I need your email address to look up your appointments.\n\nPlease send me your email, or say "My appointments for [your-email@example.com]"`,
      parseMode: 'Markdown',
    };
  }

  try {
    const appointments = await findAppointmentsByEmail(user.email);

    if (appointments.length === 0) {
      const text = `📅 *No Upcoming Appointments*\n\nYou don't have any scheduled appointments yet.\n\nWould you like to book one?`;
      const keyboard: InlineKeyboard = {
        inline_keyboard: [[{ text: '📅 Book Appointment', callback_data: 'cmd_book' }]],
      };
      return { text, keyboard, parseMode: 'Markdown' };
    }

    let text = `📅 *Your Upcoming Appointments*\n\n`;

    appointments.forEach((apt, index) => {
      const services = apt.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(apt.date);

      text += `*${index + 1}. ${date} at ${apt.time}*\n`;
      text += `✂️ ${services}\n`;
      text += `⏱️ ${apt.totalDuration} mins | 💰 $${apt.totalPrice}\n`;
      if (apt.stylist) {
        text += `👤 Stylist: ${apt.stylist.name}\n`;
      }
      text += `\n`;
    });

    // Check if user has a favorite service (most recent appointment)
    const context = getBookingContext(user?.email || user?.telegramId?.toString() || '');
    const hasFavorite = context?.lastServiceBooked && context?.lastStylistBooked;

    // Create appointment selection buttons (one per appointment)
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        ...appointments.map(apt => {
          const date = formatDisplayDate(apt.date);
          const shortService = apt.services[0].name.substring(0, 20);
          return [
            {
              text: `📅 ${date} at ${apt.time} - ${shortService}`,
              callback_data: `view_apt_${apt.id}`,
            },
          ];
        }),
        // Add "Book Again" button if user has a favorite
        ...(hasFavorite
          ? [
              [
                {
                  text: `⭐ Book ${context.lastServiceBooked} Again`,
                  callback_data: `quick_rebook`,
                },
              ],
            ]
          : []),
        [{ text: '📅 Book New Service', callback_data: 'cmd_book' }],
      ],
    };

    return { text, keyboard, parseMode: 'Markdown' };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      text: `Sorry, I had trouble fetching your appointments. Please try again or contact us directly.`,
      parseMode: 'Markdown',
    };
  }
}

/**
 * Handle /book command - Start booking flow
 */
export async function handleBookCommand(): Promise<CommandResponse> {
  const services = await getServices();

  const text = `📅 *Let's Book Your Appointment!*\n\nWhich service would you like?\n\nSelect from our popular services below or view the full menu:`;

  // Show top 4 services as quick select buttons
  const popularServices = services.slice(0, 4);

  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      ...popularServices.slice(0, 2).map(s => [
        {
          text: `✂️ ${s.name} - $${s.price}`,
          callback_data: `book_service_${s.id}`,
        },
      ]),
      ...popularServices.slice(2, 4).map(s => [
        {
          text: `✂️ ${s.name} - $${s.price}`,
          callback_data: `book_service_${s.id}`,
        },
      ]),
      [{ text: '💆 View All Services', callback_data: 'cmd_services' }],
    ],
  };

  return { text, keyboard, parseMode: 'Markdown' };
}

/**
 * Handle /cancel command - Cancel appointment flow
 */
export async function handleCancelCommand(user: User | null): Promise<CommandResponse> {
  if (!user || !user.email) {
    return {
      text: `To cancel an appointment, I'll need your email address.\n\nPlease provide it, and I'll show you your upcoming appointments.`,
      parseMode: 'Markdown',
    };
  }

  try {
    const appointments = await findAppointmentsByEmail(user.email);

    if (appointments.length === 0) {
      return {
        text: `You don't have any upcoming appointments to cancel.`,
        parseMode: 'Markdown',
      };
    }

    let text = `❌ *Cancel Appointment*\n\nSelect the appointment you'd like to cancel:\n\n`;

    appointments.forEach((apt, index) => {
      const services = apt.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(apt.date);
      text += `*${index + 1}. ${date} at ${apt.time}*\n`;
      text += `   ${services} - $${apt.totalPrice}\n\n`;
    });

    // Create buttons for each appointment
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        ...appointments.map(apt => {
          const date = formatDisplayDate(apt.date);
          const shortService = apt.services[0].name.substring(0, 20);
          return [
            {
              text: `❌ ${date} at ${apt.time} - ${shortService}`,
              callback_data: `cancel_apt_${apt.id}`,
            },
          ];
        }),
        [{ text: '🔙 Back to Menu', callback_data: 'cmd_start' }],
      ],
    };

    return { text, keyboard, parseMode: 'Markdown' };
  } catch (error) {
    return {
      text: `Sorry, I had trouble fetching your appointments. Please try again.`,
      parseMode: 'Markdown',
    };
  }
}

/**
 * Handle /reschedule command - Reschedule appointment flow
 */
export async function handleRescheduleCommand(user: User | null): Promise<CommandResponse> {
  if (!user || !user.email) {
    return {
      text: `To reschedule an appointment, I'll need your email address.\n\nPlease provide it, and I'll show you your upcoming appointments.`,
      parseMode: 'Markdown',
    };
  }

  try {
    const appointments = await findAppointmentsByEmail(user.email);

    if (appointments.length === 0) {
      return {
        text: `You don't have any upcoming appointments to reschedule.`,
        parseMode: 'Markdown',
      };
    }

    let text = `🔄 *Reschedule Appointment*\n\nSelect the appointment you'd like to reschedule:\n\n`;

    appointments.forEach((apt, index) => {
      const services = apt.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(apt.date);
      text += `*${index + 1}. ${date} at ${apt.time}*\n`;
      text += `   ${services} - $${apt.totalPrice}\n\n`;
    });

    // Create buttons for each appointment
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        ...appointments.map(apt => {
          const date = formatDisplayDate(apt.date);
          const shortService = apt.services[0].name.substring(0, 20);
          return [
            {
              text: `🔄 ${date} at ${apt.time} - ${shortService}`,
              callback_data: `reschedule_apt_${apt.id}`,
            },
          ];
        }),
        [{ text: '🔙 Back to Menu', callback_data: 'cmd_start' }],
      ],
    };

    return { text, keyboard, parseMode: 'Markdown' };
  } catch (error) {
    return {
      text: `Sorry, I had trouble fetching your appointments. Please try again.`,
      parseMode: 'Markdown',
    };
  }
}

/**
 * Handle /hours command - Business hours
 */
export async function handleHoursCommand(): Promise<CommandResponse> {
  // Get business info from environment variables
  const businessName = process.env.BUSINESS_NAME || 'Luxe Cuts Hair Salon';
  const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main St, Your City, ST 12345';
  const businessPhone = process.env.BUSINESS_PHONE || '(555) 123-4567';
  const openingTime = process.env.OPENING_TIME || '9:00 AM';
  const closingTime = process.env.CLOSING_TIME || '6:00 PM';
  const saturdayClosing = process.env.SATURDAY_CLOSING || '3:00 PM';

  // Check if currently open (basic logic)
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getHours();
  const isWeekday = currentDay >= 1 && currentDay <= 5;
  const isSaturday = currentDay === 6;
  const isSunday = currentDay === 0;

  let statusEmoji = '🔴';
  let statusText = 'Closed';

  if (isWeekday && currentHour >= 9 && currentHour < 18) {
    statusEmoji = '🟢';
    statusText = 'Open Now';
  } else if (isSaturday && currentHour >= 9 && currentHour < 15) {
    statusEmoji = '🟢';
    statusText = 'Open Now';
  }

  const text = `🕐 *Business Hours*\n\n*${businessName}*\n\n${statusEmoji} *${statusText}*\n\n📍 ${businessAddress}\n📞 ${businessPhone}\n\n*Opening Hours:*\nMonday - Friday: ${openingTime} - ${closingTime}\nSaturday: ${openingTime} - ${saturdayClosing}\nSunday: Closed\n\n*Walk-ins welcome* or book your appointment in advance!`;

  // Create keyboard with clickable links
  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      [
        { text: '📞 Call Us', url: `tel:${businessPhone.replace(/[^0-9+]/g, '')}` },
        {
          text: '📍 Get Directions',
          url: `https://maps.google.com/?q=${encodeURIComponent(businessAddress)}`,
        },
      ],
      [{ text: '📅 Book Appointment', callback_data: 'cmd_book' }],
    ],
  };

  return { text, keyboard, parseMode: 'Markdown' };
}

/**
 * Handle /help command - Show available commands
 */
export async function handleHelpCommand(): Promise<CommandResponse> {
  const text = `❓ *How Can I Help?*\n\n*Quick Commands:*\n/start - Main menu\n/book - Book an appointment\n/appointments - View your bookings\n/services - Browse our services\n/cancel - Cancel a booking\n/reschedule - Reschedule a booking\n/hours - Business hours & location\n/help - Show this help message\n\n*Natural Language:*\nYou can also just talk to me naturally! Try:\n• "What services do you offer?"\n• "Book a haircut for tomorrow"\n• "Show my appointments"\n• "Cancel my booking on Jan 15th"\n\nI'm powered by AI and can understand your requests in plain English!`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [
      [
        { text: '📅 Book Now', callback_data: 'cmd_book' },
        { text: '📋 My Appointments', callback_data: 'cmd_appointments' },
      ],
      [{ text: '✂️ Services', callback_data: 'cmd_services' }],
    ],
  };

  return { text, keyboard, parseMode: 'Markdown' };
}

/**
 * Handle callback query from inline buttons
 */
export async function handleCallbackQuery(
  callbackData: string,
  user: User | null,
  userId: string,
): Promise<CommandResponse> {
  // Handle service booking
  if (callbackData.startsWith('book_service_')) {
    const serviceId = parseInt(callbackData.replace('book_service_', ''));
    const services = await getServices();
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return {
        text: `Sorry, I couldn't find that service. Please try again.`,
        parseMode: 'Markdown',
      };
    }

    // Store service selection in booking context
    setBookingContext(userId, {
      services: [service.name],
      customerName: user?.name,
      customerEmail: user?.email,
    });
    console.log('[SERVICE SELECT] UserId:', userId);
    console.log('[SERVICE SELECT] Stored service:', service.name);

    // Get available stylists
    const stylists = await getStylists();
    const activeStylists = stylists.filter(s => s.isActive);

    if (activeStylists.length === 0) {
      // No stylists available, skip to date/time
      return {
        text: `Great choice! You've selected:\n\n✂️ *${service.name}*\n💰 $${service.price}\n⏱️ ${service.duration} minutes\n\nNow, please tell me your preferred date and time.\n\nFor example: "October 20th at 2:00 PM"${!user?.email ? "\n\nI'll also need your name and email." : ''}`,
        parseMode: 'Markdown',
      };
    }

    // Show stylist selection
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        ...activeStylists.map(stylist => [
          {
            text: `👤 ${stylist.name}${stylist.bio ? ` - ${stylist.bio.substring(0, 30)}` : ''}`,
            callback_data: `select_stylist_${stylist.id}`,
          },
        ]),
        [{ text: '🎲 No Preference', callback_data: 'select_stylist_any' }],
      ],
    };

    return {
      text: `✅ *${service.name}* selected\n💰 $${service.price} | ⏱️ ${service.duration} minutes\n\nWho would you like as your stylist?`,
      keyboard,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the service selection message
    };
  }

  // Handle stylist selection
  if (callbackData.startsWith('select_stylist_')) {
    const stylistSelection = callbackData.replace('select_stylist_', '');

    // Get context BEFORE updating it
    const context = getBookingContext(userId);
    console.log('[STYLIST SELECT] UserId:', userId);
    console.log('[STYLIST SELECT] Context before update:', JSON.stringify(context));

    if (stylistSelection === 'any') {
      // No preference - don't store stylist ID
      setBookingContext(userId, {
        stylistId: undefined,
        services: context?.services, // Preserve services
      });
    } else {
      // Store selected stylist
      setBookingContext(userId, {
        stylistId: stylistSelection,
        services: context?.services, // Preserve services
      });
    }

    // Get stylist name for confirmation message
    let stylistName = 'any available stylist';
    if (stylistSelection !== 'any') {
      const stylists = await getStylists();
      const selectedStylist = stylists.find(s => s.id === stylistSelection);
      if (selectedStylist) {
        stylistName = selectedStylist.name;
      }
    }

    const serviceName = context?.services?.[0] || 'selected service';
    console.log('[STYLIST SELECT] Service name:', serviceName);

    return {
      text: `✅ *${serviceName}* with ${stylistSelection === 'any' ? 'any available stylist' : `*${stylistName}*`}\n\nWhat date and time would you prefer?\n\nFor example: "October 20th at 2:00 PM"${!user?.email ? "\n\nI'll also need your name and email." : ''}`,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the stylist selection message
    };
  }

  // Handle appointment view/selection
  if (callbackData.startsWith('view_apt_')) {
    const aptId = callbackData.replace('view_apt_', '');
    console.log('[VIEW APPOINTMENT] Appointment ID:', aptId, 'User:', userId);

    try {
      // Fetch the specific appointment
      const { findAppointmentById } = await import('@/lib/database');
      const appointment = await findAppointmentById(aptId);

      if (!appointment) {
        return {
          text: `Sorry, I couldn't find that appointment. It may have been cancelled or completed.`,
          parseMode: 'Markdown',
          keyboard: {
            inline_keyboard: [
              [{ text: '📋 View Appointments', callback_data: 'cmd_appointments' }],
            ],
          },
          editPreviousMessage: true,
        };
      }

      const services = appointment.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(appointment.date);

      const text = `📅 *Appointment Details*\n\n✂️ ${services}\n📅 ${date}\n🕐 ${appointment.time}\n${appointment.stylist ? `👤 Stylist: ${appointment.stylist.name}\n` : ''}⏱️ ${appointment.totalDuration} minutes\n💰 $${appointment.totalPrice}\n\nWhat would you like to do?`;

      const keyboard: InlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Reschedule', callback_data: `reschedule_apt_${aptId}` },
            { text: '❌ Cancel', callback_data: `cancel_apt_${aptId}` },
          ],
          [{ text: '⬅️ Back to Appointments', callback_data: 'cmd_appointments' }],
        ],
      };

      return {
        text,
        keyboard,
        parseMode: 'Markdown',
        editPreviousMessage: true, // Edit the appointments list
      };
    } catch (error) {
      console.error('[VIEW APPOINTMENT] Error:', error);
      return {
        text: `Sorry, I had trouble loading that appointment. Please try again.`,
        parseMode: 'Markdown',
        keyboard: {
          inline_keyboard: [[{ text: '📋 View Appointments', callback_data: 'cmd_appointments' }]],
        },
        editPreviousMessage: true,
      };
    }
  }

  // Handle appointment-specific actions
  if (callbackData.startsWith('cancel_apt_')) {
    const aptId = callbackData.replace('cancel_apt_', '');
    return {
      text: `⚠️ Are you sure you want to cancel this appointment?\n\nThis action cannot be undone.\n\nPlease confirm by saying "Yes, cancel appointment ${aptId}"`,
      parseMode: 'Markdown',
      keyboard: {
        inline_keyboard: [
          [
            { text: '✅ Yes, Cancel It', callback_data: `confirm_cancel_${aptId}` },
            { text: '❌ No, Keep It', callback_data: 'cmd_appointments' },
          ],
        ],
      },
      editPreviousMessage: true, // Edit appointments list message
    };
  }

  if (callbackData.startsWith('reschedule_apt_')) {
    const aptId = callbackData.replace('reschedule_apt_', '');
    return {
      text: `🔄 *Reschedule Appointment*\n\nPlease tell me your preferred new date and time.\n\nFor example: "January 20th at 3:00 PM"`,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit appointments list message
    };
  }

  if (callbackData.startsWith('confirm_cancel_')) {
    const aptId = callbackData.replace('confirm_cancel_', '');
    console.log('[CONFIRM CANCEL] Appointment ID:', aptId, 'User:', userId);
    // This will be handled by the AI with conversation context
    return {
      text: `Confirming cancellation of appointment ${aptId}...`,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the confirmation prompt
    };
  }

  // Handle quick rebooking
  if (callbackData === 'quick_rebook') {
    const context = getBookingContext(userId);

    if (!context?.lastServiceBooked) {
      return {
        text: `I couldn't find your previous booking. Let's book a new appointment!`,
        parseMode: 'Markdown',
        keyboard: {
          inline_keyboard: [[{ text: '📅 Book Appointment', callback_data: 'cmd_book' }]],
        },
      };
    }

    // Pre-fill service and stylist in context
    setBookingContext(userId, {
      services: [context.lastServiceBooked],
      stylistId: context.lastStylistBooked,
      customerName: user?.name,
      customerEmail: user?.email,
    });

    // Get stylist name for display
    let stylistText = 'any available stylist';
    if (context.lastStylistBooked) {
      const stylists = await getStylists();
      const stylist = stylists.find(s => s.id === context.lastStylistBooked);
      if (stylist) {
        stylistText = `*${stylist.name}*`;
      }
    }

    return {
      text: `⭐ *Quick Rebooking*\n\nGreat! You'd like to book:\n✂️ ${context.lastServiceBooked}\n👤 With: ${stylistText}\n\nWhat date and time would you like?\n\nFor example: "October 20th at 2:00 PM"`,
      parseMode: 'Markdown',
    };
  }

  // Handle reminder confirmation buttons
  if (callbackData.startsWith('confirm_reminder_')) {
    const aptId = callbackData.replace('confirm_reminder_', '');
    console.log('[CONFIRM REMINDER] Appointment ID:', aptId, 'User:', userId);
    return {
      text: `✅ *Thank You!*\n\nYour appointment is confirmed. We look forward to seeing you!\n\nIf you need to make any changes, you can use /reschedule or /cancel commands.`,
      parseMode: 'Markdown',
      keyboard: {
        inline_keyboard: [
          [
            { text: '📋 View My Appointments', callback_data: 'cmd_appointments' },
            { text: '❓ Help', callback_data: 'cmd_help' },
          ],
        ],
      },
      editPreviousMessage: true, // Edit the reminder message
    };
  }

  if (callbackData.startsWith('reschedule_reminder_')) {
    const aptId = callbackData.replace('reschedule_reminder_', '');
    console.log('[RESCHEDULE REMINDER] Appointment ID:', aptId, 'User:', userId);
    return {
      text: `🔄 *Reschedule Appointment*\n\nNo problem! Please tell me your preferred new date and time.\n\nFor example: "January 20th at 3:00 PM"`,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the reminder message
    };
  }

  if (callbackData.startsWith('cancel_reminder_')) {
    const aptId = callbackData.replace('cancel_reminder_', '');
    console.log('[CANCEL REMINDER] Appointment ID:', aptId, 'User:', userId);
    return {
      text: `⚠️ *Cancel Appointment*\n\nAre you sure you want to cancel this appointment?\n\nThis action cannot be undone.`,
      parseMode: 'Markdown',
      keyboard: {
        inline_keyboard: [
          [
            { text: '✅ Yes, Cancel It', callback_data: `confirm_cancel_${aptId}` },
            { text: '❌ No, Keep It', callback_data: 'cmd_appointments' },
          ],
        ],
      },
      editPreviousMessage: true, // Edit the reminder message
    };
  }

  // Handle feedback rating buttons
  if (callbackData.startsWith('feedback:')) {
    const parts = callbackData.split(':');
    if (parts.length === 3) {
      const appointmentId = parts[1];
      const rating = parseInt(parts[2]);

      if (!user?.id) {
        return {
          text: `Sorry, I couldn't identify your account. Please try again.`,
          parseMode: 'Markdown',
        };
      }

      try {
        // Submit feedback to the API
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId,
            userId: user.id,
            rating,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }

        // Return thank you message based on rating
        let thankYouMessage = '';
        if (rating === 5) {
          thankYouMessage = `🤩 *Amazing! Thank you!*\n\nWe're thrilled you had a great experience! Your 5-star feedback means the world to us.\n\nWe look forward to seeing you again soon!`;
        } else if (rating === 3) {
          thankYouMessage = `👌 *Thanks for your feedback!*\n\nWe appreciate you taking the time to share your thoughts.\n\nWe're always working to improve our service!`;
        } else {
          thankYouMessage = `😞 *We're sorry to hear that*\n\nThank you for your honest feedback. We take this seriously and will work to improve.\n\nIf you'd like to share more details, please feel free to message us.`;
        }

        return {
          text: thankYouMessage,
          parseMode: 'Markdown',
          editPreviousMessage: true, // Replace the feedback request message
        };
      } catch (error) {
        console.error('Error submitting feedback:', error);
        return {
          text: `Sorry, I had trouble saving your feedback. Please try again or contact us directly.`,
          parseMode: 'Markdown',
        };
      }
    }
  }

  switch (callbackData) {
    case 'cmd_start':
      return handleStartCommand(user);
    case 'cmd_book':
      return handleBookCommand();
    case 'cmd_appointments':
      return handleAppointmentsCommand(user);
    case 'cmd_services':
      return handleServicesCommand();
    case 'cmd_cancel':
      return handleCancelCommand(user);
    case 'cmd_reschedule':
      return handleRescheduleCommand(user);
    case 'cmd_hours':
      return handleHoursCommand();
    case 'cmd_help':
      return handleHelpCommand();
    case 'confirm_booking':
      // Retrieve booking context
      const bookingContext = getBookingContext(userId);

      if (
        !bookingContext ||
        !bookingContext.services ||
        !bookingContext.date ||
        !bookingContext.time
      ) {
        return {
          text: `I'm sorry, I seem to have lost the booking details. Let's start over. What service would you like to book?`,
          parseMode: 'Markdown',
        };
      }

      if (!bookingContext.customerName || !bookingContext.customerEmail) {
        return {
          text: `I need your name and email to complete the booking. Please provide them.`,
          parseMode: 'Markdown',
        };
      }

      // Book the appointment
      try {
        const services = await getServices();
        const servicesToBook = services.filter(s => bookingContext.services?.includes(s.name));

        if (servicesToBook.length === 0) {
          return {
            text: `I couldn't find the services you selected. Please try booking again.`,
            parseMode: 'Markdown',
          };
        }

        // Import booking function
        const { bookNewAppointment } = await import('@/lib/database');

        // Parse date - handle various formats
        let parsedDate: Date;
        try {
          // If date is in format "October 14, 2025" or similar
          parsedDate = new Date(bookingContext.date);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch {
          return {
            text: `I couldn't understand the date format. Please start the booking again.`,
            parseMode: 'Markdown',
          };
        }

        await bookNewAppointment({
          date: parsedDate,
          time: bookingContext.time,
          services: servicesToBook,
          customerName: bookingContext.customerName,
          customerEmail: bookingContext.customerEmail,
          stylistId: bookingContext.stylistId,
        });

        const { formatDisplayDate } = await import('@/lib/timeUtils');
        const formattedDate = formatDisplayDate(parsedDate);

        // Store favorite booking details for quick rebooking
        setBookingContext(userId, {
          lastServiceBooked: servicesToBook[0].name, // Primary service
          lastStylistBooked: bookingContext.stylistId,
          lastBookingDate: Date.now(),
        });

        const keyboard: InlineKeyboard = {
          inline_keyboard: [
            [
              { text: '📋 View My Appointments', callback_data: 'cmd_appointments' },
              { text: '📅 Book Another', callback_data: 'cmd_book' },
            ],
          ],
        };

        return {
          text: `✅ *Booking Confirmed!*\n\n${servicesToBook.map(s => `✂️ ${s.name}`).join('\n')}\n📅 ${formattedDate}\n🕐 ${bookingContext.time}\n💰 $${servicesToBook.reduce((sum, s) => sum + s.price, 0)}\n\nYou'll receive a confirmation email at ${bookingContext.customerEmail} shortly.\n\nThank you for choosing Luxe Cuts!`,
          keyboard,
          parseMode: 'Markdown',
          editPreviousMessage: true, // Edit the confirmation question
        };
      } catch (error: any) {
        return {
          text: `I'm sorry, I couldn't complete the booking. ${error.message}\n\nPlease try again or contact us directly.`,
          parseMode: 'Markdown',
        };
      }
    case 'cancel_booking':
      return {
        text: `No problem! What would you like to change? You can tell me:\n• Different date/time\n• Different service\n• Start over`,
        parseMode: 'Markdown',
      };
    default:
      return {
        text: `I don't recognize that command. Type /help to see what I can do!`,
        parseMode: 'Markdown',
      };
  }
}

/**
 * Generate WhatsApp quick reply suggestions
 */
export function getWhatsAppQuickReplies(): string[] {
  return [
    '📅 Book appointment',
    '📋 My appointments',
    '✂️ View services',
    '❌ Cancel booking',
    '🕐 Business hours',
  ];
}

/**
 * Format WhatsApp welcome message with suggested actions
 */
export function formatWhatsAppWelcome(userName?: string): string {
  const name = userName || 'there';

  return `👋 *Welcome to Luxe Cuts Hair Salon, ${name}!*

I'm your personal booking assistant. Here's what I can help you with:

*Quick Actions:*
• Say "book appointment" to schedule a visit
• Say "my appointments" to view your bookings
• Say "services" to see what we offer
• Say "cancel" to cancel a booking
• Say "hours" for our business hours

Or just ask me anything - I understand natural language! 💬

What would you like to do today?`;
}
