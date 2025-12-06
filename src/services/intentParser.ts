/**
 * Intent Parser Service
 *
 * Deterministic fallback for when Gemini AI is unavailable.
 * Parses user messages using keyword matching, natural date/time parsing,
 * and category matching to provide conversational responses.
 *
 * Used by Telegram and WhatsApp bots as fallback when Gemini times out or errors.
 */

import { getAllCategories, type ServiceCategory } from '@/lib/categories';

// ============================================================================
// Types
// ============================================================================

export type IntentType =
  | 'book'
  | 'cancel'
  | 'reschedule'
  | 'view_appointments'
  | 'services'
  | 'hours'
  | 'help'
  | 'greeting'
  | 'confirmation'
  | 'unknown';

export interface ParsedIntent {
  type: IntentType;
  confidence: number; // 0-1
  category?: {
    id: string;
    slug: string;
    name: string;
    priceNote: string;
  };
  date?: {
    raw: string; // Original text like "tomorrow"
    parsed: Date | null;
    formatted: string | null; // "Tuesday, Dec 10"
  };
  time?: {
    raw: string; // Original text like "2pm"
    parsed: string | null; // "14:00"
    formatted: string | null; // "2:00 PM"
    range?: { start: string; end: string }; // For "afternoon" → 12:00-17:00
  };
  stylist?: string; // Stylist name or "any"
  ambiguousCategories?: ServiceCategory[]; // When multiple matches
  originalMessage: string;
}

export interface ConversationalResponse {
  text: string;
  updatedContext?: Partial<BookingContextUpdate>;
}

export interface BookingContextUpdate {
  categoryId?: string;
  categoryName?: string;
  priceNote?: string;
  date?: string;
  time?: string;
  stylistId?: string;
  awaitingInput?: 'category' | 'date' | 'time' | 'stylist' | 'confirmation';
}

// ============================================================================
// Keyword Mappings
// ============================================================================

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  book: [
    'book',
    'appointment',
    'schedule',
    'reserve',
    'make an appointment',
    'i want',
    'i need',
    "i'd like",
  ],
  cancel: ['cancel', 'delete', 'remove', 'call off'],
  reschedule: [
    'reschedule',
    'change',
    'move',
    'different time',
    'another time',
    'change my appointment',
  ],
  view_appointments: [
    'my appointments',
    'my bookings',
    'show my',
    'list my',
    'see my',
    'upcoming',
    'what appointments',
  ],
  services: ['services', 'prices', 'menu', 'offer', 'treatments', 'what do you', 'how much'],
  hours: ['hours', 'open', 'close', 'when are you', 'location', 'address', 'where are you'],
  help: ['help', 'commands', 'what can you', 'how do i', 'options'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'],
  confirmation: [
    'yes',
    'yeah',
    'yep',
    'sure',
    'ok',
    'okay',
    'confirm',
    'correct',
    'right',
    'book it',
  ],
  unknown: [],
};

// Map user phrases to category slugs
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  haircut: ['haircut', 'cut', 'trim', 'hair cut'],
  'hair-colouring': [
    'color',
    'colour',
    'dye',
    'highlight',
    'balayage',
    'colouring',
    'coloring',
    'tint',
  ],
  'keratin-treatment': ['keratin', 'treatment', 'smoothing', 'rebonding', 'straightening'],
  perm: ['perm', 'curl', 'wave', 'curly'],
  'scalp-therapy': ['scalp', 'dandruff', 'hair loss', 'scalp treatment'],
};

// Days of the week
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Time period mappings
const TIME_PERIODS: Record<string, { start: string; end: string }> = {
  morning: { start: '09:00', end: '12:00' },
  afternoon: { start: '12:00', end: '17:00' },
  evening: { start: '17:00', end: '20:00' },
};

// ============================================================================
// Intent Detection
// ============================================================================

/**
 * Detect intent from message using keyword matching
 */
/**
 * Detect intent from message using keyword matching
 * Prioritizes longer keyword matches for specificity
 */
function detectIntent(message: string): { type: IntentType; confidence: number } {
  const lower = message.toLowerCase().trim();
  let bestMatch: { type: IntentType; confidence: number; matchLength: number } | null = null;

  // Check each intent type
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'unknown') continue;

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        // Found a match. Is it better (longer) than previous?
        // E.g. "make an appointment" (length 19) > "appointment" (length 11)
        if (!bestMatch || keyword.length > bestMatch.matchLength) {
          // Higher confidence for longer keywords
          const confidence = keyword.length > 6 ? 0.9 : 0.7;
          bestMatch = { type: intent as IntentType, confidence, matchLength: keyword.length };
        }
      }
    }
  }

  if (bestMatch) {
    return { type: bestMatch.type, confidence: bestMatch.confidence };
  }

  return { type: 'unknown', confidence: 0.3 };
}

// ============================================================================
// Category Matching
// ============================================================================

/**
 * Match user input to service categories
 */
async function matchCategory(message: string): Promise<{
  category: ServiceCategory | null;
  ambiguous: ServiceCategory[];
}> {
  const lower = message.toLowerCase();
  const allCategories = await getAllCategories();
  const matches: ServiceCategory[] = [];

  // Check each category's keywords
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const category = allCategories.find(c => c.slug === slug);
        if (category && !matches.find(m => m.id === category.id)) {
          matches.push(category);
        }
        break;
      }
    }
  }

  // Also check direct category title matches
  for (const category of allCategories) {
    if (
      lower.includes(category.title.toLowerCase()) ||
      (category.shortTitle && lower.includes(category.shortTitle.toLowerCase()))
    ) {
      if (!matches.find(m => m.id === category.id)) {
        matches.push(category);
      }
    }
  }

  if (matches.length === 1) {
    return { category: matches[0], ambiguous: [] };
  } else if (matches.length > 1) {
    return { category: null, ambiguous: matches };
  }

  return { category: null, ambiguous: [] };
}

/**
 * Format category price note
 */
function formatPriceNote(category: ServiceCategory): string {
  if (category.priceNote) {
    return category.priceNote;
  }
  if (category.priceRangeMin) {
    return `from $${category.priceRangeMin}`;
  }
  return '';
}

// ============================================================================
// Date Parsing
// ============================================================================

/**
 * Parse natural language date expressions
 */
function parseNaturalDate(text: string): {
  raw: string;
  parsed: Date | null;
  formatted: string | null;
} {
  const lower = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check for "today"
  if (lower.includes('today')) {
    return {
      raw: 'today',
      parsed: today,
      formatted: formatDate(today),
    };
  }

  // Check for "tomorrow"
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      raw: 'tomorrow',
      parsed: tomorrow,
      formatted: formatDate(tomorrow),
    };
  }

  // Check for day names: "next monday", "this friday", "monday"
  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i];
    const regex = new RegExp(`(next\\s+)?${day}`, 'i');
    const match = lower.match(regex);

    if (match) {
      const isNext = match[1] !== undefined;
      const targetDay = i;
      const currentDay = today.getDay();

      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0 || isNext) {
        daysToAdd += 7;
      }

      const date = new Date(today);
      date.setDate(date.getDate() + daysToAdd);

      return {
        raw: match[0],
        parsed: date,
        formatted: formatDate(date),
      };
    }
  }

  // Check for "in X days/weeks"
  const inDaysMatch = lower.match(/in\s+(\d+)\s*(day|days)/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return {
      raw: inDaysMatch[0],
      parsed: date,
      formatted: formatDate(date),
    };
  }

  const inWeeksMatch = lower.match(/in\s+(\d+)\s*(week|weeks)/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const date = new Date(today);
    date.setDate(date.getDate() + weeks * 7);
    return {
      raw: inWeeksMatch[0],
      parsed: date,
      formatted: formatDate(date),
    };
  }

  // Check for specific dates: "december 15", "dec 15", "15 december"
  const months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  const monthsShort = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  for (let m = 0; m < months.length; m++) {
    const monthFull = months[m];
    const monthShort = monthsShort[m];

    // "december 15" or "dec 15"
    const regex1 = new RegExp(`(${monthFull}|${monthShort})\\s+(\\d{1,2})`, 'i');
    // "15 december" or "15 dec"
    const regex2 = new RegExp(`(\\d{1,2})\\s+(${monthFull}|${monthShort})`, 'i');

    let dayNum: number | null = null;
    let matched = lower.match(regex1);
    if (matched) {
      dayNum = parseInt(matched[2]);
    } else {
      matched = lower.match(regex2);
      if (matched) {
        dayNum = parseInt(matched[1]);
      }
    }

    if (matched && dayNum) {
      const year = today.getFullYear();
      const date = new Date(year, m, dayNum);
      // If the date is in the past, assume next year
      if (date < today) {
        date.setFullYear(year + 1);
      }
      return {
        raw: matched[0],
        parsed: date,
        formatted: formatDate(date),
      };
    }
  }

  return { raw: '', parsed: null, formatted: null };
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

// ============================================================================
// Time Parsing
// ============================================================================

/**
 * Parse natural language time expressions
 */
function parseNaturalTime(text: string): {
  raw: string;
  parsed: string | null;
  formatted: string | null;
  range?: { start: string; end: string };
} {
  const lower = text.toLowerCase();

  // Check for time periods (morning, afternoon, evening)
  for (const [period, range] of Object.entries(TIME_PERIODS)) {
    if (lower.includes(period)) {
      return {
        raw: period,
        parsed: null,
        formatted: null,
        range,
      };
    }
  }

  // Check for specific times: "2pm", "2:30pm", "14:00", "2 pm"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/;
  const match = lower.match(timeRegex);

  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toLowerCase();

    // Handle AM/PM
    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    // If no AM/PM and hours <= 12, assume PM for reasonable salon hours
    if (!period && hours >= 1 && hours <= 7) {
      hours += 12;
    }

    const parsed = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const formatted = formatTime(hours, minutes);

    return {
      raw: match[0],
      parsed,
      formatted,
    };
  }

  return { raw: '', parsed: null, formatted: null };
}

/**
 * Format time for display
 */
function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a user message and extract intent, category, date, time
 */
export async function parseMessage(message: string): Promise<ParsedIntent> {
  const intent = detectIntent(message);
  const { category, ambiguous } = await matchCategory(message);
  const date = parseNaturalDate(message);
  const time = parseNaturalTime(message);

  // Check for stylist preference
  let stylist: string | undefined;
  const lower = message.toLowerCase();
  if (lower.includes('any stylist') || lower.includes('anyone') || lower.includes('any is fine')) {
    stylist = 'any';
  }

  return {
    type: intent.type,
    confidence: intent.confidence,
    category: category
      ? {
          id: category.id,
          slug: category.slug,
          name: category.title,
          priceNote: formatPriceNote(category),
        }
      : undefined,
    date: date.parsed ? date : undefined,
    time: time.parsed || time.range ? time : undefined,
    stylist,
    ambiguousCategories: ambiguous.length > 0 ? ambiguous : undefined,
    originalMessage: message,
  };
}

// ============================================================================
// Response Generation
// ============================================================================

/**
 * Generate a conversational response based on parsed intent
 * Used when Gemini is unavailable
 */
export async function generateFallbackResponse(
  message: string,
  currentContext?: BookingContextUpdate,
): Promise<ConversationalResponse> {
  const parsed = await parseMessage(message);
  const allCategories = await getAllCategories();

  // Handle confirmation
  if (parsed.type === 'confirmation' && currentContext?.awaitingInput === 'confirmation') {
    return {
      text: "I'd love to confirm your booking, but I'm having some trouble with my booking system right now. Please try again in a moment, or use our web app at the link in your profile to complete your booking.",
      updatedContext: currentContext,
    };
  }

  // Handle greeting
  if (parsed.type === 'greeting') {
    return {
      text: `Hi there! 👋 Welcome to Signature Trims.

I'd be happy to help you book an appointment. What type of service are you looking for today?

We offer:
${allCategories.map(c => `• ${c.title} ${formatPriceNote(c) ? `(${formatPriceNote(c)})` : ''}`).join('\n')}`,
      updatedContext: { awaitingInput: 'category' },
    };
  }

  // Handle services/pricing query
  if (parsed.type === 'services') {
    return {
      text: `Here are our services:\n\n${allCategories.map(c => `*${c.title}*${c.priceNote ? `\n${c.priceNote}` : c.priceRangeMin ? `\nFrom $${c.priceRangeMin}` : ''}`).join('\n\n')}\n\nWould you like to book any of these?`,
    };
  }

  // Handle hours query
  if (parsed.type === 'hours') {
    return {
      text: `We're open:\n\nMonday - Saturday: 10:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM\n\nWould you like to book an appointment?`,
    };
  }

  // Handle help
  if (parsed.type === 'help') {
    return {
      text: `Here's what I can help you with:

• *Book an appointment* - Just tell me what service and when
• *View my appointments* - See your upcoming bookings
• *Cancel or reschedule* - Change your existing bookings
• *See services & prices* - Browse what we offer

Just chat naturally! For example:
"Book a haircut for tomorrow at 2pm"
"What services do you offer?"
"Cancel my appointment"`,
    };
  }

  // Handle booking intent
  if (parsed.type === 'book' || currentContext?.awaitingInput === 'category') {
    // If category was detected
    if (parsed.category) {
      const summary = `✅ *Your Booking:*\n✂️ ${parsed.category.name} ${parsed.category.priceNote ? `(${parsed.category.priceNote})` : ''}`;

      if (parsed.date?.parsed && parsed.time?.parsed) {
        // Full booking info provided
        return {
          text: `${summary}\n📅 ${parsed.date.formatted}\n🕐 ${parsed.time.formatted}\n\nAll set! Just say 'yes' to confirm this booking.\n(Final price will be confirmed at the salon)`,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            date: parsed.date.parsed.toISOString().split('T')[0],
            time: parsed.time.parsed,
            awaitingInput: 'confirmation',
          },
        };
      } else if (parsed.date?.parsed) {
        // Has date but not time
        return {
          text: `${summary}\n📅 ${parsed.date.formatted}\n\nWhat time works for you? You can say something like "2pm" or "afternoon".`,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            date: parsed.date.parsed.toISOString().split('T')[0],
            awaitingInput: 'time',
          },
        };
      } else {
        // Has category but no date
        return {
          text: `${summary}\n\nGreat choice! When would you like to come in?\nJust say something like "tomorrow at 2pm" or "next Saturday".`,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            awaitingInput: 'date',
          },
        };
      }
    }

    // Ambiguous category
    if (parsed.ambiguousCategories && parsed.ambiguousCategories.length > 0) {
      return {
        text: `We have a few options:\n\n${parsed.ambiguousCategories.map(c => `• *${c.title}* ${formatPriceNote(c) ? `(${formatPriceNote(c)})` : ''}`).join('\n')}\n\nWhich one are you interested in?`,
        updatedContext: { awaitingInput: 'category' },
      };
    }

    // No category detected
    return {
      text: `I'd love to help you book an appointment! What type of service are you looking for?\n\nWe offer:\n${allCategories
        .slice(0, 5)
        .map(c => `• ${c.title}`)
        .join('\n')}`,
      updatedContext: { awaitingInput: 'category' },
    };
  }

  // Handle date/time input when context expects it
  if (currentContext?.awaitingInput === 'date' || currentContext?.awaitingInput === 'time') {
    if (parsed.date?.parsed || parsed.time?.parsed) {
      const updatedContext = { ...currentContext };

      let summary = '✅ *Your Booking:*';
      if (currentContext.categoryName) {
        summary += `\n✂️ ${currentContext.categoryName} ${currentContext.priceNote ? `(${currentContext.priceNote})` : ''}`;
      }

      if (parsed.date?.parsed) {
        updatedContext.date = parsed.date.parsed.toISOString().split('T')[0];
        summary += `\n📅 ${parsed.date.formatted}`;
      } else if (currentContext.date) {
        summary += `\n📅 ${formatDate(new Date(currentContext.date))}`;
      }

      if (parsed.time?.parsed) {
        updatedContext.time = parsed.time.parsed;
        summary += `\n🕐 ${parsed.time.formatted}`;
      }

      if (updatedContext.date && updatedContext.time) {
        updatedContext.awaitingInput = 'confirmation';
        return {
          text: `${summary}\n\nPerfect! Just say 'yes' to confirm this booking.\n(Final price will be confirmed at the salon)`,
          updatedContext,
        };
      } else if (updatedContext.date && !updatedContext.time) {
        updatedContext.awaitingInput = 'time';
        return {
          text: `${summary}\n\nWhat time works for you?`,
          updatedContext,
        };
      }
    }

    // Time range provided
    if (parsed.time?.range) {
      return {
        text: `What specific time in the ${parsed.time.raw}? We have openings throughout the ${parsed.time.raw}.`,
        updatedContext: currentContext,
      };
    }
  }

  // Handle view appointments
  if (parsed.type === 'view_appointments') {
    return {
      text: "To view your appointments, I'll need to look that up for you. Could you please provide your email address, or try again in a moment?",
    };
  }

  // Handle cancel/reschedule
  if (parsed.type === 'cancel' || parsed.type === 'reschedule') {
    const action = parsed.type === 'cancel' ? 'cancel' : 'reschedule';
    return {
      text: `I'd be happy to help you ${action} your appointment. Could you provide your email address, or tell me which appointment you'd like to ${action}?`,
    };
  }

  // Unknown intent - provide helpful guidance
  return {
    text: `Sorry, I didn't quite catch that. Here's what I can help with:

• *Book an appointment* - Tell me what service and when
• *View appointments* - See your bookings
• *Cancel or reschedule* - Change existing bookings
• *See prices* - Browse our services

For example, try: "Book a haircut for tomorrow at 2pm"`,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { detectIntent, matchCategory, parseNaturalDate, parseNaturalTime, formatPriceNote };
