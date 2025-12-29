/**
 * Intent Parser Test Cases - Extended with Multi-Step Flows
 *
 * Tests both stateless parsing AND stateful flows with context
 */
import 'dotenv/config';
import { parseMessage, generateFallbackResponse } from '../services/intentParser';

// =============================================================================
// TYPES
// =============================================================================

interface StatelessTest {
  message: string;
  expectedIntent: string;
  expectedCategory?: string;
  expectedTime?: string;
  description: string;
}

interface FlowStep {
  message: string;
  expectTextContains?: string[];
  expectTextNotContains?: string[];
  expectAwaitingInput?: string;
  description: string;
}

interface FlowTest {
  name: string;
  steps: FlowStep[];
}

// =============================================================================
// STATELESS TESTS (parseMessage only)
// =============================================================================

const statelessTests: StatelessTest[] = [
  // Booking
  {
    message: 'I want to book a haircut',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    description: 'Book haircut',
  },
  {
    message: 'I want a haircut tomorrow at 2pm',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    expectedTime: '14:00',
    description: 'Full booking',
  },
  {
    message: 'Can I get a haircut?',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    description: 'Can I get',
  },
  {
    message: 'can I book for 2 jan 2026 at 5pm',
    expectedIntent: 'book',
    expectedTime: '17:00',
    description: 'Date+time',
  },
  { message: 'book for 2 jan', expectedIntent: 'book', description: '2 NOT time' },
  {
    message: 'book at 2pm',
    expectedIntent: 'book',
    expectedTime: '14:00',
    description: 'Simple PM',
  },
  {
    message: 'haircut at 2:30pm',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    expectedTime: '14:30',
    description: 'Time w/ mins',
  },

  // Category-only (implicit booking)
  {
    message: 'highlights please',
    expectedIntent: 'book',
    expectedCategory: 'hair-colouring',
    description: 'Highlights',
  },
  {
    message: 'keratin treatment',
    expectedIntent: 'book',
    expectedCategory: 'keratin-treatment',
    description: 'Keratin',
  },
  {
    message: 'i want a perm',
    expectedIntent: 'book',
    expectedCategory: 'hair-perm',
    description: 'Perm',
  },

  // Confirmations
  { message: 'yes', expectedIntent: 'confirmation', description: 'Simple yes' },
  { message: 'sounds good', expectedIntent: 'confirmation', description: 'Sounds good' },
  {
    message: '4:30pm sounds good',
    expectedIntent: 'confirmation',
    expectedTime: '16:30',
    description: 'Time+confirm',
  },
  {
    message: '2pm works for me',
    expectedIntent: 'confirmation',
    expectedTime: '14:00',
    description: 'Time+works',
  },

  // Other intents
  { message: 'cancel my appointment', expectedIntent: 'cancel', description: 'Cancel' },
  { message: 'reschedule my appointment', expectedIntent: 'reschedule', description: 'Reschedule' },
  { message: 'show my appointments', expectedIntent: 'view_appointments', description: 'View' },
  {
    message: 'when is my next appointment?',
    expectedIntent: 'view_appointments',
    description: 'When is my',
  },
  { message: 'what services do you offer?', expectedIntent: 'services', description: 'Services' },
  { message: 'what are your hours?', expectedIntent: 'hours', description: 'Hours' },
  { message: 'hi', expectedIntent: 'greeting', description: 'Greeting' },
  { message: 'help', expectedIntent: 'help', description: 'Help' },

  // Edge cases
  { message: "I don't want to book", expectedIntent: 'unknown', description: 'Negation' },
];

// =============================================================================
// MULTI-STEP FLOW TESTS (generateFallbackResponse with context)
// =============================================================================

const flowTests: FlowTest[] = [
  // -----------------------------------------------------------------------------
  // Flow 1: Complete booking from start
  // -----------------------------------------------------------------------------
  {
    name: 'Complete Booking Flow',
    steps: [
      {
        message: 'I want to book a haircut',
        expectTextContains: ['date', 'when'],
        expectAwaitingInput: 'date',
        description: 'Ask for service → prompts for date',
      },
      {
        message: 'tomorrow',
        expectTextContains: ['time', 'what time'],
        expectAwaitingInput: 'time',
        description: 'Provide date → prompts for time',
      },
      {
        message: '2pm',
        expectTextContains: ['confirm', 'ready', 'yes'],
        expectAwaitingInput: 'confirmation',
        description: 'Provide time → shows confirmation',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 2: One-shot booking with all info
  // -----------------------------------------------------------------------------
  {
    name: 'One-Shot Booking',
    steps: [
      {
        message: 'Book a haircut for tomorrow at 2pm',
        expectTextContains: ['confirm', 'ready', 'yes', 'haircut'],
        expectAwaitingInput: 'confirmation',
        description: 'All info at once → straight to confirmation',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 3: Compound confirmation (time + sounds good)
  // -----------------------------------------------------------------------------
  {
    name: 'Compound Confirmation Recovery',
    steps: [
      {
        message: 'I want a hair perm on 3 Jan 2026 at 5pm',
        expectTextContains: ['time', 'availability', 'enough'],
        description: 'Long service + late time → suggests alternatives',
      },
      {
        message: '4:30pm sounds good',
        expectTextContains: ['confirm', 'ready', 'yes', 'perm'],
        expectAwaitingInput: 'confirmation',
        description: 'Time + confirmation → should extract time and confirm',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 4: Error recovery - past date
  // -----------------------------------------------------------------------------
  {
    name: 'Past Date Error Recovery',
    steps: [
      {
        message: 'Book a haircut for yesterday',
        expectTextContains: ['past', 'future', 'different'],
        description: 'Past date → helpful error with suggestion',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 5: Error recovery - outside business hours
  // -----------------------------------------------------------------------------
  {
    name: 'Outside Business Hours',
    steps: [
      {
        message: 'Book a haircut for tomorrow at 11pm',
        expectTextContains: ['close', 'earlier', 'hours'],
        description: 'Late time → suggests earlier times',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 6: Ambiguous category
  // -----------------------------------------------------------------------------
  {
    name: 'Ambiguous Category Clarification',
    steps: [
      {
        message: 'I want a treatment',
        expectTextContains: ['which', 'type', 'treatment'],
        description: 'Ambiguous → asks for clarification',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 7: Cancel flow
  // -----------------------------------------------------------------------------
  {
    name: 'Cancel Appointment Flow',
    steps: [
      {
        message: 'cancel my appointment',
        expectTextContains: ['which', 'appoint', 'cancel'],
        description: 'Cancel without email → asks for identification',
      },
    ],
  },

  // -----------------------------------------------------------------------------
  // Flow 8: No availability handling
  // -----------------------------------------------------------------------------
  {
    name: 'No Availability Handling',
    steps: [
      {
        message: 'Book a haircut',
        description: 'Start booking',
      },
    ],
  },
];

// =============================================================================
// TEST RUNNER
// =============================================================================

async function runStatelessTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n========================================');
  console.log('STATELESS TESTS (parseMessage)');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const t of statelessTests) {
    try {
      const r = await parseMessage(t.message);
      let ok = true;
      let reason = '';

      if (r.type !== t.expectedIntent) {
        ok = false;
        reason = `intent: got ${r.type}`;
      }
      if (t.expectedCategory && r.category?.slug !== t.expectedCategory) {
        ok = false;
        reason += ` category: got ${r.category?.slug || 'none'}`;
      }
      if (t.expectedTime && r.time?.parsed !== t.expectedTime) {
        ok = false;
        reason += ` time: got ${r.time?.parsed || 'none'}`;
      }

      if (ok) {
        console.log(`PASS: ${t.description}`);
        passed++;
      } else {
        console.log(`FAIL: ${t.description} - ${reason.trim()}`);
        failed++;
      }
    } catch (e: any) {
      console.log(`ERROR: ${t.description}`);
      failed++;
    }
  }

  return { passed, failed };
}

async function runFlowTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n========================================');
  console.log('MULTI-STEP FLOW TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  for (const flow of flowTests) {
    console.log(`\n--- ${flow.name} ---`);

    let context: any = {};

    for (const step of flow.steps) {
      try {
        const response = await generateFallbackResponse(step.message, context);

        if (!response) {
          console.log(`  SKIP: ${step.description} - returned null (Gemini fallback)`);
          continue;
        }

        const text = response.text.toLowerCase();
        let stepPassed = true;
        let failReason = '';

        // Check expected text contains
        if (step.expectTextContains) {
          for (const expected of step.expectTextContains) {
            if (!text.includes(expected.toLowerCase())) {
              stepPassed = false;
              failReason += ` missing "${expected}"`;
            }
          }
        }

        // Check text NOT contains
        if (step.expectTextNotContains) {
          for (const notExpected of step.expectTextNotContains) {
            if (text.includes(notExpected.toLowerCase())) {
              stepPassed = false;
              failReason += ` unexpected "${notExpected}"`;
            }
          }
        }

        // Check awaitingInput
        if (
          step.expectAwaitingInput &&
          response.updatedContext?.awaitingInput !== step.expectAwaitingInput
        ) {
          stepPassed = false;
          failReason += ` awaitingInput: got ${response.updatedContext?.awaitingInput || 'none'}`;
        }

        if (stepPassed) {
          console.log(`  PASS: ${step.description}`);
          passed++;
        } else {
          console.log(`  FAIL: ${step.description} -${failReason}`);
          console.log(`        Response: "${response.text.substring(0, 100)}..."`);
          failed++;
        }

        // Update context for next step
        if (response.updatedContext) {
          context = { ...context, ...response.updatedContext };
        }
      } catch (e: any) {
        console.log(`  ERROR: ${step.description} - ${e.message?.substring(0, 50)}`);
        failed++;
      }
    }
  }

  return { passed, failed };
}

async function main() {
  console.log('INTENT PARSER COMPREHENSIVE TEST SUITE');
  console.log('======================================\n');

  const stateless = await runStatelessTests();
  const flows = await runFlowTests();

  const total = stateless.passed + stateless.failed + flows.passed + flows.failed;
  const totalPassed = stateless.passed + flows.passed;
  const totalFailed = stateless.failed + flows.failed;

  console.log('\n========================================');
  console.log('FINAL SUMMARY');
  console.log('========================================');
  console.log(`Stateless: ${stateless.passed}/${stateless.passed + stateless.failed}`);
  console.log(`Flow: ${flows.passed}/${flows.passed + flows.failed}`);
  console.log(`TOTAL: ${totalPassed}/${total} (${((totalPassed / total) * 100).toFixed(1)}%)`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

main();
