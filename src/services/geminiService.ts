import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';
import type { WhatsAppMessage } from '../types';
import {
  getServices,
  getStylists,
  getAvailability,
  getStylistAvailability,
  bookNewAppointment,
  cancelAppointment as dbCancelAppointment,
  rescheduleAppointment,
  findAppointmentsByEmail,
  updateAppointment,
  findAppointmentById,
  findUserByEmail,
  updateAppointmentCalendarId,
  getAdminSettings,
} from '../lib/database';
import { searchKnowledgeBase } from './knowledgeBaseService';
import { flagConversation, isFlagged, getBookingContext } from './conversationHistory';
import { createCalendarEvent, updateCalendarEvent } from '../lib/google';
import { sendAppointmentConfirmation } from './messagingService';
import { formatDisplayDate, formatTime12Hour } from '@/lib/timeUtils';
import { getAllCategories } from '@/lib/categories';
import { generateFallbackResponse, type BookingContextUpdate } from './intentParser';

// Timeout for Gemini API calls (8 seconds)
const GEMINI_TIMEOUT_MS = 8000;

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

const searchKnowledgeBaseTool: FunctionDeclaration = {
  name: 'searchKnowledgeBase',
  description:
    'Search the knowledge base for answers to general questions about the salon (policies, products, parking, etc.).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query to find relevant information.',
      },
    },
    required: ['query'],
  },
};

const flagForAdminTool: FunctionDeclaration = {
  name: 'flagForAdmin',
  description:
    'Flag the conversation for a human admin to review when you are unsure how to help or if the user asks for a human.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description:
          'The reason why you are flagging this conversation (e.g., "User asking about unknown service", "User requested human").',
      },
    },
    required: ['reason'],
  },
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
      stylistId: {
        type: Type.STRING,
        description: 'Optional: The ID of a specific stylist the user wants to book with.',
      },
      time: {
        type: Type.STRING,
        description:
          'Optional: A specific time (HH:MM) to check availability for. Use this to confirm a specific slot.',
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
    required: ['customerName', 'customerEmail', 'services', 'date', 'time'],
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
      stylistId: {
        type: Type.STRING,
        description: 'Optional: The ID of the specific stylist to book with.',
      },
    },
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
    stylistId?: string;
    // Additional context for intent parser flows
    categoryId?: string;
    categoryName?: string;
    stylistName?: string;
    awaitingInput?:
      | 'category'
      | 'date'
      | 'time'
      | 'stylist'
      | 'confirmation'
      | 'email'
      | 'appointment_select';
    pendingAction?: 'cancel' | 'reschedule' | 'view';
    appointmentId?: string;
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
  userPattern?: {
    favoriteService?: string;
    favoriteStylistId?: string;
    typicalTime?: string;
  },
  media?: { mimeType: string; data: string; id: string },
): Promise<MessageResponse> => {
  const startTime = Date.now();
  const logEntry: any = {
    timestamp: new Date().toISOString(),
    userId: userContext?.email || 'unknown',
    input: userInput,
    toolsCalled: [],
  };

  if (!API_KEY || !ai) {
    return {
      text: "I'm sorry, my connection to my brain is currently offline. Please try again later.",
    };
  }

  // Check if conversation is already flagged
  if (userContext?.email && (await isFlagged(userContext.email))) {
    return {
      text: "I'm still checking on that for you with our team. Thanks for your patience!",
    };
  }

  // ============================================================================
  // Primary Handler: Deterministic Intent Parser
  // Try intent parser first for fast, predictable responses
  // Falls back to Gemini AI for complex/ambiguous queries
  // ============================================================================
  try {
    const { parseMessage, generateFallbackResponse } = await import('./intentParser');
    const parsed = await parseMessage(userInput);

    // Convert booking context to intent parser format
    // Include user context for booking creation
    // Cast to access all stored fields including those from intent parser
    const storedContext = bookingContext as Record<string, any> | undefined;
    const intentParserContext = storedContext
      ? {
          categoryId: storedContext.categoryId || storedContext.services?.[0],
          categoryName: storedContext.categoryName,
          date: storedContext.date,
          time: storedContext.time,
          stylistId: storedContext.stylistId,
          stylistName: storedContext.stylistName,
          customerName: storedContext.customerName || userContext?.name,
          customerEmail: storedContext.customerEmail || userContext?.email,
          // Use stored awaitingInput if present, otherwise derive from booking state
          awaitingInput:
            storedContext.awaitingInput ||
            (storedContext.services?.[0] && storedContext.date && storedContext.time
              ? 'confirmation'
              : undefined),
          pendingAction: storedContext.pendingAction,
          appointmentId: storedContext.appointmentId,
        }
      : userContext
        ? {
            customerName: userContext.name,
            customerEmail: userContext.email,
          }
        : undefined;

    // Use intent parser for high-confidence booking flows
    const handledIntents = [
      'book',
      'greeting',
      'services',
      'hours',
      'help',
      'confirmation',
      'view_appointments',
      'cancel',
      'reschedule',
    ];
    if (parsed.confidence >= 0.7 && handledIntents.includes(parsed.type)) {
      console.log(
        `[IntentParser] Handling "${parsed.type}" intent (confidence: ${parsed.confidence})`,
      );
      const response = await generateFallbackResponse(userInput, intentParserContext);

      // Log for analytics
      console.log(`[IntentParser] Response generated deterministically`);

      return {
        text: response.text,
        bookingDetails: response.updatedContext
          ? {
              // Map categoryId to services array for backwards compatibility
              services: response.updatedContext.categoryId
                ? [response.updatedContext.categoryId]
                : undefined,
              stylistId: response.updatedContext.stylistId,
              date: response.updatedContext.date,
              time: response.updatedContext.time,
              // Pass through all other context for proper persistence
              categoryId: response.updatedContext.categoryId,
              categoryName: response.updatedContext.categoryName,
              stylistName: response.updatedContext.stylistName,
              customerName: response.updatedContext.customerName,
              customerEmail: response.updatedContext.customerEmail,
              awaitingInput: response.updatedContext.awaitingInput,
              pendingAction: response.updatedContext.pendingAction,
              appointmentId: response.updatedContext.appointmentId,
            }
          : undefined,
      };
    }

    // Low confidence or unhandled intent - fall through to Gemini AI
    console.log(
      `[IntentParser] Low confidence (${parsed.confidence}) or unhandled intent "${parsed.type}", falling back to Gemini`,
    );
  } catch (intentParserError) {
    console.error('[IntentParser] Error, falling back to Gemini:', intentParserError);
  }

  // ============================================================================
  // Fallback Handler: Gemini AI for complex/ambiguous queries
  // ============================================================================

  const allServices = await getServices();
  const servicesListString = allServices
    .map(s => {
      let serviceStr = `${s.name}: ${s.price} (${s.duration} mins)`;

      // Add tag information for better context
      if (s.serviceTags && s.serviceTags.length > 0) {
        const concerns = s.serviceTags
          .filter(st => st.tag.category === 'CONCERN')
          .map(st => st.tag.label);
        const outcomes = s.serviceTags
          .filter(st => st.tag.category === 'OUTCOME')
          .map(st => st.tag.label);

        if (concerns.length > 0) {
          serviceStr += ` | Addresses: ${concerns.join(', ')}`;
        }
        if (outcomes.length > 0) {
          serviceStr += ` | Achieves: ${outcomes.join(', ')}`;
        }
      }

      return serviceStr;
    })
    .join('\n');

  // Build user context string
  const userContextString =
    userContext?.name && userContext?.email
      ? `\n\nIMPORTANT - Current User Information:
- Customer Name: ${userContext.name}
- Customer Email: ${userContext.email}

When booking appointments, ALWAYS use this customer's name and email automatically. DO NOT ask them to provide it again - they are already logged in and authenticated.`
      : '';

  // Build user pattern string
  const userPatternString =
    userPattern && Object.keys(userPattern).length > 0
      ? `\n\nIMPORTANT - User's Usual Pattern:
- Favorite Service: ${userPattern.favoriteService || 'Unknown'}
- Favorite Stylist: ${userPattern.favoriteStylistId || 'Any'}
- Typical Time: ${userPattern.typicalTime || 'Unknown'}

If the user asks to "book the usual" or "same as always", use the information above to suggest a booking.`
      : '';

  // Fetch categories for the system instruction
  const allCategories = await getAllCategories();
  const categoriesListString = allCategories
    .map(c => {
      let catStr = `${c.title}`;
      if (c.priceNote) {
        catStr += ` - ${c.priceNote}`;
      } else if (c.priceRangeMin) {
        catStr += ` - from $${c.priceRangeMin}`;
      }
      if (c.estimatedDuration) {
        catStr += ` (~${c.estimatedDuration} mins)`;
      }
      return catStr;
    })
    .join('\n');

  // Fetch stylists for system instruction
  const allStylists = await getStylists();
  const stylistsListString = allStylists.map(s => `- ${s.name} (ID: ${s.id})`).join('\n');

  const systemInstruction = `You are a friendly, warm assistant at Signature Trims hair salon.
Chat naturally like a helpful receptionist would - be conversational, not robotic.
Today's date is ${formatDisplayDate(new Date())}.${userContextString}${userPatternString}

IMPORTANT - Conversational Tone:
- Be warm and friendly: "Got it!", "Perfect!", "Sure thing!"
- Ask ONE question at a time - don't overwhelm with options
- Keep messages short and scannable
- Use emojis sparingly for warmth (1-2 per message max)
- For confirmations, say "Just say 'yes' to confirm" NOT "Click to confirm"

BAD: "Please select your preferred service from the following options:"
GOOD: "What service are you looking for today?"

BAD: "Would you like to proceed with the booking? [Yes] [No]"
GOOD: "Should I book this for you? Just say 'yes' to confirm!"

IMPORTANT - Category-Based Booking:
We book by SERVICE CATEGORY, not individual services. Categories have price ranges (final price at salon).
When a user mentions a service type, match it to a category:
- "haircut", "cut", "trim" → Haircut category
- "color", "colour", "dye", "highlights" → Hair Colouring category
- "keratin", "treatment", "straightening" → Keratin Treatment category
- "perm", "curl", "wave" → Perm category
- "scalp", "dandruff", "hair loss" → Scalp Therapy category

IMPORTANT - Stylist Selection:
If a user requests a specific stylist (e.g., "with May"), match their name to the list below and use their ID.
Available Stylists:
${stylistsListString}

IMPORTANT - Checking Availability:
- If the user asks for a specific time (e.g., "2pm"), call checkAvailability with the 'time' parameter to confirm it.
- If the user asks generally ("what time?", "available slots?"), call checkAvailability WITHOUT the 'time' parameter to get a list.
- When a slot is confirmed available AND you have all booking details (service, date, time, stylist), show a FULL CONFIRMATION SUMMARY:
  "✅ *Your Booking:*
  ✂️ [Service] ([price])
  📅 [Date]
  🕐 [Time]
  💇 [Stylist]
  
  Reply 'yes' to confirm your booking!"
- Do NOT just say "Yes, [time] is available" - go straight to the confirmation summary when you have all details.


IMPORTANT - Progressive Confirmation:
As you collect booking details, ALWAYS show a running summary at the TOP of your response:
Example:
"✅ *Your Booking:*
✂️ Haircut (from $28)
📅 Tuesday, Dec 10
🕐 2:00 PM

Great! Do you have a stylist preference, or any stylist is fine?" 


IMPORTANT - Knowledge Base:
For general questions (policies, parking, products), use 'searchKnowledgeBase'. Don't make up answers.

IMPORTANT - Human Handoff:
If unsure or user asks for human, use 'flagForAdmin'. Don't guess.

IMPORTANT - Conversation Context:
If you see "System Context:" messages, use that information - don't ask again.

Booking Flow:
1. Ask what service/category they want
2. Ask when (date and time) - accept natural language like "tomorrow at 2pm"
3. Ask stylist preference (or "any is fine")
4. Show final summary and ask to confirm with "yes"
5. ${userContext?.name && userContext?.email ? 'Use the customer name and email from user information.' : 'Collect customer name and email.'}

Canceling/Modifying: ${userContext?.email ? 'Use the customer email from user information.' : 'Ask for email.'} Show their appointments, then proceed.

Available Service Categories:
${categoriesListString}

Available Services (for reference):
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

    // Construct content parts
    const parts: any[] = [{ text: conversationContext }];

    // Add image if present
    if (media && media.data) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data,
        },
      });
    } else if (media && media.id) {
      parts.push({ text: `\n[User sent an image with ID: ${media.id}]` });
    }

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT_MS);
    });

    // Call Gemini with timeout
    const geminiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
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
              searchKnowledgeBaseTool,
              flagForAdminTool,
            ],
          },
        ],
      },
    });

    // Race between Gemini and timeout
    const response: GenerateContentResponse = await Promise.race([geminiPromise, timeoutPromise]);

    // Log model response
    logEntry.modelResponse = response;

    // Check confidence score for auto-escalation (if available in response)
    // Note: Gemini doesn't directly expose confidence, but we can infer from candidates
    const hasLowConfidence =
      response.candidates?.[0]?.finishReason === 'SAFETY' ||
      response.candidates?.[0]?.finishReason === 'RECITATION';

    if (hasLowConfidence && userContext?.email) {
      console.warn(`[Confidence] Low confidence response detected for ${userContext.email}`);
      await flagConversation(
        userContext.email,
        'Low confidence AI response - automatic escalation',
      );
      return {
        text: "That's a great question! Let me double-check with the team to be sure. I'll get back to you shortly.",
      };
    }

    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const { name, args } = fc;

      logEntry.toolsCalled.push({ name, args });

      if (name === 'getServicesList') {
        return { text: `Here are the services we offer:\n\n${servicesListString}` };
      }

      if (name === 'searchKnowledgeBase') {
        const query = args?.query as string;
        const answer = await searchKnowledgeBase(query);

        if (answer) {
          return { text: answer };
        } else {
          // KB doesn't have the answer - auto-flag for admin review
          if (userContext?.email) {
            await flagConversation(userContext.email, `Knowledge base query not found: "${query}"`);
          }

          return {
            text: "That's a great question! Let me double-check with the team to be sure. I'll get back to you shortly.",
          };
        }
      }

      if (name === 'flagForAdmin') {
        const reason = args?.reason as string;
        // We need a user ID to flag. We use email if available, otherwise we might need the platform ID.
        // Since handleWhatsAppMessage doesn't strictly take the platform ID, we rely on userContext.email
        // or we need to update the signature.
        // For now, we'll assume userContext.email is the key, or we log a warning.

        if (userContext?.email) {
          await flagConversation(userContext.email, reason);
        } else {
          console.warn('Cannot flag conversation: No user email provided in context.');
        }

        return {
          text: "That's a great question! Let me double-check with the team to be sure. I'll get back to you shortly.",
        };
      }

      if (name === 'checkAvailability') {
        const date = new Date(args?.date as string);
        const stylistId = args?.stylistId as string | undefined;
        const timeToCheck = args?.time as string | undefined;
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

        let slots: string[] = [];
        let availabilityMsgPrefix = '';

        if (stylistId) {
          slots = await getStylistAvailability(utcDate, stylistId);
          const stylist = allStylists.find(s => s.id === stylistId);
          availabilityMsgPrefix = stylist ? ` with ${stylist.name}` : '';
        } else {
          slots = await getAvailability(utcDate);
        }

        if (timeToCheck) {
          // Normalise timeToCheck to HH:MM format if needed (simple check)
          // The API returns slots in "HH:MM" format
          const isAvailable = slots.includes(timeToCheck);

          if (isAvailable) {
            const formattedDate = formatDisplayDate(utcDate);
            const formattedTime = formatTime12Hour(timeToCheck);
            return {
              text: `Yes, ${formattedTime} on ${formattedDate}${availabilityMsgPrefix} is available.`,
            };
          } else {
            const formattedDate = formatDisplayDate(utcDate);
            const formattedTime = formatTime12Hour(timeToCheck);
            return {
              text: `Sorry, ${formattedTime} on ${formattedDate}${availabilityMsgPrefix} is not available. Available slots are: ${slots.join(', ')}`,
            };
          }
        }

        if (slots.length > 0) {
          return {
            text: `On ${formatDisplayDate(utcDate)}${availabilityMsgPrefix}, the following time slots are available:\n${slots.join(', ')}`,
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
            const settings = await getAdminSettings();
            return {
              text: `Sorry, there are no available slots on ${formatDisplayDate(utcDate)} or in the next week. Please try a different date or contact us directly at ${settings.businessPhone}.`,
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
          const newAppointment = await bookNewAppointment({
            date: new Date(args?.date as string),
            time: args?.time as string,
            services: servicesToBook,
            customerName: args?.customerName as string,
            customerEmail: args?.customerEmail as string,
            stylistId: args?.stylistId as string | undefined, // Pass stylist ID
          });

          // Sync to Google Calendar
          try {
            const calendarEventId = await createCalendarEvent(newAppointment);
            if (calendarEventId) {
              await updateAppointmentCalendarId(newAppointment.id, calendarEventId);
            }
          } catch (error) {
            console.error(
              `Failed to create Google Calendar event for appointment ${newAppointment.id}:`,
              error,
            );
            // Non-fatal, booking succeeds even if calendar sync fails
          }

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
              const settings = await getAdminSettings();
              return {
                text: `I'm sorry, I couldn't book that appointment. ${e.message}\n\nPlease try a different date or contact us at ${settings.businessPhone}.`,
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
            // Show category name for category-based bookings, or services list for legacy bookings
            const serviceName =
              apt.category?.title ||
              (apt.services?.length > 0 ? apt.services.map(s => s.name).join(', ') : 'Appointment');
            const date = formatDisplayDate(apt.date);
            // Format time as 12-hour (e.g., "2:00 PM")
            const [hours, minutes] = apt.time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            const stylist = apt.stylist?.name ? ` with ${apt.stylist.name}` : '';
            appointmentsList += `${index + 1}. **${serviceName}${stylist}**\n`;
            appointmentsList += `   📅 ${date} at ${formattedTime}\n`;
            if (apt.totalDuration) {
              appointmentsList += `   ⏱️ ${apt.totalDuration} minutes\n`;
            }
            appointmentsList += `\n`;
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
            updateData.totalPrice = servicesToUpdate.reduce((sum, s) => sum + s.basePrice, 0);
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
      logEntry.finalResponse = text;

      // Safety Check
      if (safetyCheck(text)) {
        console.warn(`[Safety] Blocked response: ${text}`);
        return {
          text: "I apologize, but I can't provide that specific information. Is there anything else I can help you with regarding our salon services?",
        };
      }

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
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);

    // Use deterministic fallback when Gemini fails or times out
    const isTimeout = error?.message === 'GEMINI_TIMEOUT';
    console.log(`[Fallback] Using intent parser fallback. Timeout: ${isTimeout}`);

    try {
      // Build current booking context for fallback
      const currentBookingContext: BookingContextUpdate | undefined = bookingContext
        ? {
            categoryId: undefined, // We'll detect from message
            categoryName: bookingContext.services?.[0],
            date: bookingContext.date,
            time: bookingContext.time,
            stylistId: bookingContext.stylistId,
          }
        : undefined;

      const fallbackResponse = await generateFallbackResponse(userInput, currentBookingContext);

      return {
        text: fallbackResponse.text,
        bookingDetails: fallbackResponse.updatedContext
          ? {
              services: fallbackResponse.updatedContext.categoryName
                ? [fallbackResponse.updatedContext.categoryName]
                : undefined,
              date: fallbackResponse.updatedContext.date,
              time: fallbackResponse.updatedContext.time,
            }
          : undefined,
      };
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return {
        text: "Sorry, I'm having trouble right now. You can try:\n\n• /book - Book an appointment\n• /services - See our services\n• /appointments - View your bookings\n\nOr try again in a moment!",
      };
    }
  } finally {
    // Log the full trajectory
    console.log(`[Trajectory] ${JSON.stringify(logEntry, null, 2)}`);
  }
};

/**
 * Basic safety check for response content
 * Returns true if content is unsafe/should be blocked
 */
function safetyCheck(text: string): boolean {
  const blockedKeywords = [
    'password',
    'credit card',
    'social security',
    'fuck',
    'shit',
    'asshole', // Basic profanity filter
    'ignore all previous instructions', // Prompt injection attempt
  ];

  const lowerText = text.toLowerCase();
  return blockedKeywords.some(keyword => lowerText.includes(keyword));
}
