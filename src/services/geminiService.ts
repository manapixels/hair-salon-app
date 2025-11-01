import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';
import type { WhatsAppMessage } from '../types';
import {
  getServices,
  getAvailability,
  bookNewAppointment,
  cancelAppointment as dbCancelAppointment,
  rescheduleAppointment,
  findAppointmentsByEmail,
  updateAppointment,
  findAppointmentById,
  findUserByEmail,
} from '../lib/database';
import { updateCalendarEvent } from '../lib/google';
import { sendAppointmentConfirmation } from './messagingService';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';

// This function is now designed to be run on the server.
// The API KEY should be set as an environment variable on the server.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('CRITICAL: API_KEY for Gemini is not set in server environment variables.');
}

// Only initialize GoogleGenAI on the server side
let ai: GoogleGenAI | null = null;
if (typeof window === 'undefined' && API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const getServicesList: FunctionDeclaration = {
  name: 'getServicesList',
  description: 'Get the list of available hair salon services with their prices and descriptions.',
  parameters: { type: Type.OBJECT, properties: {} },
};

const checkAvailability: FunctionDeclaration = {
  name: 'checkAvailability',
  description: 'Check available appointment time slots for a specific date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'The date to check for availability, in YYYY-MM-DD format.',
      },
    },
    required: ['date'],
  },
};

const bookAppointment: FunctionDeclaration = {
  name: 'bookAppointment',
  description: 'Book a new appointment for one or more services.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: "The customer's full name." },
      customerEmail: { type: Type.STRING, description: "The customer's email address." },
      services: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'An array of service names the customer wants to book.',
      },
      date: { type: Type.STRING, description: 'The date of the appointment in YYYY-MM-DD format.' },
      time: {
        type: Type.STRING,
        description: 'The start time of the appointment in HH:MM format.',
      },
    },
    required: ['customerName', 'customerEmail', 'services', 'date', 'time'],
  },
};

const cancelAppointment: FunctionDeclaration = {
  name: 'cancelAppointment',
  description: 'Cancel an existing appointment for a customer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerEmail: {
        type: Type.STRING,
        description: "The customer's email address used for the booking.",
      },
      date: {
        type: Type.STRING,
        description: 'The date of the appointment to cancel, in YYYY-MM-DD format.',
      },
      time: {
        type: Type.STRING,
        description: 'The start time of the appointment to cancel, in HH:MM format.',
      },
    },
    required: ['customerEmail', 'date', 'time'],
  },
};

const listMyAppointments: FunctionDeclaration = {
  name: 'listMyAppointments',
  description: 'List all upcoming appointments for a customer.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerEmail: {
        type: Type.STRING,
        description: "The customer's email address to look up appointments.",
      },
    },
    required: ['customerEmail'],
  },
};

const modifyAppointment: FunctionDeclaration = {
  name: 'modifyAppointment',
  description: 'Modify an existing appointment - change date, time, or services.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appointmentId: {
        type: Type.STRING,
        description:
          'The ID of the appointment to modify (get this from listMyAppointments first).',
      },
      newDate: {
        type: Type.STRING,
        description: 'The new date for the appointment, in YYYY-MM-DD format (optional).',
      },
      newTime: {
        type: Type.STRING,
        description: 'The new start time for the appointment, in HH:MM format (optional).',
      },
      newServices: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'New array of service names for the appointment (optional).',
      },
    },
    required: ['appointmentId'],
  },
};

export interface MessageResponse {
  text: string;
  buttons?: Array<{ text: string; data: string }>;
  bookingDetails?: {
    customerName?: string;
    customerEmail?: string;
    services?: string[];
    date?: string;
    time?: string;
  };
}

export const handleWhatsAppMessage = async (
  userInput: string,
  chatHistory: Pick<WhatsAppMessage, 'text' | 'sender'>[],
  userContext?: { name?: string; email?: string } | null,
  bookingContext?: {
    services?: string[];
    stylistId?: string;
    date?: string;
    time?: string;
  } | null,
): Promise<MessageResponse> => {
  if (!API_KEY || !ai) {
    return {
      text: "I'm sorry, my connection to my brain is currently offline. Please try again later.",
    };
  }

  const allServices = await getServices();
  const servicesListString = allServices
    .map(s => `${s.name}: $${s.price} (${s.duration} mins)`)
    .join('\n');

  // Build user context string
  const userContextString =
    userContext?.name && userContext?.email
      ? `\n\nIMPORTANT - Current User Information:
- Customer Name: ${userContext.name}
- Customer Email: ${userContext.email}

When booking appointments, ALWAYS use this customer's name and email automatically. DO NOT ask them to provide it again - they are already logged in and authenticated.`
      : '';

  const systemInstruction = `You are a friendly and efficient AI assistant for 'Luxe Cuts' hair salon.
Your goal is to help users inquire about services, book appointments, cancel them, view their appointments, and modify existing bookings.
Today's date is ${formatDisplayDate(new Date())}.
Do not ask for information you can derive, like the year if the user says "next Tuesday".
Be conversational and helpful.${userContextString}

IMPORTANT - Conversation Context:
If you see messages in the conversation history that start with "System Context:", these contain information the user already provided via button clicks:
- "User has selected service: X" means the user ALREADY chose service X by clicking a button
- "User has selected stylist ID: Y" means the user ALREADY chose a stylist by clicking a button

ALWAYS use this information when building bookings. NEVER ask the user for information that is already present in System Context messages. If you see "System Context: User has selected service: Men's Haircut", treat it as if the user said "I want Men's Haircut" and proceed to the next step (asking for date/time).

Service Matching: When users refer to services informally (e.g., "men's haircut", "haircut", "color"), match them to the exact service names in the Available Services list below. For example:
- "men's haircut" or "mens haircut" → "Men's Haircut"
- "women's haircut" or "womens haircut" → "Women's Haircut"
- "color" → "Single Process Color"
- "highlights" → "Partial Highlights" or "Full Highlights" (ask which)

Booking: When a user provides a date/time for booking:
1. If the user provides BOTH date AND time (e.g., "October 20th at 3pm"):
   - Proceed directly to confirm the booking details with the user
   - DO NOT call checkAvailability - we'll validate during booking
   - Ask: "Does that sound correct?" and show confirmation buttons
2. If the user only provides a DATE (e.g., "October 20th"):
   - Call checkAvailability to show them available times for that day
3. IMPORTANT: Keep the conversation context - if they say "2pm works" after seeing alternatives, you know which date they mean
4. ${userContext?.name && userContext?.email ? 'Use the customer name and email from the user information above.' : " You must have the customer's name, email, desired services, date, and time."}

Canceling: ${userContext?.email ? 'Use the customer email from the user information above.' : "You MUST ask for the customer's email address."} You also need the appointment date and time to uniquely identify the appointment to be cancelled.

Viewing Appointments: ${userContext?.email ? 'Use the customer email from the user information above to look up appointments.' : "Use listMyAppointments with the customer's email to show their upcoming appointments."}

Modifying Appointments: To modify an appointment:
1. First use listMyAppointments to find the customer's appointments${userContext?.email ? ' (use the email from user information)' : ''}
2. Show them their appointments with clear IDs/numbers
3. Ask what they want to change (date, time, or services)
4. Use modifyAppointment with the appointment ID and new details
5. Confirm the changes were successful

Always be helpful and guide users through the process step by step.

Available Services:
${servicesListString}
`;

  try {
    // Build conversation history with context
    let conversationContext = '';
    if (chatHistory && chatHistory.length > 0) {
      conversationContext = chatHistory
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
        .join('\n');
      conversationContext += '\n';
    }
    conversationContext += `User: ${userInput}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationContext,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              getServicesList,
              checkAvailability,
              bookAppointment,
              cancelAppointment,
              listMyAppointments,
              modifyAppointment,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const { name, args } = fc;

      if (name === 'getServicesList') {
        return { text: `Here are the services we offer:\n\n${servicesListString}` };
      }

      if (name === 'checkAvailability') {
        const date = new Date(args?.date as string);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const slots = await getAvailability(utcDate);

        if (slots.length > 0) {
          return {
            text: `On ${formatDisplayDate(utcDate)}, the following time slots are available:\n${slots.join(', ')}`,
          };
        } else {
          // No slots available - suggest nearest alternatives
          const suggestions: string[] = [];

          // Check next 7 days for available slots
          for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(utcDate);
            nextDate.setDate(nextDate.getDate() + i);
            const nextSlots = await getAvailability(nextDate);

            if (nextSlots.length > 0 && suggestions.length < 3) {
              // Show up to 3 earliest times for this date
              const topSlots = nextSlots.slice(0, 3).join(', ');
              suggestions.push(`• ${formatDisplayDate(nextDate)}: ${topSlots}`);
            }

            if (suggestions.length >= 3) break;
          }

          if (suggestions.length > 0) {
            return {
              text: `Sorry, ${formatDisplayDate(utcDate)} is fully booked. Here are the nearest available dates:\n\n${suggestions.join('\n')}\n\nWould any of these work for you?`,
            };
          } else {
            return {
              text: `Sorry, there are no available slots on ${formatDisplayDate(utcDate)} or in the next week. Please try a different date or contact us directly at ${process.env.BUSINESS_PHONE || '(555) 123-4567'}.`,
            };
          }
        }
      }

      if (name === 'bookAppointment') {
        const requestedServices = args?.services as string[];
        const servicesToBook = allServices.filter(s => requestedServices.includes(s.name));

        if (servicesToBook.length !== requestedServices.length) {
          return {
            text: `I'm sorry, one or more of the requested services ("${requestedServices.join(', ')}") are not valid. Please choose from our list of services.`,
          };
        }

        try {
          await bookNewAppointment({
            date: new Date(args?.date as string),
            time: args?.time as string,
            services: servicesToBook,
            customerName: args?.customerName as string,
            customerEmail: args?.customerEmail as string,
          });
          const formattedDate = formatDisplayDate(new Date(args?.date as string));
          const formattedTime = formatTime12Hour(args?.time as string);
          return {
            text: `Great! Your appointment is confirmed for ${formattedDate}, ${formattedTime} for ${requestedServices.join(', ')}.`,
            bookingDetails: {
              customerName: args?.customerName as string,
              customerEmail: args?.customerEmail as string,
              services: requestedServices,
              date: args?.date as string,
              time: args?.time as string,
            },
          };
        } catch (e: any) {
          // Booking failed - suggest alternatives
          const requestedDate = new Date(args?.date as string);
          const utcDate = new Date(
            requestedDate.getUTCFullYear(),
            requestedDate.getUTCMonth(),
            requestedDate.getUTCDate(),
          );
          const availableSlots = await getAvailability(utcDate);

          if (availableSlots.length > 0) {
            return {
              text: `I'm sorry, ${args?.time} is not available on ${formatDisplayDate(utcDate)}. Here are the available times for that day:\n\n${availableSlots.join(', ')}\n\nWould any of these work for you?`,
            };
          } else {
            // Check next few days
            const suggestions: string[] = [];
            for (let i = 1; i <= 7; i++) {
              const nextDate = new Date(utcDate);
              nextDate.setDate(nextDate.getDate() + i);
              const nextSlots = await getAvailability(nextDate);

              if (nextSlots.length > 0 && suggestions.length < 3) {
                const topSlots = nextSlots.slice(0, 3).join(', ');
                suggestions.push(`• ${formatDisplayDate(nextDate)}: ${topSlots}`);
              }

              if (suggestions.length >= 3) break;
            }

            if (suggestions.length > 0) {
              return {
                text: `I'm sorry, ${formatDisplayDate(utcDate)} is fully booked. Here are the nearest available dates:\n\n${suggestions.join('\n')}\n\nWould any of these work for you?`,
              };
            } else {
              return {
                text: `I'm sorry, I couldn't book that appointment. ${e.message}\n\nPlease try a different date or contact us at ${process.env.BUSINESS_PHONE || '(555) 123-4567'}.`,
              };
            }
          }
        }
      }

      if (name === 'cancelAppointment') {
        try {
          const { customerEmail, date, time } = args as {
            customerEmail: string;
            date: string;
            time: string;
          };
          await dbCancelAppointment({
            customerEmail: customerEmail as string,
            date: date as string,
            time: time as string,
          });
          return {
            text: `Your appointment for ${date} at ${time} has been successfully cancelled. We hope to see you again soon!`,
          };
        } catch (e: any) {
          return {
            text: `I'm sorry, I couldn't cancel that appointment. Reason: ${e.message}. Please ensure the email, date, and time are correct.`,
          };
        }
      }

      if (name === 'listMyAppointments') {
        try {
          const customerEmail = args?.customerEmail as string;
          const appointments = await findAppointmentsByEmail(customerEmail);

          if (appointments.length === 0) {
            return {
              text: `You don't have any upcoming appointments. Would you like to book one?`,
            };
          }

          let appointmentsList = `Here are your upcoming appointments:\n\n`;
          appointments.forEach((apt, index) => {
            const services = apt.services.map(s => s.name).join(', ');
            const date = formatDisplayDate(apt.date);
            appointmentsList += `${index + 1}. **${date} at ${apt.time}**\n`;
            appointmentsList += `   Services: ${services}\n`;
            appointmentsList += `   Duration: ${apt.totalDuration} minutes\n`;
            appointmentsList += `   Total: $${apt.totalPrice}\n`;
            appointmentsList += `   ID: ${apt.id}\n\n`;
          });

          appointmentsList += `To modify any appointment, just let me know which one and what you'd like to change!`;
          return { text: appointmentsList };
        } catch (e: any) {
          return {
            text: `I'm sorry, I couldn't retrieve your appointments. Please ensure you provided the correct email address.`,
          };
        }
      }

      if (name === 'modifyAppointment') {
        try {
          const { appointmentId, newDate, newTime, newServices } = args as {
            appointmentId: string;
            newDate?: string;
            newTime?: string;
            newServices?: string[];
          };

          // Get the current appointment
          const currentAppointment = await findAppointmentById(appointmentId);
          if (!currentAppointment) {
            return {
              text: `I couldn't find an appointment with that ID. Please check your appointment list first.`,
            };
          }

          // Prepare the update data
          const updateData: any = {
            customerName: currentAppointment.customerName,
            customerEmail: currentAppointment.customerEmail,
            date: newDate ? new Date(newDate) : currentAppointment.date,
            time: newTime || currentAppointment.time,
            services: currentAppointment.services, // Default to current services
            totalPrice: currentAppointment.totalPrice,
            totalDuration: currentAppointment.totalDuration,
          };

          // Update services if provided
          if (newServices && newServices.length > 0) {
            const servicesToUpdate = allServices.filter(s => newServices.includes(s.name));
            if (servicesToUpdate.length !== newServices.length) {
              return {
                text: `I'm sorry, one or more of the requested services ("${newServices.join(', ')}") are not valid. Please choose from our list of services.`,
              };
            }
            updateData.services = servicesToUpdate;
            updateData.totalPrice = servicesToUpdate.reduce((sum, s) => sum + s.price, 0);
            updateData.totalDuration = servicesToUpdate.reduce((sum, s) => sum + s.duration, 0);
          }

          // Update the appointment
          const updatedAppointment = await updateAppointment(appointmentId, updateData);

          // Update calendar if date/time changed
          const dateChanged =
            newDate &&
            new Date(newDate).toISOString() !== new Date(currentAppointment.date).toISOString();
          const timeChanged = newTime && newTime !== currentAppointment.time;
          const servicesChanged =
            newServices &&
            JSON.stringify(newServices) !==
              JSON.stringify(currentAppointment.services.map((s: any) => s.name));

          if (
            updatedAppointment.calendarEventId &&
            (dateChanged || timeChanged || servicesChanged)
          ) {
            try {
              await updateCalendarEvent(updatedAppointment.calendarEventId, updatedAppointment);
            } catch (error) {
              console.error('Failed to update calendar event:', error);
            }
          }

          // Send notification
          try {
            const dbUser = await findUserByEmail(updatedAppointment.customerEmail);
            let user = null;
            if (dbUser) {
              user = {
                ...dbUser,
                role: dbUser.role as 'CUSTOMER' | 'ADMIN',
                authProvider:
                  (dbUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
                telegramId: dbUser.telegramId ?? undefined,
                whatsappPhone: dbUser.whatsappPhone ?? undefined,
                avatar: dbUser.avatar ?? undefined,
              };
            }
            await sendAppointmentConfirmation(user, updatedAppointment, 'confirmation');
          } catch (error) {
            console.error('Failed to send modification notification:', error);
          }

          const changes = [];
          if (newDate) changes.push(`date to ${formatDisplayDate(newDate)}`);
          if (newTime) changes.push(`time to ${newTime}`);
          if (newServices) changes.push(`services to ${newServices.join(', ')}`);

          return {
            text: `Great! Your appointment has been successfully updated. Changes: ${changes.join(', ')}.\n\nNew appointment details:\n📅 Date: ${formatDisplayDate(updatedAppointment.date)}\n🕐 Time: ${updatedAppointment.time}\n✂️ Services: ${updatedAppointment.services.map(s => s.name).join(', ')}\n💰 Total: $${updatedAppointment.totalPrice}`,
          };
        } catch (e: any) {
          return {
            text: `I'm sorry, I couldn't modify that appointment. Reason: ${e.message}. Please try again or contact the salon directly.`,
          };
        }
      }
    } else if (response.text) {
      const text = response.text;

      // Detect if the AI is asking for confirmation (Yes/No questions)
      const confirmationPatterns = [
        /does that (all )?sound (correct|good|right)/i,
        /is (that|this) (correct|okay|alright|fine)/i,
        /would you like (me )?to (book|confirm|proceed)/i,
        /shall I (book|confirm|proceed)/i,
        /ready to (book|confirm)/i,
      ];

      const isConfirmationQuestion = confirmationPatterns.some(pattern => pattern.test(text));

      if (isConfirmationQuestion) {
        // CRITICAL: Only show confirmation buttons if booking is actually complete
        // Check if we have the required information from booking context
        const hasService = bookingContext?.services && bookingContext.services.length > 0;
        const hasDateTime = bookingContext?.date && bookingContext?.time;

        if (!hasService || !hasDateTime) {
          // Booking is incomplete - don't show confirmation buttons yet
          // AI is asking a question but we're missing critical information
          return { text };
        }

        // Booking appears complete - extract details for confirmation
        const bookingDetails: any = {};

        // Use booking context as source of truth
        if (bookingContext?.services) {
          bookingDetails.services = bookingContext.services;
        }
        if (bookingContext?.date) {
          bookingDetails.date = bookingContext.date;
        }
        if (bookingContext?.time) {
          bookingDetails.time = bookingContext.time;
        }

        // Also try to extract from AI response text as fallback
        if (!bookingDetails.date) {
          const dateMatch = text.match(
            /(?:on|for)\s+([A-Z][a-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})/i,
          );
          if (dateMatch) {
            bookingDetails.date = dateMatch[1];
          }
        }

        if (!bookingDetails.time) {
          const timeMatch = text.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
          if (timeMatch) {
            bookingDetails.time = timeMatch[1];
          }
        }

        // Extract service names from available services if not in context
        if (!bookingDetails.services) {
          const mentionedServices = allServices.filter(service => text.includes(service.name));
          if (mentionedServices.length > 0) {
            bookingDetails.services = mentionedServices.map(s => s.name);
          }
        }

        // Extract customer name if mentioned
        const nameMatch = text.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
        if (nameMatch && !text.includes('for ' + nameMatch[1] + ' minutes')) {
          bookingDetails.customerName = nameMatch[1];
        }

        // Add user context if available
        if (userContext?.name) bookingDetails.customerName = userContext.name;
        if (userContext?.email) bookingDetails.customerEmail = userContext.email;

        return {
          text,
          buttons: [
            { text: '✅ Yes, book it!', data: 'confirm_booking' },
            { text: '❌ No, let me change something', data: 'cancel_booking' },
          ],
          bookingDetails: Object.keys(bookingDetails).length > 0 ? bookingDetails : undefined,
        };
      }

      return { text };
    }

    return { text: "I'm not sure how to help with that. Can you try rephrasing?" };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      text: "Sorry, I'm having trouble understanding right now. Please try again in a moment.",
    };
  }
};
