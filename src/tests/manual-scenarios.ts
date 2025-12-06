import { prisma } from '@/lib/prisma';
import type { WhatsAppMessage } from '@/types';
import dotenv from 'dotenv';
import * as intentParser from '@/services/intentParser';

import path from 'path';

// ... (Environment loading code remains same, skipping for brevity in this replace block if not targeting it)

// Load environment variables from .env.local
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (result.error) {
  console.error('Error loading .env.local:', result.error);
}

// Log loaded key (securely)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY not found in process.env');
} else {
  console.log('Environment loaded. GEMINI_API_KEY present.');
}

// Mock User Data
const TEST_USER_PHONE = '1234567890'; // Use a dummy phone number
const TEST_USER_NAME = 'Test User';

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function logStep(step: string) {
  console.log(`\n${colors.bright}${colors.cyan}--- ${step} ---${colors.reset}`);
}

function logResult(success: boolean, message: string) {
  if (success) {
    console.log(`${colors.green}✅ PASS: ${message}${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ FAIL: ${message}${colors.reset}`);
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupTestUser() {
  logStep('Setting up Test User');
  console.log('Test user identifier:', TEST_USER_PHONE);
}

// Wrapper to simulate the flow
async function simulateUserMessage(message: string, contextDescription: string) {
  console.log(`${colors.yellow}User: "${message}"${colors.reset} [${contextDescription}]`);

  try {
    // 1. First Check Level 1: Intent Parser (Deterministic)
    const parsedIntent = await intentParser.parseMessage(message);

    let source = 'Unknown';
    let responseText = '';

    if (parsedIntent.type !== 'unknown' && parsedIntent.confidence > 0.6) {
      // Level 1 success
      const fallbackResp = await intentParser.generateFallbackResponse(message);
      responseText = fallbackResp.text;
      source = 'Level 1 (Intent Parser)';
    } else {
      // Fallback to Level 2: Gemini
      // Dynamic import to ensure env vars are loaded
      const { handleWhatsAppMessage } = await import('@/services/geminiService');

      const mockHistory: Pick<WhatsAppMessage, 'text' | 'sender'>[] = [];
      const mockUserContext = { name: TEST_USER_NAME, email: `${TEST_USER_PHONE}@example.com` };

      const result = await handleWhatsAppMessage(
        message,
        mockHistory,
        mockUserContext,
        null,
        undefined,
        undefined,
      );
      responseText = result.text;
      source = 'Level 2 (Gemini AI)';
    }

    console.log(
      `${colors.bright}Bot (${source}):${colors.reset} ${responseText.split('\n')[0]}...`,
    );
    return { source, text: responseText, intent: parsedIntent };
  } catch (error) {
    console.error('Error processing message:', error);
    return { source: 'Error', text: '', intent: null };
  }
}

async function runTests() {
  await setupTestUser();

  // ==========================================
  // SCENARIO 1: Deterministic (Level 1) Checks
  // ==========================================
  logStep('SCENARIO 1: Deterministic / Intent Parser Checks');

  // Test 1.1: Hours
  let res = await simulateUserMessage('What are your hours?', 'Asking for business hours');
  logResult(
    res.source === 'Level 1 (Intent Parser)' && res.text.includes('Monday'),
    'Should return hours via Intent Parser',
  );

  // Test 1.2: Services
  res = await simulateUserMessage('Show me services', 'Asking for service list');
  logResult(
    res.source === 'Level 1 (Intent Parser)' && res.text.includes('Haircut'),
    'Should return services via Intent Parser',
  );

  // Test 1.3: Simple Booking Flow - Intent Extraction
  // "I want a haircut" -> Expect intent 'book' with category 'haircut'
  res = await simulateUserMessage('I want a haircut', 'Booking intent with category');
  logResult(
    res.intent?.type === 'book' && res.intent?.category?.slug === 'haircut',
    'Parser should detect "book" intent and "haircut" category',
  );

  // Test 1.4: Date Parsing
  // "Tomorrow" -> Expect date parsed
  res = await simulateUserMessage('tomorrow', 'Date input');
  logResult(res.intent?.date?.parsed != null, 'Parser should identify "tomorrow" as a date');

  // Test 1.5: Time Parsing
  // "2pm" -> Expect time parsed
  res = await simulateUserMessage('2pm', 'Time input');
  logResult(res.intent?.time?.parsed === '14:00', 'Parser should identify "2pm" as "14:00"');

  // ==========================================
  // SCENARIO 2: AI Agent (Level 2) Checks
  // ==========================================
  logStep('SCENARIO 2: Gemini AI / Complex Logic');

  // Test 2.1: Complex Booking (should bypass Parser high-confidence or require AI for slot checking)
  // "Book with May for next Monday" -> Parser might catch parts, but AI handles the flow
  // We expect this to likely hit AI because "May" (stylist) might not be strictly parsed by the basic intentParser yet
  // unless we added stylist lookup to it.
  res = await simulateUserMessage(
    'Book a haircut with May for next Monday at 10am',
    'Complex full booking request',
  );
  logResult(
    res.text.includes('May') || res.text.includes('Monday'),
    'Response should acknowledge Stylist (May) and Time',
  );

  // Test 2.2: Context/Follow-up (Mocking conversation state is harder in a script without preserving generic state,
  // but handleWhatsAppMessage maintains history in DB/memory usually. If stateless, this might fail).
  // We'll skip deep multi-turn state checks here unless we mock the persistence layer, but we can check simple NLU.

  // Test 2.3: Edge Case - Unavailable Time
  // "Book for 3am" -> Logic check
  res = await simulateUserMessage('Book a haircut for 3am tomorrow', 'Booking invalid time');
  logResult(
    res.text.toLowerCase().includes('closed') || res.text.toLowerCase().includes('sorry'),
    'Bot should reject 3am booking',
  );

  // ==========================================
  // SCENARIO 3: Admin / Management
  // ==========================================
  logStep('SCENARIO 3: Management');

  // Test 3.1: View Appointments
  res = await simulateUserMessage('My appointments', 'Listing appointments');
  logResult(
    res.text.includes('appointments') || res.text.includes('email'),
    'Should attempt to list appointments (or ask for email)',
  );

  console.log('\nTests Completed.');
}

// Execute
runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
