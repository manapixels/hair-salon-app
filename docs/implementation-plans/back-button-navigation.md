# Back Button Navigation Implementation Plan

## 🎯 Goal

Add "⬅️ Back" button to every step in the booking flow, allowing users to return to the previous step without losing progress.

---

## 📊 Current State Analysis

### **Booking Flow Steps**

1. **Service Selection** → Click service button
2. **Multi-Service Option** → Add more or continue
3. **Stylist Selection** → Choose stylist or "Any"
4. **Date Selection** → Pick from calendar (with week navigation)
5. **Time Selection** → Pick time slot (grouped by time of day)
6. **Confirmation Review** → Review & confirm

### **Existing Context**

```typescript
interface BookingContext {
  customerName?: string;
  customerEmail?: string;
  services?: string[]; // ✅ Already tracked
  stylistId?: string; // ✅ Already tracked
  date?: string; // ✅ Already tracked
  time?: string; // ✅ Already tracked
  currentStepMessageId?: number; // ✅ For message editing
  currentWeekOffset?: number; // ✅ For date picker
  stepHistory?: string[]; // ⚠️ Declared but not used
}
```

---

## 🏗️ Architecture Design

### **Step State Machine**

```typescript
// Define all possible steps
enum BookingStep {
  SERVICE_SELECTION = 'service_selection',
  MULTI_SERVICE_OPTION = 'multi_service_option',
  STYLIST_SELECTION = 'stylist_selection',
  DATE_SELECTION = 'date_selection',
  TIME_SELECTION = 'time_selection',
  CONFIRMATION = 'confirmation',
}

// Enhanced BookingContext
interface BookingContext {
  // Existing fields...

  // Navigation state
  currentStep?: BookingStep;
  stepHistory?: {
    step: BookingStep;
    state: Partial<BookingContext>; // Snapshot of context at this step
    timestamp: number;
  }[];

  // Temporary state (for reverting)
  previousServices?: string[];
  previousStylistId?: string;
  previousDate?: string;
  previousTime?: string;
}
```

### **Navigation Flow**

```
Service Selection
    ↓ [select service]
    ├─ Save: { currentStep: MULTI_SERVICE_OPTION, stepHistory: [SERVICE_SELECTION] }
    ↓
Multi-Service Option
    ↓ [add/continue]
    ├─ Save: { currentStep: STYLIST_SELECTION, stepHistory: [..., MULTI_SERVICE_OPTION] }
    ├─ [⬅️ Back] → Restore SERVICE_SELECTION state
    ↓
Stylist Selection
    ↓ [select stylist]
    ├─ Save: { currentStep: DATE_SELECTION, stepHistory: [..., STYLIST_SELECTION] }
    ├─ [⬅️ Back] → Restore MULTI_SERVICE_OPTION state
    ↓
Date Selection
    ↓ [select date]
    ├─ Save: { currentStep: TIME_SELECTION, stepHistory: [..., DATE_SELECTION] }
    ├─ [⬅️ Back] → Restore STYLIST_SELECTION state
    ↓
Time Selection
    ↓ [select time]
    ├─ Save: { currentStep: CONFIRMATION, stepHistory: [..., TIME_SELECTION] }
    ├─ [⬅️ Back] → Restore DATE_SELECTION state
    ↓
Confirmation
    ├─ [⬅️ Back] → Restore TIME_SELECTION state
    ↓ [confirm]
    ├─ Clear stepHistory
    ↓
Booking Complete
```

---

## 🛠️ Implementation Steps

### **Phase 1: Core Infrastructure** (30 min)

#### 1.1 Update BookingContext Type

```typescript
// In conversationHistory.ts
interface BookingContext {
  // ... existing fields

  currentStep?: string; // Current step identifier
  stepHistory?: Array<{
    step: string;
    context: Partial<BookingContext>;
    timestamp: number;
  }>;
}
```

#### 1.2 Create Step Management Functions

```typescript
// In conversationHistory.ts

export function pushStep(userId: string, step: string, context: Partial<BookingContext>): void {
  const current = getBookingContext(userId) || {};
  const history = current.stepHistory || [];

  history.push({
    step,
    context: { ...context },
    timestamp: Date.now(),
  });

  setBookingContext(userId, {
    ...current,
    currentStep: step,
    stepHistory: history,
  });
}

export function popStep(userId: string): Partial<BookingContext> | null {
  const current = getBookingContext(userId);
  if (!current?.stepHistory || current.stepHistory.length === 0) {
    return null;
  }

  const history = [...current.stepHistory];
  const previousStep = history.pop();

  if (!previousStep) return null;

  setBookingContext(userId, {
    ...previousStep.context,
    stepHistory: history,
    currentStep: previousStep.step,
  });

  return previousStep.context;
}

export function clearStepHistory(userId: string): void {
  const current = getBookingContext(userId);
  if (current) {
    setBookingContext(userId, {
      ...current,
      stepHistory: [],
      currentStep: undefined,
    });
  }
}
```

---

### **Phase 2: Update Each Step Handler** (60 min)

#### 2.1 Service Selection → Multi-Service Option

```typescript
// When user selects a service
if (callbackData.startsWith('book_service_')) {
  // ... existing service selection code

  // BEFORE returning response, save step:
  pushStep(userId, 'multi_service_option', {
    services: [service.name],
    currentStepMessageId: existingContext?.currentStepMessageId,
  });

  return {
    text: `✅ *${service.name}* selected...`,
    keyboard: {
      inline_keyboard: [
        [{ text: '➕ Add Another Service', callback_data: 'add_another_service' }],
        [{ text: '✅ Continue to Stylist', callback_data: 'proceed_to_stylist' }],
        [{ text: '⬅️ Back to Services', callback_data: 'go_back' }], // NEW
      ],
    },
    editPreviousMessage: true,
  };
}
```

#### 2.2 Multi-Service → Stylist Selection

```typescript
// When user clicks "Continue to Stylist"
if (callbackData === 'proceed_to_stylist') {
  // ... existing stylist selection code

  // BEFORE returning response, save step:
  const context = getBookingContext(userId);
  pushStep(userId, 'stylist_selection', {
    ...context,
    services: context?.services,
  });

  return {
    text: `✅ *Your Services:*...`,
    keyboard: {
      inline_keyboard: [
        ...stylistButtons,
        [{ text: '⬅️ Back to Services', callback_data: 'go_back' }], // NEW
      ],
    },
    editPreviousMessage: true,
  };
}
```

#### 2.3 Stylist → Date Selection

```typescript
// When user selects stylist
if (callbackData.startsWith('select_stylist_')) {
  // ... existing date selection code

  // BEFORE returning response, save step:
  const context = getBookingContext(userId);
  pushStep(userId, 'date_selection', {
    ...context,
    stylistId: stylistSelection === 'any' ? undefined : stylistSelection,
  });

  return {
    text: `✅ *Service* with ${stylistName}...`,
    keyboard: {
      inline_keyboard: [
        ...dateButtons,
        [{ text: '⬅️ Back to Stylist', callback_data: 'go_back' }], // NEW
      ],
    },
    editPreviousMessage: true,
  };
}
```

#### 2.4 Date → Time Selection

```typescript
// When user picks date
if (callbackData.startsWith('pick_date_')) {
  // ... existing time selection code

  // BEFORE returning response, save step:
  const context = getBookingContext(userId);
  pushStep(userId, 'time_selection', {
    ...context,
    date: dateStr,
  });

  return {
    text: `📅 ${formatDisplayDate(selectedDate)}...`,
    keyboard: {
      inline_keyboard: [
        ...timeButtons,
        [{ text: '⬅️ Back to Dates', callback_data: 'go_back' }], // CHANGE existing
      ],
    },
    editPreviousMessage: true,
  };
}
```

#### 2.5 Time → Confirmation

```typescript
// When user picks time
if (callbackData.startsWith('pick_time_')) {
  // ... existing confirmation code

  // BEFORE returning response, save step:
  const context = getBookingContext(userId);
  pushStep(userId, 'confirmation', {
    ...context,
    time: timeStr,
  });

  return {
    text: `📋 *Review Your Booking*...`,
    keyboard: {
      inline_keyboard: [
        [{ text: '✅ Confirm Booking', callback_data: 'confirm_booking_final' }],
        [
          { text: '⬅️ Back to Times', callback_data: 'go_back' }, // NEW
          { text: '❌ Cancel', callback_data: 'cancel_booking' },
        ],
      ],
    },
    editPreviousMessage: true,
  };
}
```

---

### **Phase 3: Implement go_back Handler** (45 min)

```typescript
// In handleCallbackQuery()
if (callbackData === 'go_back') {
  const context = getBookingContext(userId);

  if (!context?.stepHistory || context.stepHistory.length === 0) {
    // No history, return to start
    return {
      text: `❌ *Can't Go Back*
      
No previous step found. Let's start fresh!`,
      keyboard: {
        inline_keyboard: [
          [{ text: '📅 Start New Booking', callback_data: 'cmd_book' }],
          [{ text: '🏠 Main Menu', callback_data: 'cmd_start' }],
        ],
      },
      parseMode: 'Markdown',
      editPreviousMessage: true,
    };
  }

  // Pop the last step
  const previousState = popStep(userId);

  if (!previousState) {
    return createErrorResponse('context_lost');
  }

  const currentStep = previousState.currentStep;

  // Rebuild the UI for the previous step
  switch (currentStep) {
    case 'multi_service_option':
      return await rebuildMultiServiceStep(userId, previousState);

    case 'stylist_selection':
      return await rebuildStylistStep(userId, previousState);

    case 'date_selection':
      return await rebuildDateStep(userId, previousState);

    case 'time_selection':
      return await rebuildTimeStep(userId, previousState);

    default:
      // Fallback to service selection
      return await handleBookCommand();
  }
}
```

---

### **Phase 4: Step Rebuilders** (60 min)

```typescript
// Helper functions to rebuild each step's UI

async function rebuildMultiServiceStep(
  userId: string,
  state: Partial<BookingContext>,
): Promise<CommandResponse> {
  const services = await getServices();
  const selectedServices = state.services || [];

  const totalPrice = services
    .filter(s => selectedServices.includes(s.name))
    .reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services
    .filter(s => selectedServices.includes(s.name))
    .reduce((sum, s) => sum + s.duration, 0);

  return {
    text: `✅ *Your Services:*
${selectedServices.map(s => `• ${s}`).join('\n')}

💰 Total: $${totalPrice}
⏱️ Total Duration: ${totalDuration} minutes

Would you like to add more?`,
    keyboard: {
      inline_keyboard: [
        [{ text: '➕ Add Another Service', callback_data: 'add_another_service' }],
        [{ text: '✅ Continue to Stylist', callback_data: 'proceed_to_stylist' }],
        [{ text: '⬅️ Back to Service List', callback_data: 'go_back' }],
      ],
    },
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}

async function rebuildStylistStep(
  userId: string,
  state: Partial<BookingContext>,
): Promise<CommandResponse> {
  const stylists = await getStylists();
  const activeStylists = stylists.filter(s => s.isActive);

  const services = await getServices();
  const selectedServices = services.filter(s => state.services?.includes(s.name));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  return {
    text: `✅ *Your Services:*
${state.services?.map(s => `• ${s}`).join('\n')}

💰 Total: $${totalPrice}
⏱️ Duration: ${totalDuration} minutes

👇 *Choose your stylist:*`,
    keyboard: {
      inline_keyboard: [
        ...activeStylists.map(stylist => [
          {
            text: `👤 ${stylist.name}`,
            callback_data: `select_stylist_${stylist.id}`,
          },
        ]),
        [{ text: '🎲 Any Stylist', callback_data: 'select_stylist_any' }],
        [{ text: '⬅️ Back to Services', callback_data: 'go_back' }],
      ],
    },
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}

async function rebuildDateStep(
  userId: string,
  state: Partial<BookingContext>,
): Promise<CommandResponse> {
  // Restore week offset if it was set
  const weekOffset = state.currentWeekOffset || 0;

  // Generate date buttons (same as in select_stylist handler)
  const dateButtons: InlineKeyboardButton[][] = [];
  const today = new Date();
  const startDayOffset = weekOffset * 7;

  // ... date button generation code (copy from existing handler)

  const serviceName = state.services?.[0] || 'selected service';
  const stylistName = state.stylistId
    ? (await getStylists()).find(s => s.id === state.stylistId)?.name || 'any available stylist'
    : 'any available stylist';

  return {
    text: `✅ *${serviceName}* with ${stylistName}

📅 *Choose a date:*

_Tip: Use arrows to browse weeks ahead_`,
    keyboard: { inline_keyboard: dateButtons },
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}

async function rebuildTimeStep(
  userId: string,
  state: Partial<BookingContext>,
): Promise<CommandResponse> {
  if (!state.date) {
    return createErrorResponse('context_lost');
  }

  const selectedDate = new Date(state.date);
  const availableSlots = await getAvailability(selectedDate);

  // Group time slots (same as in pick_date handler)
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];

  availableSlots.forEach(slot => {
    const hour = parseInt(slot.split(':')[0]);
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  });

  // ... time button generation code

  const serviceName = state.services?.[0] || 'selected service';
  const stylistName = state.stylistId
    ? (await getStylists()).find(s => s.id === state.stylistId)?.name || 'any available stylist'
    : 'any available stylist';

  return {
    text: `✅ *${serviceName}* with ${stylistName}

📅 ${formatDisplayDate(selectedDate)}

⏰ *Choose a time:*`,
    keyboard: { inline_keyboard: timeButtons },
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}
```

---

### **Phase 5: Clean Up on Completion** (10 min)

```typescript
// When booking is confirmed
if (callbackData === 'confirm_booking_final') {
  // ... existing booking logic

  // After successful booking:
  clearStepHistory(userId);

  return {
    text: `✅ *Booking Confirmed!*...`,
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}

// When booking is cancelled
if (callbackData === 'cancel_booking') {
  clearStepHistory(userId);
  clearBookingContext(userId);

  return {
    text: `❌ Booking cancelled...`,
    parseMode: 'Markdown',
    editPreviousMessage: true,
  };
}
```

---

## 🧪 Testing Checklist

### **Forward Flow (No Back Button)**

- [ ] Service selection → Multi-service → Stylist → Date → Time → Confirm
- [ ] Multi-service flow (add 2+ services)
- [ ] Week navigation (next/prev week)
- [ ] Custom date entry
- [ ] Time slot selection

### **Backward Navigation**

- [ ] From Multi-Service → Back to Service List
- [ ] From Stylist → Back to Multi-Service
- [ ] From Date → Back to Stylist
- [ ] From Time → Back to Date
- [ ] From Confirmation → Back to Time

### **Edge Cases**

- [ ] Back button when stepHistory is empty
- [ ] Back button after context timeout (30 min)
- [ ] Back button with multiple services selected
- [ ] Back button after week navigation
- [ ] State restoration preserves all fields
- [ ] Message editing works correctly
- [ ] No duplicate buttons in UI

### **Data Integrity**

- [ ] Services array preserved
- [ ] Stylist ID preserved
- [ ] Date preserved
- [ ] Time preserved
- [ ] Week offset preserved
- [ ] Message ID preserved

---

## ⚠️ Potential Challenges

### **Challenge 1: State Size**

**Problem:** Storing full context snapshots in history could use significant memory.

**Solution:** Only store essential fields per step:

```typescript
// Instead of full context, store minimal state
stepHistory: [
  {
    step: 'stylist_selection',
    context: {
      services: ['Haircut'],
      currentWeekOffset: 0,
      currentStepMessageId: 12345,
    },
    // Don't store: customerName, customerEmail, etc.
  },
];
```

### **Challenge 2: Week Offset Restoration**

**Problem:** If user navigates weeks, then goes back, week offset must be preserved.

**Solution:** Include `currentWeekOffset` in state snapshots:

```typescript
pushStep(userId, 'date_selection', {
  ...context,
  currentWeekOffset: weekOffset, // ✅ Store this
});
```

### **Challenge 3: Multi-Service State**

**Problem:** User adds 3 services, goes back, adds 4th - history gets complex.

**Solution:** When going back to multi-service, show current selected services:

```typescript
// In rebuildMultiServiceStep()
const selectedServices = state.services || [];
// Show these in the UI, allow adding more
```

### **Challenge 4: Message Editing**

**Problem:** `currentStepMessageId` must persist through back navigation.

**Solution:** Always include in step snapshots:

```typescript
pushStep(userId, 'time_selection', {
  ...context,
  currentStepMessageId: context?.currentStepMessageId, // ✅ Preserve
});
```

---

## 📈 Success Metrics

After implementation, measure:

1. **Back Button Usage Rate**
   - % of bookings that use back button
   - Target: 15-25%

2. **Booking Completion Rate**
   - % of started bookings that complete
   - Expected increase: +5-10%

3. **Error Rate**
   - "Lost context" errors
   - Expected decrease: -50%

4. **Time to Complete Booking**
   - With vs without back button
   - May increase slightly due to exploration

5. **User Satisfaction**
   - Survey: "Was back button helpful?"
   - Target: >80% yes

---

## 🚀 Rollout Plan

### **Phase 1: Development** (3-4 hours)

- Implement core infrastructure
- Update step handlers
- Create rebuilders

### **Phase 2: Testing** (2 hours)

- Manual testing of all flows
- Edge case testing
- TypeScript validation

### **Phase 3: Deployment** (30 min)

- Deploy to production
- Monitor error logs
- Watch usage metrics

### **Phase 4: Iteration** (ongoing)

- Gather user feedback
- Fix bugs if found
- Optimize state management

---

## 📝 Notes

- **Backward Compatibility:** Old sessions without stepHistory will still work (fallback to no back button)
- **Memory Usage:** Each step snapshot ~1-2 KB, max 6 steps = 12 KB per user (acceptable)
- **Performance:** `popStep()` is O(n) but n ≤ 6, so negligible
- **User Experience:** Back button reduces frustration, increases booking completion

---

## ✅ Final Checklist

Before marking as complete:

- [ ] All 6 step handlers updated
- [ ] `go_back` handler implemented
- [ ] 4 rebuilder functions created
- [ ] Step history management functions added
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Manual testing complete
- [ ] Edge cases tested
- [ ] Production deployment
- [ ] Monitoring dashboard setup
- [ ] User feedback collected

---

**Estimated Total Implementation Time:** 5-6 hours
**Risk Level:** Medium (requires careful state management)
**Priority:** High (major UX improvement)
