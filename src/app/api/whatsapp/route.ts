/**
 * API Route: /api/whatsapp
 *
 * This is the webhook endpoint that you would provide to your WhatsApp Business API provider (e.g., Twilio, Meta).
 * It receives incoming messages from users on WhatsApp, processes them with Gemini,
 * and sends a reply back via the provider's API.
 */
import { handleWhatsAppMessage } from '../../../services/geminiService';

// GET handler for webhook verification
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

/**
 * Sends a reply to the user via the official Meta Graph API for WhatsApp.
 * @param to The recipient's phone number in international format.
 * @param text The message text to send.
 */
async function sendWhatsAppReply(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error(
      'WhatsApp environment variables (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN) are not set.',
    );
    // In production, you might want to throw an error or have a more robust logging system.
    // For this simulation, we will log a message if we were to proceed.
    console.log(
      `SIMULATING sending WhatsApp reply to ${to}: "${text}" (because credentials are not set)`,
    );
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: {
      preview_url: false,
      body: text,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send WhatsApp reply:', JSON.stringify(errorData, null, 2));
      throw new Error(`WhatsApp API request failed with status ${response.status}`);
    }

    console.log(`Successfully sent WhatsApp reply to ${to}`);
    const responseData = await response.json();
    console.log('WhatsApp API Response:', responseData);
  } catch (error) {
    console.error('Exception when trying to send WhatsApp reply:', error);
  }
}

// POST handler for receiving WhatsApp messages
export async function POST(request: Request) {
  const requestBody = await request.json();

  // The structure of requestBody will depend on your WhatsApp provider.
  // This is a simplified example based on Meta's format for text messages.
  // In a real app, you need to handle various message types and edge cases.
  console.log('Received WhatsApp webhook payload:', JSON.stringify(requestBody, null, 2));

  const message = requestBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from; // The user's phone number
    const incomingMessage = message.text.body;

    try {
      // We're not using chat history here for simplicity, but you could store
      // and retrieve conversation history from a database based on the `from` number.
      const replyText = await handleWhatsAppMessage(incomingMessage, []);

      // Send the generated reply back to the user via the WhatsApp API.
      await sendWhatsAppReply(from, replyText);

      // Respond to the webhook request to acknowledge receipt.
      return Response.json({ success: true }, { status: 200 });
    } catch (error: any) {
      console.error('Error in WhatsApp webhook:', error);
      return Response.json({ message: 'Failed to process WhatsApp message.' }, { status: 500 });
    }
  } else {
    // This is not a text message we can process. Acknowledge it so Meta doesn't resend.
    console.log('Received a non-text message or an unhandled payload type.');
    return Response.json(
      { success: true, message: 'Payload received but not a user text message.' },
      { status: 200 },
    );
  }
}

// Mock handler for POST requests to /api/whatsapp
export async function handlePost(requestBody: any) {
  // The structure of requestBody will depend on your WhatsApp provider.
  // This is a simplified example based on Meta's format for text messages.
  // In a real app, you need to handle various message types and edge cases.
  console.log('Received WhatsApp webhook payload:', JSON.stringify(requestBody, null, 2));

  const message = requestBody.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from; // The user's phone number
    const incomingMessage = message.text.body;

    try {
      // We're not using chat history here for simplicity, but you could store
      // and retrieve conversation history from a database based on the `from` number.
      const replyText = await handleWhatsAppMessage(incomingMessage, []);

      // Send the generated reply back to the user via the WhatsApp API.
      await sendWhatsAppReply(from, replyText);

      // Respond to the webhook request to acknowledge receipt.
      return { status: 200, body: { success: true } };
    } catch (error: any) {
      console.error('Error in WhatsApp webhook:', error);
      return { status: 500, body: { message: 'Failed to process WhatsApp message.' } };
    }
  } else {
    // This is not a text message we can process. Acknowledge it so Meta doesn't resend.
    console.log('Received a non-text message or an unhandled payload type.');
    return {
      status: 200,
      body: { success: true, message: 'Payload received but not a user text message.' },
    };
  }
}
