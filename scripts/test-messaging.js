#!/usr/bin/env node

/**
 * Manual Messaging Test Script
 * Provides interactive testing for all messaging functions
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🧪 Messaging Functions Test Suite\n');
console.log('This script helps you test WhatsApp and Telegram messaging.\n');

const tests = [
  {
    id: 'env',
    name: 'Check Environment Variables',
    command: 'node scripts/check-messaging-env.js',
  },
  {
    id: 'whatsapp-send',
    name: 'Test WhatsApp Message Sending',
    prompt: 'Enter phone number (with country code, e.g., +1234567890): ',
    command: (phone) =>
      `curl -X POST http://localhost:3000/api/test/whatsapp-send -H "Content-Type: application/json" -d '{"to":"${phone}","text":"Test from Luxe Cuts"}'`,
  },
  {
    id: 'telegram-send',
    name: 'Test Telegram Message Sending',
    prompt: 'Enter Telegram chat ID (number): ',
    command: (chatId) =>
      `curl -X POST http://localhost:3000/api/test/telegram-send -H "Content-Type: application/json" -d '{"chatId":${chatId},"text":"Test from Luxe Cuts"}'`,
  },
  {
    id: 'reminders-check',
    name: 'Check Upcoming Reminders',
    command: 'curl http://localhost:3000/api/reminders/send',
  },
  {
    id: 'reminders-send',
    name: 'Send All Pending Reminders',
    command:
      'curl -X POST http://localhost:3000/api/reminders/send -H "Authorization: Bearer $CRON_SECRET"',
  },
  {
    id: 'webhook-verify',
    name: 'Test WhatsApp Webhook Verification',
    command:
      'curl "http://localhost:3000/api/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=$WHATSAPP_VERIFY_TOKEN"',
  },
  {
    id: 'telegram-bot',
    name: 'Test Telegram Bot Connection',
    command: 'curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe',
  },
];

function showMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('Available Tests:');
  console.log('='.repeat(60));
  tests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
  });
  console.log(`  ${tests.length + 1}. Run All Tests`);
  console.log('  0. Exit');
  console.log('='.repeat(60));
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function runTest(test) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log('-'.repeat(60));

  let command = test.command;

  if (test.prompt) {
    const input = await ask(test.prompt);
    command = typeof command === 'function' ? command(input) : command;
  }

  console.log(`\n💻 Command: ${command}\n`);

  const { execSync } = require('child_process');
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      shell: '/bin/bash',
    });
    console.log('✅ Result:');
    console.log(output);
  } catch (error) {
    console.log('❌ Error:');
    console.log(error.message);
    if (error.stdout) console.log('Output:', error.stdout.toString());
    if (error.stderr) console.log('Error:', error.stderr.toString());
  }

  console.log('-'.repeat(60));
}

async function runAllTests() {
  console.log('\n🚀 Running all tests...\n');
  for (const test of tests) {
    if (!test.prompt) {
      await runTest(test);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log('\n✅ All automatic tests completed!');
  console.log(
    '\nNote: Tests requiring input were skipped. Run them individually.'
  );
}

async function main() {
  while (true) {
    showMenu();
    const choice = await ask('\nSelect test number (0 to exit): ');
    const testIndex = parseInt(choice) - 1;

    if (choice === '0') {
      console.log('\n👋 Goodbye!');
      rl.close();
      process.exit(0);
    } else if (testIndex === tests.length) {
      await runAllTests();
    } else if (testIndex >= 0 && testIndex < tests.length) {
      await runTest(tests[testIndex]);
    } else {
      console.log('\n❌ Invalid choice. Please try again.');
    }
  }
}

main();
