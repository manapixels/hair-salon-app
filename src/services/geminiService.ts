import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from '@google/genai';
import type { WhatsAppMessage, Service } from '../types';
import {
  getServices,
  getAvailability,
  bookNewAppointment,
  cancelAppointment as dbCancelAppointment,
} from '../lib/database';

// This function is now designed to be run on the server.
// The API KEY should be set as an environment variable on the server.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('CRITICAL: API_KEY for Gemini is not set in server environment variables.');
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

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

export const handleWhatsAppMessage = async (
  userInput: string,
  chatHistory: Pick<WhatsAppMessage, 'text' | 'sender'>[],
): Promise<string> => {
  if (!API_KEY) {
    return "I'm sorry, my connection to my brain is currently offline. Please try again later.";
  }

  const allServices = getServices();
  const servicesListString = allServices
    .map(s => `${s.name}: $${s.price} (${s.duration} mins)`)
    .join('\n');

  const systemInstruction = `You are a friendly and efficient AI assistant for 'Luxe Cuts' hair salon.
Your goal is to help users inquire about services, book appointments, and cancel them.
Today's date is ${new Date().toLocaleDateString()}.
Do not ask for information you can derive, like the year if the user says "next Tuesday".
Be conversational and helpful.
When booking, confirm all details with the user before calling the bookAppointment function. You must have the customer's name, email, desired services, date, and time.
When canceling, you MUST ask for the customer's email address, the appointment date, and the appointment time to uniquely identify the appointment to be cancelled.

Available Services:
${servicesListString}
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User: ${userInput}`,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              getServicesList,
              checkAvailability,
              bookAppointment,
              cancelAppointment,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const fc = response.functionCalls[0];
      const { name, args } = fc;

      if (name === 'getServicesList') {
        return `Here are the services we offer:\n\n${servicesListString}`;
      }

      if (name === 'checkAvailability') {
        const date = new Date(args?.date as string);
        const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const slots = await getAvailability(utcDate);
        if (slots.length > 0) {
          return `On ${utcDate.toLocaleDateString()}, the following time slots are available:\n${slots.join(', ')}`;
        } else {
          return `Sorry, there are no available slots on ${utcDate.toLocaleDateString()}. Please try another date.`;
        }
      }

      if (name === 'bookAppointment') {
        const requestedServices = args?.services as string[];
        const servicesToBook = allServices.filter(s => requestedServices.includes(s.name));

        if (servicesToBook.length !== requestedServices.length) {
          return `I'm sorry, one or more of the requested services ("${requestedServices.join(', ')}") are not valid. Please choose from our list of services.`;
        }

        try {
          await bookNewAppointment({
            date: new Date(args?.date as string),
            time: args?.time as string,
            services: servicesToBook,
            customerName: args?.customerName as string,
            customerEmail: args?.customerEmail as string,
          });
          return `Great! Your appointment is confirmed for ${args?.date} at ${args?.time} for ${requestedServices.join(', ')}. You'll receive an email confirmation shortly.`;
        } catch (e: any) {
          return `I'm sorry, I couldn't book that appointment. Reason: ${e.message}. Please try a different time or date.`;
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
          return `Your appointment for ${date} at ${time} has been successfully cancelled. We hope to see you again soon!`;
        } catch (e: any) {
          return `I'm sorry, I couldn't cancel that appointment. Reason: ${e.message}. Please ensure the email, date, and time are correct.`;
        }
      }
    } else if (response.text) {
      return response.text;
    }

    return "I'm not sure how to help with that. Can you try rephrasing?";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Sorry, I'm having trouble understanding right now. Please try again in a moment.";
  }
};
