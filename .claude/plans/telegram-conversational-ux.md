# Telegram Integration Review & Improvement Plan

## Current Capabilities Analysis

### What the Telegram Bot Currently Does

**Structured Commands (via botCommandService.ts)**
| Command | Functionality |
|---------|---------------|
| `/start` | Welcome message with main menu inline buttons |
| `/services` | List all services with pricing, "Book" buttons per service |
| `/appointments` | View user's upcoming appointments with Edit/Cancel buttons |
| `/book` | Multi-step booking wizard (Service → Stylist → Date → Time → Confirm) |
| `/cancel` | List appointments with cancel confirmation flow |
| `/reschedule` | List appointments to reschedule (text-based follow-up) |
| `/hours` | Business hours + Google Maps link |
| `/help` | Show all commands + natural language examples |

**Booking Flow Features**

- Multi-service selection (add multiple services)
- Stylist preference selection ("Any Stylist" option)
- Date picker with week navigation (paginated)
- Time slot grouping (Morning/Afternoon/Evening)
- Wizard-style single message editing (cleaner UX)
- Back button navigation with state restoration
- Session timeout (30 min) with context cleanup
- Quick rebooking from last service/stylist

**Natural Language Processing (via Gemini 2.5 Flash)**

- Free-text booking requests
- Service recommendations by concern (frizzy hair → keratin)
- Appointment queries, cancellations
- Knowledge base search for FAQs
- Automatic escalation to admin when uncertain

**Infrastructure**

- Rate limiting per chat ID
- Typing indicators
- Message ID tracking for edits
- Fallback to new message if edit fails
- OAuth login flow via deep link

---

## Identified Gaps & Improvement Opportunities

### 1. **No Fallback When Gemini Fails**

**Current Behavior:** If Gemini API fails or is slow, returns generic error.
**Risk:** User experience degrades; no way to complete booking.
**Improvement:** Add deterministic fallback that parses user intent with keyword matching.

### 2. **Reschedule Flow is Text-Based After Selection**

**Current:** After selecting appointment to reschedule, says "tell me your preferred new date and time" (requires NLP).
**Better UX:** Should show date picker just like booking flow.

### 3. **No Confirmation for Natural Language Bookings**

**Current:** When Gemini books, it directly books without button confirmation.
**Risk:** Misunderstood requests lead to wrong bookings.
**Improvement:** Always show confirmation screen before finalizing.

### 4. **Limited Quick Actions**

**Missing:**

- "Book same as last time" shortcut
- "Earliest available" quick option
- Popular time suggestions based on user history

### 5. **No Proactive Suggestions**

**Missing:**

- Suggest follow-up appointment after completion
- Remind about services they haven't tried
- Personalized greetings based on visit history

### 6. **Inline Keyboard Layout Inconsistencies**

- Some screens have back buttons, some don't
- Date picker uses 2-column layout, time picker uses 3-column (inconsistent)
- Some messages are too long for mobile

### 7. **No List Messages (Telegram Supports Them)**

**Current:** Uses only inline keyboards.
**Better:** For long service lists, use Telegram's list format for cleaner presentation.

### 8. **Error Recovery is Limited**

**Current:** Some errors just show "Please try again."
**Better:** Context-aware recovery suggestions.

### 9. **No Multi-Language Support**

Currently English only. No i18n framework in place.

### 10. **No Waitlist Feature**

When fully booked, no way to join a waitlist for cancellations.

---

## Best Practices from Research

### Telegram Bot UX Best Practices (2025)

| Practice                                | Status     | Action Needed       |
| --------------------------------------- | ---------- | ------------------- |
| Use inline keyboards over text commands | ✅ Done    | -                   |
| Edit messages instead of sending new    | ✅ Done    | -                   |
| Group buttons logically (2-3 per row)   | ⚠️ Partial | Standardize layouts |
| Show typing indicators                  | ✅ Done    | -                   |
| Use callback data < 64 bytes            | ✅ Done    | -                   |
| Provide back navigation                 | ⚠️ Partial | Add consistently    |
| Error messages with recovery actions    | ⚠️ Partial | Improve             |
| Limit button text to ~20 chars          | ⚠️ Partial | Some are too long   |
| Use emojis for visual hierarchy         | ✅ Done    | -                   |
| Support natural language + structured   | ✅ Done    | -                   |

### WhatsApp Business Best Practices (for parity)

| Practice                   | Status      | Notes                         |
| -------------------------- | ----------- | ----------------------------- |
| Reply buttons (up to 3)    | N/A         | WhatsApp-specific             |
| List messages (up to 10)   | ❌ Not used | Could use Telegram equivalent |
| Quick replies              | ✅ Done     | Via inline keyboards          |
| Interactive templates      | N/A         | WhatsApp-specific             |
| Reduce typing with buttons | ✅ Done     | -                             |

---

## Recommended Improvements (Prioritized)

### Priority 1: Critical Fallbacks (Reliability)

#### 1.1 Deterministic Fallback Parser

Create keyword-based intent parser when Gemini fails:

```
User: "book haircut tomorrow"
→ Detect: intent=book, service=*haircut*, date=tomorrow
→ Show service selection with fuzzy match highlighted
```

**Files to modify:**

- `src/services/geminiService.ts` - add try/catch with fallback
- New: `src/services/intentParser.ts` - keyword matching service

#### 1.2 Graceful Degradation Message

When AI is unavailable, guide users to structured commands:

```
"I'm having trouble understanding. Please use the buttons below or try:
/book - Start booking
/appointments - View bookings"
```

### Priority 2: Complete Button-Based Flows

#### 2.1 Reschedule Flow with Date Picker

Extend reschedule to use the same date/time picker as booking.

**Files:** `src/services/botCommandService.ts` lines 1646-1653

#### 2.2 Confirmation Before All Bookings

Whether via NLP or buttons, always show confirmation screen.

**Files:** `src/services/geminiService.ts` lines 500-545

### Priority 3: UX Enhancements

#### 3.1 Consistent Back Buttons

Add back navigation to ALL screens:

- Service list → Main menu
- Stylist list → Service selection
- Date picker → Stylist selection
- Time picker → Date selection
- Confirmation → Time selection

#### 3.2 Quick Actions Menu

Add to main menu:

- "⭐ Book Again" (if has previous)
- "⏰ Earliest Available"
- "📅 View Calendar" (visual availability)

#### 3.3 Smarter Error Recovery

Instead of "Please try again," show:

- What went wrong (simplified)
- Specific action to fix
- Alternative paths

### Priority 4: Advanced Features

#### 4.1 Waitlist for Fully Booked Slots

When date is full:

- Offer to join waitlist
- Notify if cancellation occurs
- Store in database

#### 4.2 Proactive Suggestions

After booking confirmation:

- "Would you like a reminder 1 week before?"
- "Book your next appointment in 4-6 weeks?"

#### 4.3 User Preference Learning

Track and use:

- Preferred time of day
- Favorite stylist
- Typical service duration

---

## REVISED Implementation Plan

**Key UX Philosophy Change:**

> "The bot should feel like talking to a friendly human, not clicking through menus.
> Buttons are for the NextJS app. Chat is for conversation."

---

## New UX Direction: Text-Based Conversational

### What Changes

| Before (Button-Heavy)                                                     | After (Conversational)                                                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/book` → Service buttons → Stylist buttons → Date buttons → Time buttons | "I'd like a haircut tomorrow at 2pm" → "Got it! Men's or women's haircut?" → "Men's" → "Booked!" |
| Multi-step wizard with inline keyboards                                   | Natural back-and-forth dialogue                                                                  |
| Clicking through menus                                                    | Typing naturally                                                                                 |
| Message editing to show progress                                          | Simple text responses                                                                            |

### What Stays

| Feature                          | Reason                                          |
| -------------------------------- | ----------------------------------------------- |
| Main menu buttons (`/start`)     | Entry point navigation - keeps discovery easy   |
| Reminder buttons (minimal)       | Time-sensitive actions need one-tap convenience |
| Progressive confirmation display | Show confirmed details as user progresses       |
| Help command                     | Show what they can say                          |

### Key UX Pattern: Progressive Confirmation Display

As user moves through booking steps, maintain a **persistent summary message** that shows confirmed details:

```
User: "I want to book a haircut"
Bot: "Sure! Men's or women's haircut?"

User: "Men's"
Bot: "✅ *Current Booking:*
     ✂️ Men's Haircut ($35, 30 mins)

     When would you like to come in?"

User: "Tomorrow at 2pm"
Bot: "✅ *Current Booking:*
     ✂️ Men's Haircut ($35, 30 mins)
     📅 Tomorrow (Dec 10)
     🕐 2:00 PM

     Should I book this for you? Just say 'yes' to confirm!"
```

This way users always see what's been confirmed so far.

---

## Implementation Plan

### Phase 1: Robust Deterministic Intent Parser (Fallback for Gemini)

**New file:** `src/services/intentParser.ts`

The core of a text-based experience is understanding user intent WITHOUT AI when needed. This parser should:

1. **Detect Intent from Keywords**

```typescript
// "book haircut tomorrow 3pm" → { intent: 'book', service: 'haircut', date: 'tomorrow', time: '3pm' }
// "cancel my appointment on friday" → { intent: 'cancel', date: 'friday' }
// "what services do you have" → { intent: 'services' }
```

2. **Parse Natural Dates**

```typescript
// "tomorrow" → next day
// "next friday" → nearest friday
// "december 15" → Dec 15, 2024
// "in 2 weeks" → +14 days
```

3. **Parse Natural Times**

```typescript
// "3pm" → "15:00"
// "afternoon" → suggest 12:00-17:00 range
// "morning" → suggest 09:00-12:00 range
```

4. **Fuzzy Match Services**

```typescript
// "haircut" → "Men's Haircut" or "Women's Haircut" (ask to clarify)
// "color" → "Full Colouring"
// "keratin" → "K-Gloss Keratin Treatment" or "Tiboli Keratin Treatment"
```

5. **Handle Ambiguity Conversationally**

```typescript
// User: "I want a haircut"
// Bot: "Sure! Would you like a men's haircut ($35) or women's haircut ($45)?"
// NOT: [Button: Men's] [Button: Women's]
```

### Phase 2: Conversational Flow Design

#### Booking Flow (Category-Based, Text-Based with Progressive Confirmation)

**Important:** Like the web app, the bot uses **service categories** (Haircuts, Colouring, Treatments, Perms) - NOT individual services. Each category has a price range and estimated duration.

```
User: "I want to book an appointment"
Bot: "I'd love to help! What type of service are you looking for?
     We have Haircuts, Hair Colouring, Keratin & Treatments, Perms, and more."

User: "haircut"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28, ~30-45 mins)

     Great choice! When would you like to come in?
     Just say something like 'tomorrow at 2pm' or 'next Saturday'."

User: "tomorrow at 2pm"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)
     📅 Tuesday, Dec 10
     🕐 2:00 PM

     Perfect, that time is available!
     Do you have a stylist preference, or any stylist is fine?"

User: "any is fine"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)
     📅 Tuesday, Dec 10
     🕐 2:00 PM
     👤 Any available stylist

     All set! Just say 'yes' to confirm this booking.
     (Final price will be confirmed at the salon based on your specific needs)"

User: "yes"
Bot: "🎉 *Booking Confirmed!*

     ✂️ Haircut
     📅 Tuesday, Dec 10 at 2:00 PM
     💰 From $28 (final price at salon)

     You'll get a reminder tomorrow morning.
     See you soon! 💇"
```

**Key Differences from Individual Services:**

- User selects category (e.g., "Haircut") not specific service ("Men's Haircut")
- Show price range ("from $28") not exact price
- Final price determined at salon based on specifics (gender, length, etc.)

**Category Matching (intentParser.ts):**

```typescript
// Map user phrases to categories
const CATEGORY_KEYWORDS = {
  haircut: ['haircut', 'cut', 'trim'],
  'hair-colouring': ['color', 'colour', 'dye', 'highlight', 'balayage'],
  'keratin-treatment': ['keratin', 'treatment', 'smoothing', 'rebonding'],
  perm: ['perm', 'curl', 'wave'],
  'scalp-therapy': ['scalp', 'dandruff', 'hair loss'],
};
```

#### Handling Edge Cases

**Category Not Found:**

```
User: "I want a facial"
Bot: "Hmm, we don't offer facials - we're a hair salon!
     We specialize in Haircuts, Hair Colouring, Keratin Treatments, and Perms.
     Which of these interests you?"
```

**Time Not Available:**

```
User: "book haircut tomorrow at 10am"
Bot: "Sorry, 10:00 AM is already booked!
     But I have openings at 9:30 AM, 11:00 AM, or 2:00 PM tomorrow.
     Which works best for you?"
```

**Ambiguous Category (Multiple Matches):**

```
User: "I want treatment"
Bot: "We have a few treatment options:
     • Keratin & Smoothing (from $150) - for frizz control & straightening
     • Scalp Therapy (from $80) - for scalp health
     Which one are you interested in?"
```

**Missing Info (Collect Naturally):**

```
User: "book a haircut"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)

     When would you like to come in?"

User: "tomorrow"
Bot: "Tomorrow works! What time? We have openings at 9am, 11am, 2pm, and 4pm."
```

**User Asks About Specific Service:**

```
User: "How much is a men's haircut?"
Bot: "All our haircuts start from $28. The exact price depends on factors
     like hair length and styling. Would you like to book a haircut?"
```

### Phase 3: Reduce Button Usage

**Keep buttons only for:**

1. `/start` main menu (entry point)
2. Appointment reminders (minimal, time-sensitive)

**Reminder Format (Text + Minimal Buttons):**

```
⏰ *Appointment Reminder*

Your appointment is tomorrow!

✂️ Men's Haircut
📅 Tuesday, Dec 10
🕐 2:00 PM
👤 with Sarah

Reply OK to confirm, or let me know if you need to reschedule.

[✅ Confirm] [🔄 Reschedule] [❌ Cancel]
```

**Remove buttons from:**

1. Service selection → Ask in text
2. Date selection → Parse from text
3. Time selection → Parse from text
4. Stylist selection → Ask "Any preference for a specific stylist?"
5. Booking confirmation → "Say 'yes' to confirm"
6. Service listing → Just list them as text

### Phase 4: Improve Gemini Prompts for Conversational Tone

**Update system instruction in `geminiService.ts`:**

```
You are a friendly assistant at Signature Trims hair salon.
Chat naturally like a helpful receptionist would.

IMPORTANT GUIDELINES:
- Be warm and conversational, not robotic
- Ask one question at a time
- Don't overwhelm with options
- When confirming, ask "Does this look right?" not "Click to confirm"
- Use casual language: "Got it!", "Perfect!", "Sure thing!"
- Keep messages short and scannable
- Use emojis sparingly for warmth

BAD: "Please select your preferred service from the following options:"
GOOD: "What service are you looking for today?"

BAD: "Would you like to proceed with the booking? [Yes] [No]"
GOOD: "Should I book this for you? Just say 'yes' to confirm!"
```

### Phase 5: Progressive Confirmation Helper

**Update `src/services/conversationHistory.ts`:**

```typescript
// Update BookingContext to use categoryId instead of services[]
interface BookingContext {
  categoryId?: string; // Category ID (e.g., 'haircut')
  categoryName?: string; // Display name (e.g., 'Haircut')
  priceNote?: string; // e.g., 'from $28'
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  stylistId?: string; // Stylist ID or 'any'
  customerName?: string;
  customerEmail?: string;
  // ... other fields
}

/**
 * Generates the "Current Booking" summary to prepend to messages
 */
export function generateBookingSummary(context: BookingContext): string {
  if (!context.categoryName) return '';

  const lines = ['✅ *Your Booking:*'];

  // Category with price
  lines.push(`✂️ ${context.categoryName} ${context.priceNote || ''}`);

  // Date (if confirmed)
  if (context.date) {
    lines.push(`📅 ${formatDisplayDate(context.date)}`);
  }

  // Time (if confirmed)
  if (context.time) {
    lines.push(`🕐 ${formatTime12Hour(context.time)}`);
  }

  // Stylist (if confirmed)
  if (context.stylistId) {
    const stylistName =
      context.stylistId === 'any'
        ? 'Any available stylist'
        : await getStylistName(context.stylistId);
    lines.push(`👤 ${stylistName}`);
  }

  return lines.join('\n') + '\n\n';
}
```

**Usage in responses:**

```typescript
const summary = generateBookingSummary(bookingContext);
const response = summary + 'Great choice! When would you like to come in?';
```

### Phase 6: Gemini Fallback (When AI Fails)

When Gemini times out or errors, use `intentParser.ts`:

```typescript
// Fallback flow
try {
  response = await Promise.race([callGemini(message), timeout(8000)]);
} catch {
  // Parse intent without AI
  const intent = parseIntent(message);
  response = generateConversationalResponse(intent);
}
```

**Fallback response examples:**

```
// Intent detected but needs clarification
"I think you want to book an appointment. What service are you looking for?"

// No intent detected
"Sorry, I didn't quite get that. You can say things like:
• 'Book a haircut for tomorrow'
• 'What are your prices?'
• 'Cancel my appointment'"
```

---

## Critical Files to Modify

| File                                    | Changes                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| NEW: `src/services/intentParser.ts`     | Keyword parsing, date/time parsing, category matching                        |
| `src/services/geminiService.ts`         | Update prompts for conversational tone, add timeout/fallback, use categories |
| `src/services/botCommandService.ts`     | Simplify to minimal buttons (main menu + reminders only)                     |
| `src/app/api/telegram/webhook/route.ts` | Route everything through conversational handler                              |
| `src/app/api/whatsapp/webhook/route.ts` | Same conversational approach                                                 |
| `src/services/conversationHistory.ts`   | Update BookingContext for categories, add generateBookingSummary()           |
| `src/lib/categories.ts`                 | May need to export category matching helpers                                 |

---

## NOTE: Save Plans to .claude/

**Important:** After finalizing implementation plans, save a copy to `.claude/plans/` for future reference.
This helps maintain context for future development sessions.

---

## Execution Checklist

### Phase 1: Intent Parser

- [ ] Create `intentParser.ts`
- [ ] Implement keyword-based intent detection
- [ ] Add natural date parsing (tomorrow, next Friday, Dec 15)
- [ ] Add natural time parsing (3pm, afternoon, morning)
- [ ] Add fuzzy service matching with clarification
- [ ] Handle ambiguous requests conversationally

### Phase 2: Conversational Gemini

- [ ] Update system prompt for conversational tone
- [ ] Add 8-second timeout with fallback
- [ ] Ensure one question at a time
- [ ] Text-based confirmations (not buttons)

### Phase 3: Simplify Button Usage

- [ ] Keep only main menu buttons (`/start`)
- [ ] Remove inline keyboards from booking flow
- [ ] Remove inline keyboards from service listing
- [ ] Keep minimal buttons for reminders

### Phase 4: Multi-Turn Conversation State

- [ ] Track what info has been collected (service, date, time, stylist)
- [ ] Ask for missing info naturally
- [ ] Remember context across messages
- [ ] Generate progressive confirmation summary for each response

### Phase 5: Testing

- [ ] Test booking via pure text
- [ ] Test when Gemini fails
- [ ] Test ambiguous requests
- [ ] Test date/time parsing edge cases
