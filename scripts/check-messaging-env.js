#!/usr/bin/env node

/**
 * Environment Variables Check Script
 * Validates all required messaging credentials are configured
 */

console.log('🔍 Checking Messaging Environment Variables...\n');

const requiredVars = {
  whatsapp: [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_VERIFY_TOKEN',
  ],
  telegram: ['TELEGRAM_BOT_TOKEN'],
  ai: ['GEMINI_API_KEY'],
  optional: ['CRON_SECRET'],
};

const results = {
  missing: [],
  configured: [],
  optional: [],
};

// Check WhatsApp
console.log('📱 WhatsApp Configuration:');
requiredVars.whatsapp.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${maskValue(value)}`);
    results.configured.push(varName);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    results.missing.push(varName);
  }
});

// Check Telegram
console.log('\n💬 Telegram Configuration:');
requiredVars.telegram.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${maskValue(value)}`);
    results.configured.push(varName);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    results.missing.push(varName);
  }
});

// Check AI
console.log('\n🤖 AI Configuration:');
requiredVars.ai.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${maskValue(value)}`);
    results.configured.push(varName);
  } else {
    console.log(`  ❌ ${varName}: MISSING`);
    results.missing.push(varName);
  }
});

// Check optional
console.log('\n🔐 Optional Configuration:');
requiredVars.optional.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${maskValue(value)}`);
    results.optional.push(varName);
  } else {
    console.log(`  ⚠️  ${varName}: Not set (reminders won't be protected)`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(
  `  ✅ Configured: ${results.configured.length}/${Object.values(requiredVars).flat().filter((v) => !requiredVars.optional.includes(v)).length}`
);
console.log(`  ❌ Missing: ${results.missing.length}`);
console.log(`  ⚠️  Optional: ${results.optional.length}/${requiredVars.optional.length}`);
console.log('='.repeat(50));

if (results.missing.length > 0) {
  console.log('\n❌ FAILED: Missing required environment variables');
  console.log('\nAdd these to your .env.local file:');
  results.missing.forEach((varName) => {
    console.log(`  ${varName}=your_value_here`);
  });
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: All required variables configured!');
  console.log('\nYou can now test messaging functions.');
  console.log('Run: npm run test:messaging');
  process.exit(0);
}

/**
 * Mask sensitive values for display
 */
function maskValue(value) {
  if (!value) return 'NOT SET';
  if (value.length <= 8) return '***';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}
