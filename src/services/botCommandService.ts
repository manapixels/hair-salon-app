/**
 * Bot Command Service
 * Handles structured commands and button interactions for both WhatsApp and Telegram
 */

import { getServices, findAppointmentsByEmail, findUserByEmail } from '@/lib/database';
import { formatDisplayDate } from '@/lib/timeUtils';
import type { User } from '@/types';

/**
 * Command response type with optional inline keyboards
 */
export interface CommandResponse {
  text: string;
  keyboard?: InlineKeyboard;
  parseMode?: 'Markdown' | 'HTML';
}

/**
 * Inline keyboard structure for Telegram
 */
export interface InlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
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
  text += `Here's what we offer at Luxe Cuts:\n\n`;

  services.forEach(service => {
    text += `*${service.name}* - $${service.price}\n`;
    text += `⏱️ ${service.duration} minutes\n`;
    text += `${service.description}\n\n`;
  });

  text += `\nReady to book? Just let me know which service you'd like!`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [[{ text: '📅 Book Now', callback_data: 'cmd_book' }]],
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

    text += `\nNeed to make changes? I can help you cancel or reschedule!`;

    const keyboard: InlineKeyboard = {
      inline_keyboard: [
        [
          { text: '❌ Cancel Booking', callback_data: 'cmd_cancel' },
          { text: '🔄 Reschedule', callback_data: 'cmd_reschedule' },
        ],
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
  const text = `📅 *Let's Book Your Appointment!*\n\nTo get started, I'll need a few details:\n\n1️⃣ Which service would you like?\n2️⃣ Your preferred date\n3️⃣ Your preferred time\n4️⃣ Your name and email\n\nYou can say something like:\n"I'd like a haircut on January 15th at 2:00 PM. My name is Sarah and my email is sarah@example.com"\n\nOr click below to see our services first!`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [[{ text: '✂️ View Services', callback_data: 'cmd_services' }]],
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

    let text = `❌ *Cancel Appointment*\n\nWhich appointment would you like to cancel?\n\n`;

    appointments.forEach((apt, index) => {
      const services = apt.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(apt.date);
      text += `*${index + 1}. ${date} at ${apt.time}*\n`;
      text += `   ${services}\n\n`;
    });

    text += `Please tell me which one you'd like to cancel (e.g., "Cancel appointment #1")`;

    return { text, parseMode: 'Markdown' };
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

    let text = `🔄 *Reschedule Appointment*\n\nWhich appointment would you like to reschedule?\n\n`;

    appointments.forEach((apt, index) => {
      const services = apt.services.map(s => s.name).join(', ');
      const date = formatDisplayDate(apt.date);
      text += `*${index + 1}. ${date} at ${apt.time}*\n`;
      text += `   ${services}\n\n`;
    });

    text += `Please tell me:\n1. Which appointment to reschedule\n2. Your preferred new date and time\n\nFor example: "Reschedule appointment #1 to January 20th at 3:00 PM"`;

    return { text, parseMode: 'Markdown' };
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
  const text = `🕐 *Business Hours*\n\n*Luxe Cuts Hair Salon*\n\n📍 Location: [Your Address Here]\n📞 Phone: [Your Phone Number]\n\n*Opening Hours:*\nMonday - Friday: 9:00 AM - 6:00 PM\nSaturday: 9:00 AM - 3:00 PM\nSunday: Closed\n\n*Walk-ins welcome* or book your appointment in advance!`;

  const keyboard: InlineKeyboard = {
    inline_keyboard: [[{ text: '📅 Book Appointment', callback_data: 'cmd_book' }]],
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
): Promise<CommandResponse> {
  switch (callbackData) {
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
      return {
        text: `Perfect! I'll proceed with booking your appointment. Please confirm by saying "Yes, book it!"`,
        parseMode: 'Markdown',
      };
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
