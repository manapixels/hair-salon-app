/**
 * API Route: /api/whatsapp
 *
 * This is the webhook endpoint that you would provide to your WhatsApp Business API provider (e.g., Twilio, Meta).
 * It receives incoming messages from users on WhatsApp, processes them with Gemini,
 * and sends a reply back via the provider's API.
 */
import {
  handleMessagingWithUserContext,
  findUserByWhatsAppPhone,
} from '@/services/messagingUserService';
import { checkRateLimit } from '@/services/rateLimitService';
import crypto from 'crypto';
import {
  handleStartCommand,
  handleServicesCommand,
  handleAppointmentsCommand,
  handleBookCommand,
  handleCancelCommand,
  handleRescheduleCommand,
  handleHoursCommand,
  handleHelpCommand,
  handleCallbackQuery,
  type CommandResponse,
} from '@/services/botCommandService';
import {
  formatCommandResponseForWhatsApp,
  formatButtonsForWhatsApp,
} from '@/services/whatsappCommandAdapter';
import { getCommandOptions, type CommandOption } from '@/services/conversationHistory';
import type { User } from '@/types';

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
      const errorData = (await response.json()) as any;
      console.error('Failed to send WhatsApp reply:', JSON.stringify(errorData, null, 2));
      throw new Error(`WhatsApp API request failed with status ${response.status}`);
    }

    console.log(`Successfully sent WhatsApp reply to ${to}`);
    const responseData = (await response.json()) as any;
    console.log('WhatsApp API Response:', responseData);
  } catch (error) {
    console.error('Exception when trying to send WhatsApp reply:', error);
  }
}

type CommandHandler = (user: User | null) => Promise<CommandResponse>;

const COMMAND_REGISTRY: Array<{ names: string[]; handler: CommandHandler }> = [
  {
    names: ['/start', 'start', 'menu', 'main menu', 'hi', 'hello', 'hey'],
    handler: handleStartCommand,
  },
  {
    names: ['/services', 'services', 'view services', 'show services'],
    handler: async () => handleServicesCommand(),
  },
  {
    names: ['/appointments', 'appointments', 'my appointments', 'view appointments'],
    handler: handleAppointmentsCommand,
  },
  {
    names: ['/book', 'book', 'book appointment', 'schedule appointment', 'book now'],
    handler: async () => handleBookCommand(),
  },
  {
    names: ['/cancel', 'cancel', 'cancel appointment', 'cancel booking'],
    handler: handleCancelCommand,
  },
  {
    names: ['/reschedule', 'reschedule', 'reschedule appointment'],
    handler: handleRescheduleCommand,
  },
  {
    names: ['/hours', 'hours', 'business hours', 'opening hours', 'location'],
    handler: async () => handleHoursCommand(),
  },
  {
    names: ['/help', 'help', 'commands'],
    handler: async () => handleHelpCommand(),
  },
];

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findCommandHandler(message: string): CommandHandler | null {
  const normalized = normalize(message);
  const base = normalized.split(/\s+/)[0];

  for (const entry of COMMAND_REGISTRY) {
    if (entry.names.some(name => name === normalized || name === base)) {
      return entry.handler;
    }
  }

  return null;
}

function resolveCommandOption(
  options: CommandOption[] | undefined,
  message: string,
): CommandOption | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }

  const trimmed = message.trim();
  if (trimmed === '') {
    return undefined;
  }

  if (/^\d+$/.test(trimmed)) {
    return options.find(option => option.id === trimmed);
  }

  const normalized = normalizeForComparison(trimmed);

  const labelMatch = options.find(option => normalizeForComparison(option.label) === normalized);
  if (labelMatch) {
    return labelMatch;
  }

  const callbackMatch = options.find(
    option => normalizeForComparison(option.callbackData) === normalized,
  );
  if (callbackMatch) {
    return callbackMatch;
  }

  if (['yes', 'confirm', 'ok', 'okay'].includes(normalized)) {
    return options.find(option => option.callbackData.includes('confirm'));
  }

  if (['no', 'cancel', 'stop'].includes(normalized)) {
    return options.find(option => option.callbackData.includes('cancel'));
  }

  if (['reschedule', 'change'].includes(normalized)) {
    return options.find(option => option.callbackData.includes('reschedule'));
  }

  if (['back'].includes(normalized)) {
    return options.find(option => option.callbackData.includes('go_back'));
  }

  return undefined;
}

function extractIncomingMessage(message: any): string | null {
  if (!message) {
    return null;
  }

  if (message.type === 'text') {
    return message.text?.body ?? null;
  }

  if (message.type === 'interactive') {
    const interactive = message.interactive;
    if (!interactive) {
      return null;
    }

    if (interactive.type === 'button_reply') {
      return interactive.button_reply?.id || interactive.button_reply?.title || null;
    }

    if (interactive.type === 'list_reply') {
      return interactive.list_reply?.id || interactive.list_reply?.title || null;
    }
  }

  if (message.type === 'image') {
    return '[IMAGE]';
  }

  return null;
}

async function processWhatsAppMessage(
  from: string,
  incomingMessage: string,
  media?: { mimeType: string; data: string; id: string },
): Promise<string> {
  const userId = from;
  const trimmedMessage = incomingMessage.trim();

  // If it's an image, we skip command processing and go straight to natural language
  if (incomingMessage === '[IMAGE]' && media) {
    try {
      const { reply, buttons } = await handleMessagingWithUserContext(
        'I sent an image.', // Context for the AI
        'whatsapp',
        from,
        media,
      );
      return formatButtonsForWhatsApp(userId, buttons, reply).text;
    } catch (error) {
      console.error('WhatsApp image handling failed:', error);
      return "Sorry, I'm having trouble processing that image right now.";
    }
  }

  const storedOptions = getCommandOptions(userId);
  const option = resolveCommandOption(storedOptions, trimmedMessage);

  if (option) {
    try {
      const user = await findUserByWhatsAppPhone(from);
      const response = await handleCallbackQuery(option.callbackData, user, userId);
      return formatCommandResponseForWhatsApp(userId, response).text;
    } catch (error) {
      console.error('WhatsApp option handling failed:', error);
      return "Sorry, I couldn't process that selection. Please try again.";
    }
  }

  const handler = findCommandHandler(trimmedMessage);
  if (handler) {
    try {
      const user = await findUserByWhatsAppPhone(from);
      const response = await handler(user);
      return formatCommandResponseForWhatsApp(userId, response).text;
    } catch (error) {
      console.error('WhatsApp command failed:', error);
      return 'Sorry, I had trouble handling that command. Please try again in a moment.';
    }
  }

  try {
    const { reply, buttons } = await handleMessagingWithUserContext(
      incomingMessage,
      'whatsapp',
      from,
      media,
    );
    return formatButtonsForWhatsApp(userId, buttons, reply).text;
  } catch (error) {
    console.error('WhatsApp natural language handling failed:', error);
    return "Sorry, I'm having trouble understanding right now. Please try again later.";
  }
}

/**
 * Verify WhatsApp webhook signature
 * @param body - Raw request body
 * @param signature - X-Hub-Signature-256 header value
 * @returns true if signature is valid
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('[WhatsApp] WHATSAPP_APP_SECRET not set, skipping signature verification');
    return true; // Allow in dev environments without secret
  }

  if (!signature) {
    console.error('[WhatsApp] Missing X-Hub-Signature-256 header');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', appSecret);
    const expectedSignature = 'sha256=' + hmac.update(body).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (error) {
    console.error('[WhatsApp] Error verifying signature:', error);
    return false;
  }
}

// POST handler for receiving WhatsApp messages
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('X-Hub-Signature-256');
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[WhatsApp] Invalid webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const requestBody = JSON.parse(rawBody);

    console.log('Received WhatsApp webhook payload:', JSON.stringify(requestBody, null, 2));

    const change = requestBody.entry?.[0]?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    if (!message) {
      console.log('No message found in payload.');
      return Response.json({ success: true, message: 'No message to process.' }, { status: 200 });
    }

    const from = message.from;
    const incomingMessage = extractIncomingMessage(message);

    // Rate limiting check
    const rateLimitResult = checkRateLimit(from);
    if (!rateLimitResult.allowed) {
      console.warn(`[WhatsApp] Rate limit exceeded for ${from}`);
      const retryMessage = rateLimitResult.retryAfter
        ? `You're sending too many messages. Please try again in ${rateLimitResult.retryAfter} seconds.`
        : "You're sending too many messages. Please slow down.";

      await sendWhatsAppReply(from, retryMessage);
      return Response.json({ success: true, rateLimited: true }, { status: 200 });
    }

    let media = undefined;
    if (message.type === 'image') {
      const imageId = message.image.id;
      const mimeType = message.image.mime_type || 'image/jpeg';

      try {
        // Download image from WhatsApp servers
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        if (accessToken) {
          // Get image URL
          const mediaUrlResponse = await fetch(`https://graph.facebook.com/v19.0/${imageId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (mediaUrlResponse.ok) {
            const mediaData = (await mediaUrlResponse.json()) as { url: string };
            const imageUrl = mediaData.url;

            // Download actual image
            const imageResponse = await fetch(imageUrl, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');

              media = {
                mimeType,
                data: base64,
                id: imageId,
              };
              console.log('Successfully downloaded WhatsApp image:', imageId);
            } else {
              console.error('Failed to download image from URL:', imageResponse.statusText);
              media = { mimeType, data: '', id: imageId };
            }
          } else {
            console.error('Failed to get image URL:', mediaUrlResponse.statusText);
            media = { mimeType, data: '', id: imageId };
          }
        } else {
          console.warn('WHATSAPP_ACCESS_TOKEN not set, cannot download image');
          media = { mimeType, data: '', id: imageId };
        }
      } catch (error) {
        console.error('Error downloading WhatsApp image:', error);
        media = { mimeType, data: '', id: imageId };
      }
    }

    if (!from || !incomingMessage) {
      console.log('Unsupported message type or missing sender.');
      return Response.json(
        { success: true, message: 'Unsupported message type.' },
        { status: 200 },
      );
    }

    const replyText = await processWhatsAppMessage(from, incomingMessage, media);
    await sendWhatsAppReply(from, replyText);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in WhatsApp webhook:', error);
    return Response.json({ message: 'Failed to process WhatsApp message.' }, { status: 500 });
  }
}

// Mock handler for POST requests to /api/whatsapp
export async function handlePost(requestBody: any) {
  console.log('Received WhatsApp webhook payload:', JSON.stringify(requestBody, null, 2));

  const change = requestBody.entry?.[0]?.changes?.[0]?.value;
  const message = change?.messages?.[0];

  if (!message) {
    console.log('No message found in payload.');
    return { status: 200, body: { success: true, message: 'No message to process.' } };
  }

  const from = message.from;
  const incomingMessage = extractIncomingMessage(message);

  if (!from || !incomingMessage) {
    console.log('Unsupported message type or missing sender.');
    return { status: 200, body: { success: true, message: 'Unsupported message type.' } };
  }

  try {
    const replyText = await processWhatsAppMessage(from, incomingMessage);
    await sendWhatsAppReply(from, replyText);
    return { status: 200, body: { success: true } };
  } catch (error) {
    console.error('Error in mock WhatsApp handler:', error);
    return { status: 500, body: { message: 'Failed to process WhatsApp message.' } };
  }
}
