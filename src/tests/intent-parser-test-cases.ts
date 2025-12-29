/**
 * Intent Parser Test Cases (CLI-friendly output)
 */
import 'dotenv/config';
import { parseMessage } from '../services/intentParser';

interface TestCase {
  message: string;
  expectedIntent: string;
  expectedCategory?: string;
  expectedTime?: string;
  description: string;
}

const tests: TestCase[] = [
  // Booking
  {
    message: 'I want to book a haircut',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    description: 'Book haircut',
  },
  {
    message: 'book appointment for tomorrow',
    expectedIntent: 'book',
    description: 'Book tomorrow',
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

  // Date parsing
  {
    message: 'can I book for 2 jan 2026 at 5pm',
    expectedIntent: 'book',
    expectedTime: '17:00',
    description: 'Date+time parsing',
  },
  { message: 'book for 2 jan', expectedIntent: 'book', description: '2 should NOT be time' },

  // Time parsing
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
    description: 'Time with mins',
  },

  // Categories
  {
    message: 'i need a haircut',
    expectedIntent: 'book',
    expectedCategory: 'haircut',
    description: 'Haircut category',
  },
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
    description: 'CRITICAL: Time+confirm',
  },
  {
    message: '2pm works for me',
    expectedIntent: 'confirmation',
    expectedTime: '14:00',
    description: 'Time+works',
  },

  // Cancel/Reschedule
  { message: 'cancel my appointment', expectedIntent: 'cancel', description: 'Cancel' },
  { message: 'reschedule my appointment', expectedIntent: 'reschedule', description: 'Reschedule' },

  // View
  { message: 'show my appointments', expectedIntent: 'view_appointments', description: 'Show my' },
  {
    message: 'when is my next appointment?',
    expectedIntent: 'view_appointments',
    description: 'When is my',
  },

  // Other
  { message: 'what services do you offer?', expectedIntent: 'services', description: 'Services' },
  { message: 'what are your hours?', expectedIntent: 'hours', description: 'Hours' },
  { message: 'hi', expectedIntent: 'greeting', description: 'Greeting' },
  { message: 'help', expectedIntent: 'help', description: 'Help' },

  // Edge
  { message: "I don't want to book", expectedIntent: 'unknown', description: 'Negation' },
];

async function main() {
  console.log('INTENT PARSER TEST RESULTS');
  console.log('==========================\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const t of tests) {
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
        failures.push(`${t.description}: "${t.message}" - ${reason.trim()}`);
        failed++;
      }
    } catch (e: any) {
      console.log(`ERROR: ${t.description} - ${e.message?.substring(0, 50)}`);
      failed++;
    }
  }

  console.log('\n==========================');
  console.log(`TOTAL: ${tests.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`PASS RATE: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    console.log('\nFAILED TESTS:');
    failures.forEach(f => console.log(`  - ${f}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
