/**
 * API Route: /api/chat
 *
 * This endpoint is used by the frontend's WhatsApp simulator.
 * It takes user input and chat history, calls the Gemini service on the backend,
 * and returns the AI's reply.
 */
import { handleWhatsAppMessage } from '../../../services/geminiService';

// Mock handler for POST requests to /api/chat
export async function handlePost(requestBody: { userInput: string; chatHistory: any[] }) {
  const { userInput, chatHistory } = requestBody;

  if (!userInput) {
    return { status: 400, body: { message: 'userInput is required.' } };
  }

  try {
    const reply = await handleWhatsAppMessage(userInput, chatHistory || []);
    return { status: 200, body: { reply } };
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return { status: 500, body: { message: 'Failed to get chat response.', error: error.message } };
  }
}
