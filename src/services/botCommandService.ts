/**
 * Bot Command Service
 * Handles structured commands and button interactions for both WhatsApp and Telegram
 */

import {
  getServices,
  findAppointmentsByEmail,
  findUserByEmail,
  getStylists,
  getAvailability,
  bookNewAppointment,
} from '@/lib/database';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';
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
 * Helper function to create user-friendly error messages
 */
function createErrorResponse(
  errorType:
    | 'context_lost'
    | 'fetch_failed'
    | 'not_found'
    | 'booking_failed'
    | 'fully_booked'
    | 'generic',
  customMessage?: string,
): CommandResponse {
  switch (errorType) {
    case 'context_lost':
      return {
        text: `❌ *Oops! Session Expired*

Your booking session timed out (this happens after 30 minutes of inactivity).

💡 *Don't worry* - let's start fresh!`,
        keyboard: {
          inline_keyboard: [
            [{ text: '📅 Start New Booking', callback_data: 'cmd_book' }],
            [{ text: '❓ Help', callback_data: 'cmd_help' }],
          ],
        },
        parseMode: 'Markdown',
      };

    case 'fetch_failed':
      return {
        text: `❌ *Couldn't Load Data*

${customMessage || 'I had trouble fetching your information.'}

💡 *This usually resolves itself* - please try again in a moment.`,
        keyboard: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'cmd_appointments' }],
            [{ text: '❓ Contact Support', callback_data: 'cmd_hours' }],
          ],
        },
        parseMode: 'Markdown',
      };

    case 'not_found':
      return {
        text: `❌ *Not Found*

${customMessage || 'The item you requested could not be found.'}

💡 It may have been *cancelled* or *completed* already.`,
        keyboard: {
          inline_keyboard: [
            [{ text: '📋 View Appointments', callback_data: 'cmd_appointments' }],
            [{ text: '🏠 Main Menu', callback_data: 'cmd_start' }],
          ],
        },
        parseMode: 'Markdown',
      };

    case 'booking_failed':
      return {
        text: `❌ *Booking Unsuccessful*

${customMessage || 'Something went wrong while processing your booking.'}

💡 *Common fixes:*
• The time slot may have just been taken
• Try selecting a different time
• Contact us if this persists`,
        keyboard: {
          inline_keyboard: [
            [{ text: '🔄 Choose Different Time', callback_data: 'back_to_dates' }],
            [{ text: '📞 Call Us', callback_data: 'cmd_hours' }],
          ],
        },
        parseMode: 'Markdown',
      };

    case 'fully_booked':
      return {
        text: `❌ *Fully Booked*

${customMessage || 'Unfortunately, this date is completely booked.'}

💡 *Try these alternatives:*
• Browse next week
• Choose a different date
• Call us for cancellation list`,
        keyboard: {
          inline_keyboard: [
            [{ text: '📅 Browse Other Dates', callback_data: 'back_to_dates' }],
            [{ text: '📞 Call for Waitlist', callback_data: 'cmd_hours' }],
          ],
        },
        parseMode: 'Markdown',
      };

    case 'generic':
    default:
      return {
        text: `❌ *Something Went Wrong*

${customMessage || 'An unexpected error occurred.'}

💡 *What to do:*
• Try again in a moment
• Return to main menu
• Contact us if the issue persists`,
        keyboard: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'cmd_start' }],
            [{ text: '📞 Contact Us', callback_data: 'cmd_hours' }],
          ],
        },
        parseMode: 'Markdown',
      };
  }
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
      const time = formatTime12Hour(apt.time);

      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📅 *${date} at ${time}*\n`;
      text += `✂️ ${services} • 💰 $${apt.totalPrice}\n`;
      if (apt.stylist) {
        text += `👤 ${apt.stylist.name} • ⏱️ ${apt.totalDuration} mins\n`;
      } else {
        text += `⏱️ ${apt.totalDuration} mins\n`;
      }
    });

    // Check if user has a favorite service (most recent appointment)
    const context = getBookingContext(user?.email || user?.telegramId?.toString() || '');
    const hasFavorite = context?.lastServiceBooked && context?.lastStylistBooked;

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    // Create inline action buttons for each appointment
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        // Add Reschedule + Cancel buttons for each appointment
        ...appointments.map((apt, index) => [
          {
            text: `✏️ Edit #${index + 1}`,
            callback_data: `reschedule_apt_${apt.id}`,
          },
          {
            text: `❌ Cancel #${index + 1}`,
            callback_data: `cancel_apt_${apt.id}`,
          },
        ]),
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
        [{ text: '📅 Book New Appointment', callback_data: 'cmd_book' }],
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

  const text = `📅 *Let's Book Your Appointment!*

Which service would you like?

👇 *Choose from our services:*`;

  // Service emoji mapping for better UX
  const getServiceEmoji = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("men's") || nameLower.includes('mens')) return '✂️';
    if (nameLower.includes("women's") || nameLower.includes('womens')) return '✂️';
    if (nameLower.includes('color') && !nameLower.includes('highlight')) return '🎨';
    if (nameLower.includes('highlight')) return '✨';
    if (nameLower.includes('balayage')) return '💫';
    if (nameLower.includes('keratin')) return '🌟';
    return '💆';
  };

  // Show all services in organized grid (2 per row for mobile readability)
  const keyboard: InlineKeyboard = {
    inline_keyboard: services.map(s => [
      {
        text: `${getServiceEmoji(s.name)} ${s.name} • $${s.price}`,
        callback_data: `book_service_${s.id}`,
      },
    ]),
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
      return createErrorResponse('not_found', 'The selected service is no longer available.');
    }

    // Store service selection in booking context (preserve currentStepMessageId)
    const existingContext = getBookingContext(userId);
    setBookingContext(userId, {
      services: [service.name],
      customerName: user?.name,
      customerEmail: user?.email,
      currentStepMessageId: existingContext?.currentStepMessageId, // Preserve message ID
    });
    console.log('[SERVICE SELECT] UserId:', userId);
    console.log('[SERVICE SELECT] Stored service:', service.name);
    console.log('[SERVICE SELECT] Preserved message ID:', existingContext?.currentStepMessageId);

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
            text: `👤 ${stylist.name}${stylist.bio ? ` • ${stylist.bio.substring(0, 40)}` : ''}`,
            callback_data: `select_stylist_${stylist.id}`,
          },
        ]),
        [{ text: '🎲 Any Stylist', callback_data: 'select_stylist_any' }],
      ],
    };

    return {
      text: `✅ *${service.name}* selected

💰 Price: $${service.price}
⏱️ Duration: ${service.duration} minutes

Would you like to add more services or continue?`,
      keyboard: {
        inline_keyboard: [
          [{ text: '➕ Add Another Service', callback_data: 'add_another_service' }],
          [{ text: '✅ Continue to Stylist', callback_data: 'proceed_to_stylist' }],
        ],
      },
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the service selection message
    };
  }

  // Handle add another service
  if (callbackData === 'add_another_service') {
    const context = getBookingContext(userId);
    const services = await getServices();

    if (!context?.services) {
      return createErrorResponse('context_lost');
    }

    // Show services except already selected ones
    const selectedServiceNames = context.services;
    const availableServices = services.filter(s => !selectedServiceNames.includes(s.name));

    if (availableServices.length === 0) {
      return {
        text: `✅ You've selected all available services!

*Current Selection:*
${selectedServiceNames.map(s => `• ${s}`).join('\n')}

Ready to choose your stylist?`,
        keyboard: {
          inline_keyboard: [
            [{ text: '✅ Continue to Stylist', callback_data: 'proceed_to_stylist' }],
            [{ text: '❌ Remove a Service', callback_data: 'cmd_book' }],
          ],
        },
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    const getServiceEmoji = (name: string): string => {
      const nameLower = name.toLowerCase();
      if (nameLower.includes("men's") || nameLower.includes('mens')) return '✂️';
      if (nameLower.includes("women's") || nameLower.includes('womens')) return '✂️';
      if (nameLower.includes('color') && !nameLower.includes('highlight')) return '🎨';
      if (nameLower.includes('highlight')) return '✨';
      if (nameLower.includes('balayage')) return '💫';
      if (nameLower.includes('keratin')) return '🌟';
      return '💆';
    };

    return {
      text: `✅ *Selected Services:*
${selectedServiceNames.map(s => `• ${s}`).join('\n')}

➕ *Add another service:*`,
      keyboard: {
        inline_keyboard: availableServices.map(s => [
          {
            text: `${getServiceEmoji(s.name)} ${s.name} • $${s.price}`,
            callback_data: `add_service_${s.id}`,
          },
        ]),
      },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle adding additional service
  if (callbackData.startsWith('add_service_')) {
    const serviceId = parseInt(callbackData.replace('add_service_', ''));
    const services = await getServices();
    const service = services.find(s => s.id === serviceId);

    if (!service) {
      return createErrorResponse('not_found', 'The selected service is no longer available.');
    }

    const context = getBookingContext(userId);
    if (!context?.services) {
      return createErrorResponse('context_lost');
    }

    // Add to existing services
    const updatedServices = [...context.services, service.name];
    setBookingContext(userId, {
      ...context,
      services: updatedServices,
      currentStepMessageId: context.currentStepMessageId,
    });

    const totalPrice = services
      .filter(s => updatedServices.includes(s.name))
      .reduce((sum, s) => sum + s.price, 0);
    const totalDuration = services
      .filter(s => updatedServices.includes(s.name))
      .reduce((sum, s) => sum + s.duration, 0);

    return {
      text: `✅ *${service.name}* added!

*Your Services:*
${updatedServices.map(s => `• ${s}`).join('\n')}

💰 Total: $${totalPrice}
⏱️ Total Duration: ${totalDuration} minutes

Would you like to add more?`,
      keyboard: {
        inline_keyboard: [
          [{ text: '➕ Add Another Service', callback_data: 'add_another_service' }],
          [{ text: '✅ Continue to Stylist', callback_data: 'proceed_to_stylist' }],
        ],
      },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle proceed to stylist selection
  if (callbackData === 'proceed_to_stylist') {
    const context = getBookingContext(userId);

    if (!context?.services) {
      return createErrorResponse('context_lost');
    }

    // Get available stylists
    const stylists = await getStylists();
    const activeStylists = stylists.filter(s => s.isActive);

    if (activeStylists.length === 0) {
      // No stylists available, skip to date/time
      const services = await getServices();
      const selectedServices = services.filter(s => context.services?.includes(s.name));
      const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

      return {
        text: `✅ *Your Services:*
${context.services.map(s => `• ${s}`).join('\n')}

💰 Total: $${totalPrice}
⏱️ Duration: ${totalDuration} minutes

Now, please tell me your preferred date and time.

For example: "October 20th at 2:00 PM"${!user?.email ? "\n\nI'll also need your name and email." : ''}`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    // Show stylist selection
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        ...activeStylists.map(stylist => [
          {
            text: `👤 ${stylist.name}${stylist.bio ? ` • ${stylist.bio.substring(0, 40)}` : ''}`,
            callback_data: `select_stylist_${stylist.id}`,
          },
        ]),
        [{ text: '🎲 Any Stylist', callback_data: 'select_stylist_any' }],
      ],
    };

    const services = await getServices();
    const selectedServices = services.filter(s => context.services?.includes(s.name));
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

    return {
      text: `✅ *Your Services:*
${context.services.map(s => `• ${s}`).join('\n')}

💰 Total: $${totalPrice}
⏱️ Duration: ${totalDuration} minutes

👇 *Choose your stylist:*`,
      keyboard,
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle stylist selection
  if (callbackData.startsWith('select_stylist_')) {
    const stylistSelection = callbackData.replace('select_stylist_', '');

    // Get context BEFORE updating it
    const context = getBookingContext(userId);
    console.log('[STYLIST SELECT] UserId:', userId);
    console.log('[STYLIST SELECT] Context before update:', JSON.stringify(context));
    console.log('[STYLIST SELECT] Current message ID:', context?.currentStepMessageId);

    if (stylistSelection === 'any') {
      // No preference - don't store stylist ID
      setBookingContext(userId, {
        stylistId: undefined,
        services: context?.services, // Preserve services
        currentStepMessageId: context?.currentStepMessageId, // Preserve message ID
      });
    } else {
      // Store selected stylist
      setBookingContext(userId, {
        stylistId: stylistSelection,
        services: context?.services, // Preserve services
        currentStepMessageId: context?.currentStepMessageId, // Preserve message ID
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

    // Generate date picker buttons (today + next 6 days) in 2-column layout
    const dateButtons: InlineKeyboardButton[][] = [];
    const today = new Date();
    const weekOffset = context?.currentWeekOffset || 0;

    // Calculate date range based on week offset
    const startDayOffset = weekOffset * 7;

    for (let i = 0; i < 7; i += 2) {
      const date1 = new Date(today);
      date1.setDate(today.getDate() + startDayOffset + i);
      const dateStr1 = date1.toISOString().split('T')[0];

      const date2 = new Date(today);
      date2.setDate(today.getDate() + startDayOffset + i + 1);
      const dateStr2 = date2.toISOString().split('T')[0];

      // Format display with day name
      const formatDateButton = (date: Date, dayIndex: number) => {
        const absoluteDay = startDayOffset + dayIndex;
        if (absoluteDay === 0) {
          return `📅 Today (${formatDisplayDate(date).split(' ')[0]} ${formatDisplayDate(date).split(' ')[1]})`;
        } else if (absoluteDay === 1) {
          return `📅 Tomorrow (${formatDisplayDate(date).split(' ')[0]} ${formatDisplayDate(date).split(' ')[1]})`;
        } else {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return `📅 ${dayName}, ${formatDisplayDate(date)}`;
        }
      };

      const row: InlineKeyboardButton[] = [
        {
          text: formatDateButton(date1, i),
          callback_data: `pick_date_${dateStr1}`,
        },
      ];

      // Add second column if not the last row
      if (i + 1 < 7) {
        row.push({
          text: formatDateButton(date2, i + 1),
          callback_data: `pick_date_${dateStr2}`,
        });
      }

      dateButtons.push(row);
    }

    // Add week navigation buttons
    const navigationRow: InlineKeyboardButton[] = [];
    if (weekOffset > 0) {
      navigationRow.push({
        text: '⬅️ Previous Week',
        callback_data: `week_nav_${weekOffset - 1}`,
      });
    }
    navigationRow.push({
      text: '➡️ Next Week',
      callback_data: `week_nav_${weekOffset + 1}`,
    });
    dateButtons.push(navigationRow);

    // Add "Other Date" option for custom date entry
    dateButtons.push([
      {
        text: '🗓️ Choose Other Date',
        callback_data: 'custom_date_entry',
      },
    ]);

    const keyboard: InlineKeyboard = {
      inline_keyboard: dateButtons,
    };

    return {
      text: `✅ *${serviceName}* with ${stylistSelection === 'any' ? 'any available stylist' : `*${stylistName}*`}

📅 *Choose a date:*

_Tip: Select from quick picks or choose "Other Date" to enter a future date_`,
      keyboard,
      parseMode: 'Markdown',
      editPreviousMessage: true, // Edit the stylist selection message
    };
  }

  // Handle week navigation
  if (callbackData.startsWith('week_nav_')) {
    const weekOffset = parseInt(callbackData.replace('week_nav_', ''));
    const context = getBookingContext(userId);

    if (!context?.services || !context.services[0]) {
      return createErrorResponse('context_lost');
    }

    // Store the week offset
    setBookingContext(userId, {
      ...context,
      currentWeekOffset: weekOffset,
    });

    // Generate date picker with new week offset
    const dateButtons: InlineKeyboardButton[][] = [];
    const today = new Date();
    const startDayOffset = weekOffset * 7;

    for (let i = 0; i < 7; i += 2) {
      const date1 = new Date(today);
      date1.setDate(today.getDate() + startDayOffset + i);
      const dateStr1 = date1.toISOString().split('T')[0];

      const date2 = new Date(today);
      date2.setDate(today.getDate() + startDayOffset + i + 1);
      const dateStr2 = date2.toISOString().split('T')[0];

      const formatDateButton = (date: Date, dayIndex: number) => {
        const absoluteDay = startDayOffset + dayIndex;
        if (absoluteDay === 0) {
          return `📅 Today (${formatDisplayDate(date).split(' ')[0]} ${formatDisplayDate(date).split(' ')[1]})`;
        } else if (absoluteDay === 1) {
          return `📅 Tomorrow (${formatDisplayDate(date).split(' ')[0]} ${formatDisplayDate(date).split(' ')[1]})`;
        } else {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return `📅 ${dayName}, ${formatDisplayDate(date)}`;
        }
      };

      const row: InlineKeyboardButton[] = [
        {
          text: formatDateButton(date1, i),
          callback_data: `pick_date_${dateStr1}`,
        },
      ];

      if (i + 1 < 7) {
        row.push({
          text: formatDateButton(date2, i + 1),
          callback_data: `pick_date_${dateStr2}`,
        });
      }

      dateButtons.push(row);
    }

    // Add week navigation buttons
    const navigationRow: InlineKeyboardButton[] = [];
    if (weekOffset > 0) {
      navigationRow.push({
        text: '⬅️ Previous Week',
        callback_data: `week_nav_${weekOffset - 1}`,
      });
    }
    navigationRow.push({
      text: '➡️ Next Week',
      callback_data: `week_nav_${weekOffset + 1}`,
    });
    dateButtons.push(navigationRow);

    dateButtons.push([
      {
        text: '🗓️ Choose Other Date',
        callback_data: 'custom_date_entry',
      },
    ]);

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 *Choose a date:*

_Tip: Use arrows to browse weeks ahead_`,
      keyboard: { inline_keyboard: dateButtons },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle date selection
  if (callbackData.startsWith('pick_date_')) {
    const dateStr = callbackData.replace('pick_date_', '');
    const context = getBookingContext(userId);

    console.log('[DATE SELECT] UserId:', userId);
    console.log('[DATE SELECT] Selected date:', dateStr);

    if (!context?.services || !context.services[0]) {
      return createErrorResponse('context_lost');
    }

    // Store selected date in context
    setBookingContext(userId, {
      ...context,
      date: dateStr,
    });

    // Get availability for the selected date
    const selectedDate = new Date(dateStr);
    const availableSlots = await getAvailability(selectedDate);

    if (availableSlots.length === 0) {
      // No slots available - suggest next available dates
      const suggestions: { date: Date; slots: string[] }[] = [];

      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + i);
        const nextSlots = await getAvailability(nextDate);

        if (nextSlots.length > 0 && suggestions.length < 3) {
          suggestions.push({ date: nextDate, slots: nextSlots.slice(0, 3) });
        }

        if (suggestions.length >= 3) break;
      }

      const suggestionButtons: InlineKeyboardButton[][] = suggestions.map(({ date, slots }) => [
        {
          text: `📅 ${formatDisplayDate(date)} (${slots.length} slots available)`,
          callback_data: `pick_date_${date.toISOString().split('T')[0]}`,
        },
      ]);

      suggestionButtons.push([{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]);

      return {
        text: `❌ Sorry, ${formatDisplayDate(selectedDate)} is fully booked.

📅 *Here are the nearest available dates:*`,
        keyboard: { inline_keyboard: suggestionButtons },
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    // Group time slots by time of day and create 3-column layout
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    const timeButtons: InlineKeyboardButton[][] = [];

    // Helper function to create 3-column rows
    const createTimeRows = (slots: string[]): InlineKeyboardButton[][] => {
      const rows: InlineKeyboardButton[][] = [];
      for (let i = 0; i < slots.length; i += 3) {
        const row: InlineKeyboardButton[] = [];
        for (let j = 0; j < 3 && i + j < slots.length; j++) {
          const slot = slots[i + j];
          row.push({
            text: `🕐 ${formatTime12Hour(slot)}`,
            callback_data: `pick_time_${slot}`,
          });
        }
        rows.push(row);
      }
      return rows;
    };

    // Add morning section
    if (morning.length > 0) {
      timeButtons.push([{ text: '☀️ Morning', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(morning));
    }

    // Add afternoon section
    if (afternoon.length > 0) {
      timeButtons.push([{ text: '🌤️ Afternoon', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(afternoon));
    }

    // Add evening section
    if (evening.length > 0) {
      timeButtons.push([{ text: '🌙 Evening', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(evening));
    }

    // Add back button
    timeButtons.push([{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]);

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 ${formatDisplayDate(selectedDate)}

⏰ *Choose a time:*`,
      keyboard: { inline_keyboard: timeButtons },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle back to dates button
  if (callbackData === 'back_to_dates') {
    const context = getBookingContext(userId);

    if (!context?.services || !context.services[0]) {
      return createErrorResponse('context_lost');
    }

    // Generate date picker buttons again
    const dateButtons: InlineKeyboardButton[][] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      let displayText = '';
      if (i === 0) {
        displayText = `📅 Today (${formatDisplayDate(date)})`;
      } else if (i === 1) {
        displayText = `📅 Tomorrow (${formatDisplayDate(date)})`;
      } else {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        displayText = `📅 ${dayName}, ${formatDisplayDate(date)}`;
      }

      dateButtons.push([
        {
          text: displayText,
          callback_data: `pick_date_${dateStr}`,
        },
      ]);
    }

    // Add "Other Date" option for custom date entry
    dateButtons.push([
      {
        text: '📅 Other Date',
        callback_data: 'custom_date_entry',
      },
    ]);

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 *Choose a date:*

_Tip: Select from quick picks or choose "Other Date" to enter a future date_`,
      keyboard: { inline_keyboard: dateButtons },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle custom date entry request
  if (callbackData === 'custom_date_entry') {
    const context = getBookingContext(userId);

    if (!context?.services || !context.services[0]) {
      return {
        text: `Sorry, I lost track of your booking. Please start over with /book`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    // Set a flag to indicate we're in custom date mode
    setBookingContext(userId, {
      ...context,
      awaitingCustomDate: true,
    });

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 *Enter your preferred date*

Type your desired date in natural language.

*Examples:*
• "November 15th"
• "Next Friday"
• "December 5th"
• "3 weeks from now"
• "First Monday of December"

Choose a quick suggestion or go back:`,
      keyboard: {
        inline_keyboard: [
          [
            { text: '📅 Next Week', callback_data: 'quick_date_next_week' },
            { text: '📅 Next Month', callback_data: 'quick_date_next_month' },
          ],
          [{ text: '⬅️ Back to Quick Picks', callback_data: 'back_to_dates' }],
        ],
      },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle time selection
  if (callbackData.startsWith('pick_time_')) {
    const timeStr = callbackData.replace('pick_time_', '');
    const context = getBookingContext(userId);

    console.log('[TIME SELECT] UserId:', userId);
    console.log('[TIME SELECT] Selected time:', timeStr);

    if (!context?.services || !context.services[0] || !context.date) {
      return createErrorResponse('context_lost');
    }

    // Store selected time in context
    setBookingContext(userId, {
      ...context,
      time: timeStr,
    });

    // Get service details for summary
    const services = await getServices();
    const service = services.find(s => s.name === context.services?.[0]);

    if (!service) {
      return {
        text: `Sorry, I couldn't find that service. Please start over with /book`,
        parseMode: 'Markdown',
      };
    }

    // Get stylist name
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'Any available stylist'
      : 'Any available stylist';

    // Show confirmation review screen
    const selectedDate = new Date(context.date);
    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [{ text: '✅ Confirm Booking', callback_data: 'confirm_booking_final' }],
        [
          { text: '🔄 Change Time', callback_data: 'back_to_dates' },
          { text: '❌ Cancel', callback_data: 'cancel_booking' },
        ],
      ],
    };

    return {
      text: `📋 *Review Your Booking*

✂️ *Service:* ${service.name}
👤 *Stylist:* ${stylistName}
📅 *Date:* ${formatDisplayDate(selectedDate)}
🕐 *Time:* ${formatTime12Hour(timeStr)}
⏱️ *Duration:* ${service.duration} minutes
💰 *Price:* $${service.price}

Is this correct?`,
      keyboard,
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle cancel booking during review
  if (callbackData === 'cancel_booking') {
    const context = getBookingContext(userId);

    // Clear booking context
    if (context) {
      setBookingContext(userId, {
        currentStepMessageId: context.currentStepMessageId,
      });
    }

    return {
      text: `❌ Booking cancelled.

You can start a new booking anytime with /book`,
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Handle final booking confirmation
  if (callbackData === 'confirm_booking_final') {
    const context = getBookingContext(userId);

    console.log('[CONFIRM BOOKING] UserId:', userId);
    console.log('[CONFIRM BOOKING] Context:', JSON.stringify(context));

    if (!context?.services || !context.services[0] || !context.date || !context.time) {
      return {
        text: `Sorry, I lost track of your booking. Please start over with /book`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    // Get service details
    const services = await getServices();
    const service = services.find(s => s.name === context.services?.[0]);

    if (!service) {
      return {
        text: `Sorry, I couldn't find that service. Please start over with /book`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    // Validate user information
    if (!user?.name || !user?.email) {
      return {
        text: `⚠️ I need your name and email to complete the booking.

Please make sure you're logged in and try again with /book`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    try {
      // Book the appointment
      const appointment = await bookNewAppointment({
        date: new Date(context.date),
        time: context.time,
        services: [service],
        stylistId: context.stylistId,
        customerName: user.name,
        customerEmail: user.email,
        userId: user.id,
      });

      // Clear booking context
      setBookingContext(userId, {
        currentStepMessageId: context.currentStepMessageId,
      });

      // Get stylist name
      const stylistName = appointment.stylistId
        ? (await getStylists()).find(s => s.id === appointment.stylistId)?.name
        : undefined;

      // Success message
      return {
        text: `✅ *Booking Confirmed!*

Your appointment has been successfully booked.

✂️ *Service:* ${service.name}
${stylistName ? `👤 *Stylist:* ${stylistName}\n` : ''}📅 *Date:* ${formatDisplayDate(new Date(context.date))}
🕐 *Time:* ${formatTime12Hour(context.time)}
⏱️ *Duration:* ${service.duration} minutes
💰 *Price:* $${service.price}

🔔 You'll receive a reminder 24 hours before your appointment via ${user.authProvider === 'telegram' ? 'Telegram' : 'WhatsApp'}.

Thank you for choosing Luxe Cuts! 💇`,
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    } catch (error: any) {
      console.error('[BOOKING ERROR]', error);

      // Check if it's an availability error
      if (error.message && error.message.includes('Not enough consecutive slots')) {
        return {
          text: `❌ *Booking Failed*

Sorry, the selected time slot is no longer available. Someone may have just booked it.

Please try a different time:`,
          keyboard: {
            inline_keyboard: [
              [{ text: '🔄 Choose Different Time', callback_data: 'back_to_dates' }],
            ],
          },
          parseMode: 'Markdown',
          editPreviousMessage: true,
        };
      }

      // Generic error
      return {
        text: `❌ *Booking Failed*

Sorry, something went wrong while booking your appointment.

Error: ${error.message}

Please try again or contact us directly.`,
        keyboard: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'back_to_dates' }],
            [{ text: '❌ Cancel', callback_data: 'cancel_booking' }],
          ],
        },
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }
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
          ...createErrorResponse('not_found', 'This appointment could not be found.'),
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
        ...createErrorResponse('fetch_failed', 'Unable to load appointment details.'),
        editPreviousMessage: true,
      };
    }
  }

  // Handle appointment-specific actions
  if (callbackData.startsWith('cancel_apt_')) {
    const aptId = callbackData.replace('cancel_apt_', '');
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

    try {
      // Fetch appointment details before deleting (for confirmation message)
      const { findAppointmentById, deleteAppointment } = await import('@/lib/database');
      const appointment = await findAppointmentById(aptId);

      if (!appointment) {
        return {
          text: `Sorry, I couldn't find that appointment. It may have already been cancelled.`,
          parseMode: 'Markdown',
          keyboard: {
            inline_keyboard: [
              [{ text: '📋 View Appointments', callback_data: 'cmd_appointments' }],
            ],
          },
          editPreviousMessage: true,
        };
      }

      // Delete the appointment
      await deleteAppointment(aptId);

      // Build success message with appointment details
      const services = appointment.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(appointment.date);

      const text = `✅ *Appointment Cancelled*\n\nYour appointment has been successfully cancelled:\n\n✂️ ${services}\n📅 ${date}\n🕐 ${appointment.time}\n💰 $${appointment.totalPrice}\n\nWe hope to see you again soon!`;

      const keyboard: InlineKeyboard = {
        inline_keyboard: [
          [
            { text: '📅 Book New Appointment', callback_data: 'cmd_book' },
            { text: '📋 View Appointments', callback_data: 'cmd_appointments' },
          ],
        ],
      };

      return {
        text,
        keyboard,
        parseMode: 'Markdown',
        editPreviousMessage: true, // Edit the confirmation prompt
      };
    } catch (error: any) {
      console.error('[CONFIRM CANCEL] Error:', error);
      return {
        text: `Sorry, I couldn't cancel the appointment. ${error.message || 'Please try again or contact us directly.'}`,
        parseMode: 'Markdown',
        keyboard: {
          inline_keyboard: [[{ text: '📋 View Appointments', callback_data: 'cmd_appointments' }]],
        },
        editPreviousMessage: true,
      };
    }
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

  // Handle no-op callbacks (section headers that shouldn't do anything)
  if (callbackData === 'no_op') {
    return {
      text: 'Please select a time slot from the options below.',
      parseMode: 'Markdown',
    };
  }

  // Handle quick date suggestions
  if (callbackData === 'quick_date_next_week') {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateStr = nextWeek.toISOString().split('T')[0];

    // Store date in context and proceed to time selection
    const context = getBookingContext(userId);
    if (!context?.services) {
      return createErrorResponse('context_lost');
    }

    setBookingContext(userId, {
      ...context,
      date: dateStr,
      awaitingCustomDate: false,
    });

    // Get availability and show time slots
    const availableSlots = await getAvailability(nextWeek);

    if (availableSlots.length === 0) {
      return {
        text: `Sorry, ${formatDisplayDate(nextWeek)} is fully booked. Please try a different date.`,
        keyboard: {
          inline_keyboard: [[{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]],
        },
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    // Group and show time slots
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    });

    const createTimeRows = (slots: string[]): InlineKeyboardButton[][] => {
      const rows: InlineKeyboardButton[][] = [];
      for (let i = 0; i < slots.length; i += 3) {
        const row: InlineKeyboardButton[] = [];
        for (let j = 0; j < 3 && i + j < slots.length; j++) {
          const slot = slots[i + j];
          row.push({
            text: `🕐 ${formatTime12Hour(slot)}`,
            callback_data: `pick_time_${slot}`,
          });
        }
        rows.push(row);
      }
      return rows;
    };

    const timeButtons: InlineKeyboardButton[][] = [];
    if (morning.length > 0) {
      timeButtons.push([{ text: '☀️ Morning', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(morning));
    }
    if (afternoon.length > 0) {
      timeButtons.push([{ text: '🌤️ Afternoon', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(afternoon));
    }
    if (evening.length > 0) {
      timeButtons.push([{ text: '🌙 Evening', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(evening));
    }
    timeButtons.push([{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]);

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 ${formatDisplayDate(nextWeek)}

⏰ *Choose a time:*`,
      keyboard: { inline_keyboard: timeButtons },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  if (callbackData === 'quick_date_next_month') {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dateStr = nextMonth.toISOString().split('T')[0];

    const context = getBookingContext(userId);
    if (!context?.services) {
      return createErrorResponse('context_lost');
    }

    setBookingContext(userId, {
      ...context,
      date: dateStr,
      awaitingCustomDate: false,
    });

    const availableSlots = await getAvailability(nextMonth);

    if (availableSlots.length === 0) {
      return {
        text: `Sorry, ${formatDisplayDate(nextMonth)} is fully booked. Please try a different date.`,
        keyboard: {
          inline_keyboard: [[{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]],
        },
        parseMode: 'Markdown',
        editPreviousMessage: true,
      };
    }

    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);
    });

    const createTimeRows = (slots: string[]): InlineKeyboardButton[][] => {
      const rows: InlineKeyboardButton[][] = [];
      for (let i = 0; i < slots.length; i += 3) {
        const row: InlineKeyboardButton[] = [];
        for (let j = 0; j < 3 && i + j < slots.length; j++) {
          const slot = slots[i + j];
          row.push({
            text: `🕐 ${formatTime12Hour(slot)}`,
            callback_data: `pick_time_${slot}`,
          });
        }
        rows.push(row);
      }
      return rows;
    };

    const timeButtons: InlineKeyboardButton[][] = [];
    if (morning.length > 0) {
      timeButtons.push([{ text: '☀️ Morning', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(morning));
    }
    if (afternoon.length > 0) {
      timeButtons.push([{ text: '🌤️ Afternoon', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(afternoon));
    }
    if (evening.length > 0) {
      timeButtons.push([{ text: '🌙 Evening', callback_data: 'no_op' }]);
      timeButtons.push(...createTimeRows(evening));
    }
    timeButtons.push([{ text: '⬅️ Back to Dates', callback_data: 'back_to_dates' }]);

    const serviceName = context.services[0];
    const stylistName = context.stylistId
      ? (await getStylists()).find(s => s.id === context.stylistId)?.name || 'any available stylist'
      : 'any available stylist';

    return {
      text: `✅ *${serviceName}* with ${stylistName}

📅 ${formatDisplayDate(nextMonth)}

⏰ *Choose a time:*`,
      keyboard: { inline_keyboard: timeButtons },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  switch (callbackData) {
    case 'cmd_start':
      const startResponse = await handleStartCommand(user);
      return { ...startResponse, editPreviousMessage: true };
    case 'cmd_book':
      return handleBookCommand();
    case 'cmd_appointments':
      const appointmentsResponse = await handleAppointmentsCommand(user);
      return { ...appointmentsResponse, editPreviousMessage: true };
    case 'cmd_services':
      const servicesResponse = await handleServicesCommand();
      return { ...servicesResponse, editPreviousMessage: true };
    case 'cmd_cancel':
      return handleCancelCommand(user);
    case 'cmd_reschedule':
      return handleRescheduleCommand(user);
    case 'cmd_hours':
      const hoursResponse = await handleHoursCommand();
      return { ...hoursResponse, editPreviousMessage: true };
    case 'cmd_help':
      const helpResponse = await handleHelpCommand();
      return { ...helpResponse, editPreviousMessage: true };
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
