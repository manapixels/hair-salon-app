# Telegram Conversational UX - Implementation Progress

**Last Updated:** December 6, 2025

## Summary

Transforming the Telegram/WhatsApp bot from button-driven wizards to a text-based conversational experience.

---

## ✅ COMPLETED

### 1. Intent Parser Service (NEW)

**File:** `src/services/intentParser.ts`

Created a deterministic fallback parser for when Gemini AI is unavailable:

- Keyword-based intent detection (book, cancel, reschedule, services, hours, help, greeting)
- Natural date parsing ("tomorrow", "next Friday", "December 15", "in 2 weeks")
- Natural time parsing ("2pm", "afternoon", "morning")
- Category matching using keywords (haircut → Haircut, color → Hair Colouring)
- Handles ambiguous requests conversationally
- Generates progressive confirmation summaries

### 2. Gemini Service Updates

**File:** `src/services/geminiService.ts`

- **Added 8-second timeout** with Promise.race
- **Fallback to intent parser** when Gemini fails or times out
- **Updated system prompts** for conversational tone:
  - "Be warm and friendly: Got it!, Perfect!, Sure thing!"
  - "Ask ONE question at a time"
  - "Say 'yes' to confirm" not buttons
  - Progressive confirmation display instructions
- **Category-based booking** instead of individual services
- Added `getAllCategories` import

### 3. Conversation History Updates

**File:** `src/services/conversationHistory.ts`

- **Updated BookingContext** with new fields:
  - `categoryId`, `categoryName`, `priceNote` (category-based)
  - `awaitingInput` (tracks conversation step)
  - `stylistName` (for display)
- **Added `generateBookingSummary()`** function for progressive confirmation
- Helper functions for date/time formatting

### 4. Bot Command Service Updates (Partial)

**File:** `src/services/botCommandService.ts`

- **`handleServicesCommand()`** - Now text-only, lists categories without booking buttons
- **`handleBookCommand()`** - Conversational, guides user to type naturally
- **`handleHelpCommand()`** - Shows natural language examples instead of buttons
- **`handleStartCommand()`** - KEPT buttons (main menu for discovery)
- Added `getAllCategories` import

---

## ✅ COMPLETED (Continued)

### Bot Command Service - Cancel/Reschedule Flows

**File:** `src/services/botCommandService.ts`

Reviewed and confirmed correct implementation:

- [x] Cancel flow - ✅ Correctly retains buttons for appointment selection (time-sensitive actions)
- [x] Reschedule flow - ✅ Correctly retains buttons for appointment selection (time-sensitive actions)
- [x] Booking callback handlers - ✅ Kept for legacy support (users clicking old buttons) + main menu

**Design Decision:** Buttons are kept for:

1. Main menu (`/start`) - entry point navigation for discovery
2. Appointment selection for cancel/reschedule - time-sensitive actions needing one-tap convenience
3. Reminder/confirmation buttons - critical action moments

---

## ✅ COMPLETED (Continued)

### 5. Telegram Webhook Updated

**File:** `src/app/api/telegram/webhook/route.ts`

- Simplified button handling for conversational flow
- Only show buttons for reminders/confirmations (time-sensitive actions)
- Other responses are pure text (conversational)
- Removed message editing for wizard-style flow (now sends new messages)

### 6. WhatsApp Webhook

**File:** `src/app/api/whatsapp/route.ts`

- Already uses `handleMessagingWithUserContext` for natural language
- Inherits all Gemini + fallback improvements automatically
- Commands updated via `botCommandService` changes

---

## ❌ TODO

### 7. Testing

- [ ] Test booking via pure text
- [ ] Test when Gemini fails (fallback works)
- [ ] Test ambiguous requests
- [ ] Test date/time parsing edge cases
- [ ] Test multi-turn conversations

---

## Key Design Decisions

| Decision            | Chosen Approach                                              |
| ------------------- | ------------------------------------------------------------ |
| Fallback Mode       | Conservative - always ask "Did you mean X?"                  |
| Booking Model       | Category-based (Haircuts, Colouring) not individual services |
| Button Usage        | Main menu (`/start`) + reminders only                        |
| Confirmation Style  | "Say 'yes' to confirm" - text-based                          |
| Progressive Display | Show confirmed details at top of each response               |
| Price Display       | Range format ("from $28") - final at salon                   |

---

## Files Created/Modified

| File                                    | Status      | Notes                                              |
| --------------------------------------- | ----------- | -------------------------------------------------- |
| `src/services/intentParser.ts`          | ✅ NEW      | Fallback parser                                    |
| `src/services/geminiService.ts`         | ✅ Modified | Timeout, fallback, prompts                         |
| `src/services/conversationHistory.ts`   | ✅ Modified | Categories, summary                                |
| `src/services/botCommandService.ts`     | ✅ Modified | Commands updated, callbacks retained for reminders |
| `src/app/api/telegram/webhook/route.ts` | ✅ Modified | Conversational flow                                |
| `src/app/api/whatsapp/webhook/route.ts` | ✅ Inherits | Uses same Gemini+fallback via messagingUserService |

---

## Example Conversational Flow

```
User: "I want to book an appointment"
Bot: "I'd love to help! What type of service are you looking for?
     We have Haircuts, Hair Colouring, Keratin & Treatments, Perms, and more."

User: "haircut"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)

     Great choice! When would you like to come in?
     Just say something like 'tomorrow at 2pm' or 'next Saturday'."

User: "tomorrow at 2pm"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)
     📅 Tuesday, Dec 10
     🕐 2:00 PM

     Perfect! Do you have a stylist preference, or any stylist is fine?"

User: "any is fine"
Bot: "✅ *Your Booking:*
     ✂️ Haircut (from $28)
     📅 Tuesday, Dec 10
     🕐 2:00 PM
     👤 Any available stylist

     All set! Just say 'yes' to confirm this booking."

User: "yes"
Bot: "🎉 *Booking Confirmed!*
     ✂️ Haircut
     📅 Tuesday, Dec 10 at 2:00 PM
     💰 From $28 (final price at salon)

     You'll get a reminder tomorrow morning. See you soon! 💇"
```
