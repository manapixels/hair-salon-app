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
import {
  getStylists,
  bookNewAppointment,
  findAppointmentsByEmail,
  cancelAppointment,
  rescheduleAppointment,
  getAvailability,
  findAppointmentById,
} from '@/lib/database';

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
  stylistId?: string; // Stylist ID for booking
  stylistName?: string; // Stylist display name
  ambiguousCategories?: ServiceCategory[]; // When multiple matches
  originalMessage: string;
  hasNegation?: boolean; // "don't want", "cancel that" detected
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
  stylistName?: string;
  customerName?: string;
  customerEmail?: string;
  // For cancel/reschedule flows
  pendingAction?: 'cancel' | 'reschedule' | 'view';
  appointmentId?: string;
  newDate?: string;
  newTime?: string;
  awaitingInput?:
    | 'category'
    | 'date'
    | 'time'
    | 'stylist'
    | 'confirmation'
    | 'email'
    | 'appointment_select';
}

// ============================================================================
// Keyword Mappings
// ============================================================================

const INTENT_KEYWORDS: Record<IntentType, string[]> = {
  book: [
    // Direct requests
    'book',
    'booking',
    'appointment',
    'schedule',
    'reserve',
    'make an appointment',
    // Desire expressions
    'i want',
    'i need',
    "i'd like",
    'i would like',
    'can i get',
    'could i get',
    'looking for',
    'looking to',
    'interested in',
    // Informal
    'get a',
    'do a',
    'have a',
    'need a',
    // Question-based
    'can you book',
    'could you book',
    'is it possible to book',
    // Future tense
    'going to get',
    'gonna get',
    'planning to get',
  ],
  cancel: ['cancel', 'delete', 'remove', 'call off', 'cancel my appointment', 'cancel booking'],
  reschedule: [
    'reschedule',
    'change',
    'move',
    'different time',
    'another time',
    'change my appointment',
    'move my appointment',
    'new time',
    'new date',
  ],
  view_appointments: [
    'my appointments',
    'my bookings',
    'my booking',
    'show my',
    'list my',
    'see my',
    'upcoming',
    'what appointments',
    'check my',
    'view my',
    'show appointments',
    'view appointments',
    'do i have any',
    'when is my',
    'booked for',
  ],
  services: [
    'services',
    'prices',
    'menu',
    'offer',
    'treatments',
    'what do you',
    'how much',
    'what services',
    'price list',
  ],
  hours: [
    'hours',
    'open',
    'close',
    'when are you',
    'location',
    'address',
    'where are you',
    'opening hours',
    'business hours',
  ],
  help: ['help', 'commands', 'what can you', 'how do i', 'options', 'what can i do'],
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
    'sounds good',
    'perfect',
    'go ahead',
    'do it',
    "let's do it",
  ],
  unknown: [],
};

// Map user phrases to category slugs
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  haircut: [
    'haircut',
    'cut',
    'trim',
    'hair cut',
    'snip',
    "men's cut",
    'mens cut',
    "women's cut",
    'womens cut',
    'bang trim',
    'fringe trim',
    'shave',
    'buzz cut',
    'layer',
    'layers',
  ],
  'hair-colouring': [
    'color',
    'colour',
    'dye',
    'highlight',
    'balayage',
    'colouring',
    'coloring',
    'tint',
    'bleach',
    'ombre',
    'root touch up',
    'grey coverage',
    'gray coverage',
    'fashion color',
    'fantasy color',
  ],
  'keratin-treatment': [
    'keratin',
    'keratin treatment',
    'smoothing',
    'rebonding',
    'straightening',
    'brazilian blowout',
    'frizz',
    'anti-frizz',
    'k-gloss',
    'tiboli',
    'hair treatment',
  ],
  perm: [
    'perm',
    'curl',
    'wave',
    'curly',
    'digital perm',
    'cold perm',
    'volume perm',
    'root perm',
    'iron perm',
    'wavy',
  ],
  'scalp-therapy': [
    'scalp',
    'dandruff',
    'hair loss',
    'scalp treatment',
    'oily scalp',
    'dry scalp',
    'itchy scalp',
    'flaky',
    'scalp therapy',
    'thinning',
  ],
};

// Negation phrases that indicate user is NOT requesting something
const NEGATION_PHRASES = [
  "don't want",
  'do not want',
  'not interested',
  'no thanks',
  'never mind',
  'nevermind',
  'cancel that',
  'forget it',
  'not anymore',
  'changed my mind',
  'actually no',
  'nah',
  "don't need",
  'do not need',
];

// Days of the week
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Time period mappings
const TIME_PERIODS: Record<string, { start: string; end: string }> = {
  morning: { start: '09:00', end: '12:00' },
  afternoon: { start: '12:00', end: '17:00' },
  evening: { start: '17:00', end: '20:00' },
};

// Default business hours (fallback if settings not available)
const DEFAULT_BUSINESS_HOURS = {
  open: '10:00',
  close: '20:00',
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a date is in the past (before today)
 */
function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * Check if a time is within business hours
 * Returns: { valid: boolean, suggestion?: string }
 */
function isWithinBusinessHours(
  time: string,
  openTime: string = DEFAULT_BUSINESS_HOURS.open,
  closeTime: string = DEFAULT_BUSINESS_HOURS.close,
): { valid: boolean; message?: string } {
  const [hours] = time.split(':').map(Number);
  const [openHours] = openTime.split(':').map(Number);
  const [closeHours] = closeTime.split(':').map(Number);

  if (hours < openHours) {
    return {
      valid: false,
      message: `We open at ${formatTime(openHours, 0)}. Would you like to book at ${openTime} instead?`,
    };
  }

  if (hours >= closeHours) {
    return {
      valid: false,
      message: `We close at ${formatTime(closeHours, 0)}. Would you like to book earlier in the day?`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Negation Detection
// ============================================================================

/**
 * Check if message contains negation that invalidates the intent
 */
function hasNegation(message: string): boolean {
  const lower = message.toLowerCase();
  return NEGATION_PHRASES.some(phrase => lower.includes(phrase));
}

// ============================================================================
// Stylist Matching
// ============================================================================

/**
 * Match user input to a stylist
 * Handles: "with May", "by Sarah", "anyone", "any stylist"
 * Auto-assigns single stylist when none mentioned
 */
async function matchStylist(message: string): Promise<{
  stylistId: string | null;
  stylistName: string | null;
  isAnyStylist: boolean;
}> {
  const lower = message.toLowerCase();

  // Check for "any stylist" variants
  if (/\b(any|anyone|no preference|doesn't matter|whoever|any stylist|anybody)\b/.test(lower)) {
    return { stylistId: null, stylistName: null, isAnyStylist: true };
  }

  // Fetch stylists from database
  const stylists = await getStylists();

  // If only one stylist exists and no specific preference mentioned, auto-assign
  if (stylists.length === 1) {
    return {
      stylistId: stylists[0].id,
      stylistName: stylists[0].name,
      isAnyStylist: false,
    };
  }

  // Extract "with [name]" or "by [name]" patterns
  const withMatch = lower.match(/\b(?:with|by)\s+([a-z]+)/i);
  const preferredName = withMatch?.[1];

  // Try to match stylist name
  for (const stylist of stylists) {
    const nameLower = stylist.name.toLowerCase();
    const firstName = nameLower.split(' ')[0];

    // Match full name or first name
    if (
      lower.includes(nameLower) ||
      lower.includes(firstName) ||
      preferredName === firstName ||
      preferredName === nameLower
    ) {
      return {
        stylistId: stylist.id,
        stylistName: stylist.name,
        isAnyStylist: false,
      };
    }
  }

  // No specific stylist mentioned
  return { stylistId: null, stylistName: null, isAnyStylist: false };
}

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

  // Track matches with their longest matching keyword
  const matchesWithScore: Array<{ category: ServiceCategory; matchLength: number }> = [];

  // Check each category's keywords and track the longest match
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let longestMatch = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > longestMatch) {
        longestMatch = keyword.length;
      }
    }
    if (longestMatch > 0) {
      const category = allCategories.find(c => c.slug === slug);
      if (category) {
        matchesWithScore.push({ category, matchLength: longestMatch });
      }
    }
  }

  // Also check direct category title matches (these are high priority)
  for (const category of allCategories) {
    const titleMatch = lower.includes(category.title.toLowerCase());
    const shortTitleMatch =
      category.shortTitle && lower.includes(category.shortTitle.toLowerCase());
    if (titleMatch || shortTitleMatch) {
      const matchLen = titleMatch ? category.title.length : category.shortTitle?.length || 0;
      const existing = matchesWithScore.find(m => m.category.id === category.id);
      if (existing) {
        existing.matchLength = Math.max(existing.matchLength, matchLen);
      } else {
        matchesWithScore.push({ category, matchLength: matchLen });
      }
    }
  }

  if (matchesWithScore.length === 0) {
    return { category: null, ambiguous: [] };
  }

  if (matchesWithScore.length === 1) {
    return { category: matchesWithScore[0].category, ambiguous: [] };
  }

  // Multiple matches - check if one is clearly more specific (longer match)
  // Sort by match length descending
  matchesWithScore.sort((a, b) => b.matchLength - a.matchLength);

  // If the best match is significantly longer than the second best, use it
  // "scalp treatment" (15 chars) vs "treatment" (9 chars) -> scalp wins
  const best = matchesWithScore[0];
  const secondBest = matchesWithScore[1];

  // If best match is at least 3 characters longer, it's clearly more specific
  if (best.matchLength >= secondBest.matchLength + 3) {
    return { category: best.category, ambiguous: [] };
  }

  // Matches are similarly specific - return as ambiguous
  return { category: null, ambiguous: matchesWithScore.map(m => m.category) };
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

    // "december 15", "dec 15", "december 15 2026", "dec 15, 2026"
    // IMPORTANT: \b after day ensures "jan 2026" doesn't match as "jan 20" (partial year match)
    const regex1 = new RegExp(
      `(${monthFull}|${monthShort})\\s+(\\d{1,2})\\b(?:(?:,?\\s*|\\s+)(\\d{4}))?`,
      'i',
    );
    // "15 december", "15 dec", "15 december 2026", "15 dec 2026"
    const regex2 = new RegExp(
      `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthFull}|${monthShort})(?:(?:,?\\s*|\\s+)(\\d{4}))?`,
      'i',
    );

    let dayNum: number | null = null;
    let yearNum: number | null = null;
    let matched = lower.match(regex1);
    if (matched) {
      dayNum = parseInt(matched[2]);
      yearNum = matched[3] ? parseInt(matched[3]) : null;
    } else {
      matched = lower.match(regex2);
      if (matched) {
        dayNum = parseInt(matched[1]);
        yearNum = matched[3] ? parseInt(matched[3]) : null;
      }
    }

    if (matched && dayNum) {
      // Use explicit year if provided, otherwise current year
      const year = yearNum || today.getFullYear();
      const date = new Date(year, m, dayNum);
      // If no explicit year and date is in the past, assume next year
      if (!yearNum && date < today) {
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
 * IMPORTANT: Must be strict to avoid matching date numbers like "2" in "2 Jan 2026"
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

  // STRICT time patterns to avoid matching dates:
  // Pattern 1: "at 2pm", "at 2:30pm", "at 14:00" - requires "at" prefix
  // Pattern 2: "2pm", "2:30pm" - requires am/pm suffix
  // Pattern 3: "14:00", "2:30" - requires colon (24-hour or with minutes)

  // Pattern with "at" prefix: "at 2", "at 2pm", "at 14:00"
  const atTimeRegex = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const atMatch = lower.match(atTimeRegex);
  if (atMatch) {
    return processTimeMatch(atMatch[1], atMatch[2], atMatch[3], atMatch[0]);
  }

  // Pattern with AM/PM suffix (required): "2pm", "2:30pm", "12 am"
  const ampmTimeRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const ampmMatch = lower.match(ampmTimeRegex);
  if (ampmMatch) {
    return processTimeMatch(ampmMatch[1], ampmMatch[2], ampmMatch[3], ampmMatch[0]);
  }

  // Pattern with colon (24-hour or minutes): "14:00", "2:30"
  const colonTimeRegex = /\b(\d{1,2}):(\d{2})\b/;
  const colonMatch = lower.match(colonTimeRegex);
  if (colonMatch) {
    // Validate it's a reasonable time (not like "2026" being parsed)
    const hours = parseInt(colonMatch[1]);
    if (hours <= 23) {
      return processTimeMatch(colonMatch[1], colonMatch[2], undefined, colonMatch[0]);
    }
  }

  return { raw: '', parsed: null, formatted: null };
}

/**
 * Helper to process a time match and return parsed result
 */
function processTimeMatch(
  hoursStr: string,
  minutesStr: string | undefined,
  period: string | undefined,
  raw: string,
): { raw: string; parsed: string; formatted: string } {
  let hours = parseInt(hoursStr);
  const minutes = minutesStr ? parseInt(minutesStr) : 0;
  const periodLower = period?.toLowerCase();

  // Handle AM/PM
  if (periodLower === 'pm' && hours < 12) {
    hours += 12;
  } else if (periodLower === 'am' && hours === 12) {
    hours = 0;
  }

  // If no AM/PM and hours 1-7, assume PM for reasonable salon hours
  if (!period && hours >= 1 && hours <= 7) {
    hours += 12;
  }

  const parsed = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const formatted = formatTime(hours, minutes);

  return { raw, parsed, formatted };
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
 * Parse a user message and extract intent, category, date, time, stylist
 */
export async function parseMessage(message: string): Promise<ParsedIntent> {
  const intent = detectIntent(message);
  const { category, ambiguous } = await matchCategory(message);
  const date = parseNaturalDate(message);
  const time = parseNaturalTime(message);
  const stylistMatch = await matchStylist(message);
  const negation = hasNegation(message);

  // Determine stylist display value
  let stylist: string | undefined;
  if (stylistMatch.isAnyStylist) {
    stylist = 'any';
  } else if (stylistMatch.stylistName) {
    stylist = stylistMatch.stylistName;
  }

  return {
    type: negation ? 'unknown' : intent.type, // Negation invalidates intent
    confidence: negation ? 0.2 : intent.confidence,
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
    stylistId: stylistMatch.stylistId ?? undefined,
    stylistName: stylistMatch.stylistName ?? undefined,
    ambiguousCategories: ambiguous.length > 0 ? ambiguous : undefined,
    originalMessage: message,
    hasNegation: negation,
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

  // HANDLE APPOINTMENT SELECTION BY NUMBER
  // When user is selecting from a list of appointments (for cancel/reschedule)
  if (currentContext?.awaitingInput === 'appointment_select' && currentContext?.customerEmail) {
    // Check for number input: "1", "2", "first", "second", etc.
    const numberMatch = message.match(
      /^(\d+)$|^(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)$/i,
    );
    if (numberMatch) {
      let selectedIndex: number;
      const numStr = numberMatch[1] || numberMatch[2]?.toLowerCase();

      const ordinalMap: Record<string, number> = {
        first: 0,
        '1st': 0,
        '1': 0,
        second: 1,
        '2nd': 1,
        '2': 1,
        third: 2,
        '3rd': 2,
        '3': 2,
        fourth: 3,
        '4th': 3,
        '4': 3,
        fifth: 4,
        '5th': 4,
        '5': 4,
      };

      selectedIndex = ordinalMap[numStr] ?? parseInt(numStr) - 1;

      // Fetch appointments to get the selected one
      try {
        const appointments = await findAppointmentsByEmail(currentContext.customerEmail);

        if (selectedIndex >= 0 && selectedIndex < appointments.length) {
          const apt = appointments[selectedIndex];
          const date = new Date(apt.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          if (currentContext.pendingAction === 'cancel') {
            return {
              text: `🗑️ *Cancel Appointment?*\n\n${apt.category?.title || 'Appointment'}\n📅 ${date} at ${apt.time}\n\n👉 Reply 'yes' to confirm cancellation`,
              updatedContext: {
                ...currentContext,
                appointmentId: apt.id,
                date: apt.date.toString().split('T')[0],
                time: apt.time,
                awaitingInput: 'confirmation',
              },
            };
          } else if (currentContext.pendingAction === 'reschedule') {
            return {
              text: `📅 *Reschedule Appointment*\n\n${apt.category?.title || 'Appointment'}\nCurrently: ${date} at ${apt.time}\n\nWhen would you like to reschedule to? (e.g. "next Tuesday at 3pm")`,
              updatedContext: {
                ...currentContext,
                appointmentId: apt.id,
                date: apt.date.toString().split('T')[0],
                time: apt.time,
                awaitingInput: 'date',
              },
            };
          }
        } else {
          return {
            text: `Please enter a valid number between 1 and ${appointments.length}.`,
            updatedContext: currentContext,
          };
        }
      } catch (error) {
        console.error('[IntentParser] Error selecting appointment:', error);
        return {
          text: `Sorry, I couldn't find your appointments. Please try again.`,
        };
      }
    }
  }

  // Handle confirmation ('yes', 'confirm', etc.)
  if (parsed.type === 'confirmation') {
    // Check if we have all required booking info
    const hasBookingInfo =
      currentContext?.categoryId && currentContext?.date && currentContext?.time;

    if (hasBookingInfo) {
      try {
        // Get category info for the booking
        const category = allCategories.find(c => c.id === currentContext.categoryId);

        // Create the booking
        const appointment = await bookNewAppointment({
          date: new Date(currentContext.date!),
          time: currentContext.time!,
          categoryId: currentContext.categoryId,
          estimatedDuration: category?.estimatedDuration || 60,
          services: [], // Category-based booking, no individual services
          customerName: currentContext.customerName || 'Guest',
          customerEmail: currentContext.customerEmail || '',
          stylistId: currentContext.stylistId,
          bookingSource: 'WHATSAPP',
        });

        // Format success message
        const stylistName = currentContext.stylistName || appointment.stylist?.name;
        let successMsg = `✅ *Booking Confirmed!*\n\n`;
        successMsg += `✂️ ${currentContext.categoryName || category?.title}`;
        if (stylistName) {
          successMsg += ` with ${stylistName}`;
        }
        successMsg += `\n📅 ${currentContext.date} at ${currentContext.time}`;
        successMsg += `\n\n📍 We'll see you then! You'll receive a reminder before your appointment.`;

        return {
          text: successMsg,
          updatedContext: undefined, // Clear context after successful booking
        };
      } catch (error: any) {
        console.error('[IntentParser] Booking creation failed:', error);
        return {
          text: `Sorry, I couldn't complete your booking: ${error.message || 'Please try again or use our web app to book.'}`,
          updatedContext: currentContext,
        };
      }
    } else {
      // No booking context - user said 'yes' but we don't know what they're confirming
      return {
        text: `Great! What would you like to book?\n\nJust tell me the service, date, and time. For example:\n"Book a haircut for tomorrow at 2pm"`,
        updatedContext: { awaitingInput: 'category' },
      };
    }
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
      // Merge parsed values with stored context - prioritize newly parsed values
      const effectiveDate = parsed.date?.parsed
        ? parsed.date.parsed.toISOString().split('T')[0]
        : currentContext?.date;
      const effectiveTime = parsed.time?.parsed || currentContext?.time;
      const effectiveStylistId = parsed.stylistId || currentContext?.stylistId;
      const effectiveStylistName = parsed.stylistName || currentContext?.stylistName;

      // Build service line with stylist if available
      let serviceLine = `✂️ ${parsed.category.name}`;
      if (parsed.category.priceNote) {
        serviceLine += ` (${parsed.category.priceNote})`;
      }
      if (effectiveStylistName) {
        serviceLine += ` with ${effectiveStylistName}`;
      }

      if (effectiveDate && effectiveTime) {
        // Full booking info provided - VALIDATE before confirmation
        const dateForFormatting = parsed.date?.formatted || formatDate(new Date(effectiveDate));
        const timeForFormatting =
          parsed.time?.formatted ||
          formatTime(parseInt(effectiveTime.split(':')[0]), parseInt(effectiveTime.split(':')[1]));

        const requestedDate = new Date(effectiveDate);

        // VALIDATION 1: Check if date is in the past
        if (isPastDate(requestedDate)) {
          return {
            text: `❌ *Sorry, ${dateForFormatting} is in the past.*\n\nPlease choose a date from today onwards. When would you like to book?`,
            updatedContext: {
              categoryId: parsed.category.id,
              categoryName: parsed.category.name,
              priceNote: parsed.category.priceNote,
              stylistId: effectiveStylistId,
              stylistName: effectiveStylistName,
              awaitingInput: 'date',
            },
          };
        }

        // VALIDATION 2: Check if time is within business hours
        const hoursCheck = isWithinBusinessHours(effectiveTime);
        if (!hoursCheck.valid) {
          return {
            text: `❌ *Sorry, ${timeForFormatting} is outside our business hours.*\n\n${hoursCheck.message}\n\nOur hours: 10:00 AM - 8:00 PM`,
            updatedContext: {
              categoryId: parsed.category.id,
              categoryName: parsed.category.name,
              priceNote: parsed.category.priceNote,
              date: effectiveDate,
              stylistId: effectiveStylistId,
              stylistName: effectiveStylistName,
              awaitingInput: 'time',
            },
          };
        }

        // VALIDATION 3: Check if the requested time slot is available
        const availableSlots = await getAvailability(requestedDate);

        // Check if requested time is in available slots
        const isSlotAvailable = availableSlots.includes(effectiveTime);

        if (!isSlotAvailable) {
          // Slot is NOT available - suggest alternatives instead of asking for confirmation
          if (availableSlots.length > 0) {
            // Some slots available on this date
            const suggestedSlots = availableSlots.slice(0, 5).map(slot => {
              const [h, m] = slot.split(':').map(Number);
              return formatTime(h, m);
            });

            return {
              text: `❌ *Sorry, ${timeForFormatting} is not available on ${dateForFormatting}.*\n\n📅 *Available times on ${dateForFormatting}:*\n${suggestedSlots.map(t => `• ${t}`).join('\n')}\n\nWould you like one of these times instead? Just say e.g. "${suggestedSlots[0]}"`,
              updatedContext: {
                categoryId: parsed.category.id,
                categoryName: parsed.category.name,
                priceNote: parsed.category.priceNote,
                date: effectiveDate,
                stylistId: effectiveStylistId,
                stylistName: effectiveStylistName,
                awaitingInput: 'time',
              },
            };
          } else {
            // No slots available on this date - suggest next available dates
            const suggestions: { date: Date; formatted: string; slots: string[] }[] = [];
            for (let i = 1; i <= 7 && suggestions.length < 3; i++) {
              const nextDate = new Date(requestedDate);
              nextDate.setDate(requestedDate.getDate() + i);
              const nextSlots = await getAvailability(nextDate);
              if (nextSlots.length > 0) {
                suggestions.push({
                  date: nextDate,
                  formatted: formatDate(nextDate),
                  slots: nextSlots.slice(0, 3),
                });
              }
            }

            if (suggestions.length > 0) {
              return {
                text: `❌ *Sorry, ${dateForFormatting} is fully booked.*\n\n📅 *Next available dates:*\n${suggestions.map(s => `• ${s.formatted} (slots: ${s.slots.map(slot => formatTime(parseInt(slot.split(':')[0]), parseInt(slot.split(':')[1]))).join(', ')})`).join('\n')}\n\nWould you like to book on one of these dates?`,
                updatedContext: {
                  categoryId: parsed.category.id,
                  categoryName: parsed.category.name,
                  priceNote: parsed.category.priceNote,
                  stylistId: effectiveStylistId,
                  stylistName: effectiveStylistName,
                  awaitingInput: 'date',
                },
              };
            } else {
              return {
                text: `❌ *Sorry, no availability found in the next week.*\n\nPlease try checking a later date or give us a call at (555) 123-4567 for urgent assistance.`,
                updatedContext: {
                  awaitingInput: 'date',
                },
              };
            }
          }
        }

        // VALIDATION 4: Check if enough CONSECUTIVE slots are available for the service duration
        // Get the full category to access estimatedDuration
        const fullCategory = allCategories.find(c => c.id === parsed.category!.id);
        const serviceDuration = fullCategory?.estimatedDuration || 60; // Default 60 min if not set
        const numSlotsRequired = Math.ceil(serviceDuration / 30);

        if (numSlotsRequired > 1) {
          // Check consecutive slots starting from requested time
          const requiredSlots: string[] = [];
          const startTime = new Date(`1970-01-01T${effectiveTime}:00`);

          for (let i = 0; i < numSlotsRequired; i++) {
            const slotTime = new Date(startTime);
            slotTime.setMinutes(slotTime.getMinutes() + i * 30);
            requiredSlots.push(slotTime.toTimeString().substring(0, 5));
          }

          const missingSlots = requiredSlots.filter(slot => !availableSlots.includes(slot));

          if (missingSlots.length > 0) {
            // Not enough consecutive slots - generate HELPFUL message
            const durationHours = Math.floor(serviceDuration / 60);
            const durationMins = serviceDuration % 60;
            const durationText =
              durationHours > 0
                ? durationMins > 0
                  ? `${durationHours}h ${durationMins}min`
                  : `${durationHours} hours`
                : `${durationMins} minutes`;

            // Find alternative times that DO have enough consecutive slots
            const viableTimes: string[] = [];
            for (const slot of availableSlots) {
              // Check if this slot has enough consecutive slots
              const slotStart = new Date(`1970-01-01T${slot}:00`);
              let allConsecutiveAvailable = true;

              for (let i = 0; i < numSlotsRequired; i++) {
                const checkTime = new Date(slotStart);
                checkTime.setMinutes(checkTime.getMinutes() + i * 30);
                const checkSlot = checkTime.toTimeString().substring(0, 5);
                if (!availableSlots.includes(checkSlot)) {
                  allConsecutiveAvailable = false;
                  break;
                }
              }

              if (allConsecutiveAvailable) {
                // Collect ALL viable times first
                viableTimes.push(slot);
              }
            }

            // Sort by proximity to requested time
            const targetMins =
              parseInt(effectiveTime.split(':')[0]) * 60 + parseInt(effectiveTime.split(':')[1]);
            viableTimes.sort((a, b) => {
              const aMins = parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]);
              const bMins = parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1]);
              return Math.abs(aMins - targetMins) - Math.abs(bMins - targetMins);
            });

            if (viableTimes.length > 0) {
              // Suggest best 3 options
              const viableFormatted = viableTimes.slice(0, 3).map(slot => {
                const [h, m] = slot.split(':').map(Number);
                return formatTime(h, m);
              });

              return {
                text: `💡 *${parsed.category.name} typically takes ${durationText}.*\n\nStarting at ${timeForFormatting}, we won't have enough time before our next booking or closing.\n\n📅 *Times with enough availability:*\n${viableFormatted.map(t => `• ${t}`).join('\n')}\n\nWould any of these work for you?`,
                updatedContext: {
                  categoryId: parsed.category.id,
                  categoryName: parsed.category.name,
                  priceNote: parsed.category.priceNote,
                  date: effectiveDate,
                  stylistId: effectiveStylistId,
                  stylistName: effectiveStylistName,
                  awaitingInput: 'time',
                },
              };
            } else {
              // No viable times on this date
              return {
                text: `💡 *${parsed.category.name} typically takes ${durationText}.*\n\nUnfortunately, ${dateForFormatting} doesn't have enough consecutive availability.\n\nWould you like to try a different date?`,
                updatedContext: {
                  categoryId: parsed.category.id,
                  categoryName: parsed.category.name,
                  priceNote: parsed.category.priceNote,
                  stylistId: effectiveStylistId,
                  stylistName: effectiveStylistName,
                  awaitingInput: 'date',
                },
              };
            }
          }
        }

        // Slot IS available with enough consecutive time - show confirmation
        let confirmText = `📋 *Ready to Book:*\n${serviceLine}\n📅 ${dateForFormatting} at ${timeForFormatting}\n\n👉 *Reply 'yes' to confirm*`;
        if (!effectiveStylistName && parsed.stylist !== 'any') {
          // No stylist specified and not "any" - note this
          confirmText += '\n_(Stylist assigned based on availability)_';
        }

        return {
          text: confirmText,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            date: effectiveDate,
            time: effectiveTime,
            stylistId: effectiveStylistId,
            stylistName: effectiveStylistName,
            awaitingInput: 'confirmation',
          },
        };
      } else if (effectiveDate) {
        // Has date but not time
        const dateForFormatting = parsed.date?.formatted || formatDate(new Date(effectiveDate));
        return {
          text: `📋 *Almost there:*\n${serviceLine}\n📅 ${dateForFormatting}\n\nWhat time works for you? (e.g. "2pm" or "afternoon")`,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            date: effectiveDate,
            stylistId: effectiveStylistId,
            stylistName: effectiveStylistName,
            awaitingInput: 'time',
          },
        };
      } else {
        // Has category but no date
        return {
          text: `📋 *Great choice:*\n${serviceLine}\n\nWhen would you like to come in? (e.g. "tomorrow at 2pm")`,
          updatedContext: {
            categoryId: parsed.category.id,
            categoryName: parsed.category.name,
            priceNote: parsed.category.priceNote,
            stylistId: effectiveStylistId,
            stylistName: effectiveStylistName,
            awaitingInput: 'date',
          },
        };
      }
    }

    // Ambiguous category - preserve any date/time/stylist info already parsed
    if (parsed.ambiguousCategories && parsed.ambiguousCategories.length > 0) {
      return {
        text: `We have a few options:\n\n${parsed.ambiguousCategories.map(c => `• *${c.title}* ${formatPriceNote(c) ? `(${formatPriceNote(c)})` : ''}`).join('\n')}\n\nWhich one are you interested in?`,
        updatedContext: {
          awaitingInput: 'category',
          // Preserve date/time/stylist from the original message so they're not lost
          date: parsed.date?.parsed
            ? parsed.date.parsed.toISOString().split('T')[0]
            : currentContext?.date,
          time: parsed.time?.parsed || currentContext?.time,
          stylistId: parsed.stylistId || currentContext?.stylistId,
          stylistName: parsed.stylistName || currentContext?.stylistName,
        },
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

      let summary = '📋 *Almost there:*';
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
    const email = currentContext?.customerEmail;

    if (email) {
      try {
        const appointments = await findAppointmentsByEmail(email);
        if (appointments.length === 0) {
          return {
            text: `📅 You don't have any upcoming appointments.\n\nWould you like to book one?`,
          };
        }

        // Format appointments list
        const appointmentList = appointments
          .slice(0, 5) // Show max 5
          .map((apt, i) => {
            const date = new Date(apt.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            // Format time as 12-hour (e.g., "2:00 PM")
            const [hours, minutes] = apt.time.split(':').map(Number);
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            const service = apt.category?.title || 'Appointment';
            const stylist = apt.stylist?.name ? ` with ${apt.stylist.name}` : '';
            return `${i + 1}. ${service}${stylist}\n   ${date} at ${formattedTime}`;
          })
          .join('\n\n');

        return {
          text: `📅 *Your Upcoming Appointments:*\n\n${appointmentList}\n\nTo cancel or reschedule, just let me know which one.`,
          updatedContext: { ...currentContext, pendingAction: 'view' },
        };
      } catch (error) {
        console.error('[IntentParser] Error fetching appointments:', error);
        return {
          text: `Sorry, I couldn't fetch your appointments right now. Please try again.`,
        };
      }
    } else {
      return {
        text: `To view your appointments, please provide your email address.`,
        updatedContext: { pendingAction: 'view', awaitingInput: 'email' },
      };
    }
  }

  // Handle cancel
  if (parsed.type === 'cancel') {
    const email = currentContext?.customerEmail;

    // If we have an appointment ID to cancel
    if (currentContext?.appointmentId && email) {
      try {
        await cancelAppointment({
          customerEmail: email,
          date: currentContext.date!,
          time: currentContext.time!,
        });
        return {
          text: `✅ *Appointment Cancelled*\n\nYour appointment has been cancelled successfully.\n\nWould you like to book a new appointment?`,
          updatedContext: undefined, // Clear context
        };
      } catch (error: any) {
        console.error('[IntentParser] Cancel failed:', error);
        return {
          text: `Sorry, I couldn't cancel that appointment: ${error.message || 'Please try again.'}`,
          updatedContext: currentContext,
        };
      }
    }

    // If we have email, show appointments to select from
    if (email) {
      try {
        const appointments = await findAppointmentsByEmail(email);
        if (appointments.length === 0) {
          return {
            text: `You don't have any upcoming appointments to cancel.`,
          };
        }

        if (appointments.length === 1) {
          // Only one appointment - confirm cancellation
          const apt = appointments[0];
          const date = new Date(apt.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          return {
            text: `🗑️ *Cancel Appointment?*\n\n${apt.category?.title || 'Appointment'}\n📅 ${date} at ${apt.time}\n\n👉 Reply 'yes' to confirm cancellation`,
            updatedContext: {
              ...currentContext,
              pendingAction: 'cancel',
              appointmentId: apt.id,
              date: apt.date.toString().split('T')[0],
              time: apt.time,
              awaitingInput: 'confirmation',
            },
          };
        }

        // Multiple appointments - ask which one
        const list = appointments
          .slice(0, 5)
          .map((apt, i) => {
            const date = new Date(apt.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            return `${i + 1}. ${apt.category?.title || 'Appointment'} - ${date} at ${apt.time}`;
          })
          .join('\n');

        return {
          text: `Which appointment would you like to cancel?\n\n${list}\n\nReply with the number.`,
          updatedContext: {
            ...currentContext,
            pendingAction: 'cancel',
            awaitingInput: 'appointment_select',
          },
        };
      } catch (error) {
        console.error('[IntentParser] Error fetching appointments for cancel:', error);
        return {
          text: `Sorry, I couldn't fetch your appointments. Please try again.`,
        };
      }
    } else {
      return {
        text: `To cancel an appointment, please provide your email address.`,
        updatedContext: { pendingAction: 'cancel', awaitingInput: 'email' },
      };
    }
  }

  // Handle reschedule
  if (parsed.type === 'reschedule') {
    const email = currentContext?.customerEmail;

    // Detect complex inline reschedule requests like "reschedule my haircut on 12 dec to 14 dec"
    // These contain date info and should fall through to Gemini for NLP processing
    const hasInlineDates =
      /\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(message) ||
      /to\s+(next|this|tomorrow|mon|tue|wed|thu|fri|sat|sun|\d{1,2})/i.test(message);
    if (hasInlineDates && !currentContext?.appointmentId) {
      // Complex request - fall through to Gemini
      return null as any; // Signal to geminiService to use AI
    }

    // If we have appointment and new date/time - execute reschedule
    if (
      currentContext?.appointmentId &&
      currentContext?.newDate &&
      currentContext?.newTime &&
      email
    ) {
      // PRE-CHECK AVAILABILITY before rescheduling
      const newDate = new Date(currentContext.newDate);
      const availableSlots = await getAvailability(newDate);

      // Get appointment details to know duration
      const appointmentStub = await findAppointmentById(currentContext.appointmentId);
      const totalDuration = appointmentStub?.totalDuration || 60; // Default 60 min if not found
      const numSlotsRequired = Math.ceil(totalDuration / 30);

      // Check if requested time is in available slots
      const isSlotAvailable = availableSlots.includes(currentContext.newTime);

      if (!isSlotAvailable) {
        // Slot not available - suggest alternatives
        if (availableSlots.length > 0) {
          const suggestedSlots = availableSlots.slice(0, 5).map(slot => {
            const [h, m] = slot.split(':').map(Number);
            return formatTime(h, m);
          });
          return {
            text: `❌ *Sorry, ${currentContext.newTime} is not available on ${formatDate(newDate)}.*\n\n📅 *Available times:*\n${suggestedSlots.map(t => `• ${t}`).join('\n')}\n\nWhich time would you prefer?`,
            updatedContext: {
              ...currentContext,
              newTime: undefined, // Clear invalid time
            },
          };
        } else {
          // No slots available on this date - suggest next available dates
          const suggestions: { date: Date; formatted: string; slots: string[] }[] = [];
          for (let i = 1; i <= 7 && suggestions.length < 3; i++) {
            const nextCheckDate = new Date(newDate);
            nextCheckDate.setDate(newDate.getDate() + i);
            const nextSlots = await getAvailability(nextCheckDate);
            if (nextSlots.length > 0) {
              suggestions.push({
                date: nextCheckDate,
                formatted: formatDate(nextCheckDate),
                slots: nextSlots.slice(0, 3),
              });
            }
          }

          if (suggestions.length > 0) {
            return {
              text: `❌ *Sorry, ${formatDate(newDate)} is fully booked.*\n\n📅 *Next available dates for rescheduling:*\n${suggestions.map(s => `• ${s.formatted} (slots: ${s.slots.map(slot => formatTime(parseInt(slot.split(':')[0]), parseInt(slot.split(':')[1]))).join(', ')})`).join('\n')}\n\nWould you like one of these dates?`,
              updatedContext: {
                ...currentContext,
                newDate: undefined,
                newTime: undefined,
              },
            };
          } else {
            return {
              text: `❌ *Sorry, no availability found in the next week.*\n\nPlease try checking a later date or give us a call at (555) 123-4567 for urgent assistance.`,
              updatedContext: {
                ...currentContext,
                newDate: undefined,
                newTime: undefined,
              },
            };
          }
        }
      }

      // VALIDATION: Check if enough CONSECUTIVE slots are available
      if (numSlotsRequired > 1) {
        // Check consecutive slots starting from requested time
        const requiredSlots: string[] = [];
        const startTime = new Date(`1970-01-01T${currentContext.newTime}:00`);

        for (let i = 0; i < numSlotsRequired; i++) {
          const slotTime = new Date(startTime);
          slotTime.setMinutes(slotTime.getMinutes() + i * 30);
          requiredSlots.push(slotTime.toTimeString().substring(0, 5));
        }

        const missingSlots = requiredSlots.filter(slot => !availableSlots.includes(slot));

        if (missingSlots.length > 0) {
          // Not enough consecutive slots - generate HELPFUL message
          const durationHours = Math.floor(totalDuration / 60);
          const durationMins = totalDuration % 60;
          const durationText =
            durationHours > 0
              ? durationMins > 0
                ? `${durationHours}h ${durationMins}min`
                : `${durationHours} hours`
              : `${durationMins} minutes`;

          // Find alternative times that DO have enough consecutive slots
          const viableTimes: string[] = [];
          for (const slot of availableSlots) {
            // Check if this slot has enough consecutive slots
            const slotStart = new Date(`1970-01-01T${slot}:00`);
            let allConsecutiveAvailable = true;

            for (let i = 0; i < numSlotsRequired; i++) {
              const checkTime = new Date(slotStart);
              checkTime.setMinutes(checkTime.getMinutes() + i * 30);
              const checkSlot = checkTime.toTimeString().substring(0, 5);
              if (!availableSlots.includes(checkSlot)) {
                allConsecutiveAvailable = false;
                break;
              }
            }

            if (allConsecutiveAvailable) {
              // Collect ALL first
              viableTimes.push(slot);
            }
          }

          // Sort by proximity to requested time
          const targetMins =
            parseInt(currentContext.newTime.split(':')[0]) * 60 +
            parseInt(currentContext.newTime.split(':')[1]);
          viableTimes.sort((a, b) => {
            const aMins = parseInt(a.split(':')[0]) * 60 + parseInt(a.split(':')[1]);
            const bMins = parseInt(b.split(':')[0]) * 60 + parseInt(b.split(':')[1]);
            return Math.abs(aMins - targetMins) - Math.abs(bMins - targetMins);
          });

          const serviceName = appointmentStub?.category?.title || 'This service';

          if (viableTimes.length > 0) {
            const viableFormatted = viableTimes.slice(0, 3).map(slot => {
              const [h, m] = slot.split(':').map(Number);
              return formatTime(h, m);
            });

            return {
              text: `💡 *${serviceName} takes ${durationText}.*\n\nStarting at ${currentContext.newTime}, we won't have enough time before closing/next booking.\n\n📅 *Times with enough availability:*\n${viableFormatted.map(t => `• ${t}`).join('\n')}\n\nWould any of these work?`,
              updatedContext: {
                ...currentContext,
                newTime: undefined,
              },
            };
          } else {
            return {
              text: `💡 *${serviceName} takes ${durationText}.*\n\nUnfortunately, ${formatDate(newDate)} doesn't have enough consecutive availability.\n\nWould you like to try a different date?`,
              updatedContext: {
                ...currentContext,
                newDate: undefined,
                newTime: undefined,
              },
            };
          }
        }
      }

      try {
        await rescheduleAppointment(
          currentContext.appointmentId,
          new Date(currentContext.newDate),
          currentContext.newTime,
        );
        return {
          text: `✅ *Appointment Rescheduled*\n\n📅 New time: ${currentContext.newDate} at ${currentContext.newTime}\n\nSee you then!`,
          updatedContext: undefined, // Clear context
        };
      } catch (error: any) {
        console.error('[IntentParser] Reschedule failed:', error);
        return {
          text: `Sorry, I couldn't reschedule: ${error.message || 'Please try again.'}`,
          updatedContext: currentContext,
        };
      }
    }

    // If we have email, show appointments to select from
    if (email) {
      try {
        const appointments = await findAppointmentsByEmail(email);
        if (appointments.length === 0) {
          return {
            text: `You don't have any upcoming appointments to reschedule.`,
          };
        }

        if (appointments.length === 1) {
          // Only one appointment - ask for new date/time
          const apt = appointments[0];
          const date = new Date(apt.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          return {
            text: `📅 *Reschedule Appointment*\n\n${apt.category?.title || 'Appointment'}\nCurrently: ${date} at ${apt.time}\n\nWhen would you like to reschedule to? (e.g. "next Tuesday at 3pm")`,
            updatedContext: {
              ...currentContext,
              pendingAction: 'reschedule',
              appointmentId: apt.id,
              date: apt.date.toString().split('T')[0],
              time: apt.time,
              awaitingInput: 'date',
            },
          };
        }

        // Multiple appointments - ask which one
        const list = appointments
          .slice(0, 5)
          .map((apt, i) => {
            const date = new Date(apt.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            return `${i + 1}. ${apt.category?.title || 'Appointment'} - ${date} at ${apt.time}`;
          })
          .join('\n');

        return {
          text: `Which appointment would you like to reschedule?\n\n${list}\n\nReply with the number.`,
          updatedContext: {
            ...currentContext,
            pendingAction: 'reschedule',
            awaitingInput: 'appointment_select',
          },
        };
      } catch (error) {
        console.error('[IntentParser] Error fetching appointments for reschedule:', error);
        return {
          text: `Sorry, I couldn't fetch your appointments. Please try again.`,
        };
      }
    } else {
      return {
        text: `To reschedule an appointment, please provide your email address.`,
        updatedContext: { pendingAction: 'reschedule', awaitingInput: 'email' },
      };
    }
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
