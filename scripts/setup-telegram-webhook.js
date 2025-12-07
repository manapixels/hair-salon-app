#!/usr/bin/env node

/**
 * Setup Telegram Webhook
 *
 * This script helps you configure your Telegram bot's webhook
 * to receive messages from users.
 *
 * Usage:
 *   node scripts/setup-telegram-webhook.js set
 *   node scripts/setup-telegram-webhook.js check
 *   node scripts/setup-telegram-webhook.js delete
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/telegram/webhook`
  : 'https://hair-salon-app.chrenelias.workers.dev/api/telegram/webhook';

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is not set!');
  console.error('\nSet it with:');
  console.error('  export TELEGRAM_BOT_TOKEN=your_bot_token_here');
  process.exit(1);
}

const command = process.argv[2] || 'check';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}${path}`;
    https
      .get(url, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function checkWebhook() {
  console.log('🔍 Checking webhook status...\n');
  const result = await makeRequest('/getWebhookInfo');

  if (result.ok) {
    const info = result.result;
    console.log('📊 Webhook Info:');
    console.log(`   URL: ${info.url || '(not set)'}`);
    console.log(`   Pending Updates: ${info.pending_update_count}`);
    console.log(`   Last Error: ${info.last_error_message || 'None'}`);
    console.log(
      `   Last Error Date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : 'N/A'}`,
    );

    if (!info.url) {
      console.log('\n⚠️  No webhook is set! Run: node scripts/setup-telegram-webhook.js set');
    } else if (info.url !== WEBHOOK_URL) {
      console.log(`\n⚠️  Webhook URL mismatch!`);
      console.log(`   Expected: ${WEBHOOK_URL}`);
      console.log(`   Current:  ${info.url}`);
    } else {
      console.log('\n✅ Webhook is properly configured!');
    }
  } else {
    console.error('❌ Error:', result.description);
  }
}

async function setWebhook() {
  console.log(`🔧 Setting webhook to: ${WEBHOOK_URL}\n`);
  const result = await makeRequest(`/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}`);

  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log('\n📝 Test your bot:');
    console.log('   1. Open Telegram');
    console.log('   2. Search for your bot');
    console.log('   3. Send /start');
    console.log('   4. You should receive a welcome message with buttons!');
  } else {
    console.error('❌ Error:', result.description);
  }
}

async function deleteWebhook() {
  console.log('🗑️  Deleting webhook...\n');
  const result = await makeRequest('/deleteWebhook');

  if (result.ok) {
    console.log('✅ Webhook deleted successfully!');
  } else {
    console.error('❌ Error:', result.description);
  }
}

async function getBotInfo() {
  console.log('🤖 Getting bot information...\n');
  const result = await makeRequest('/getMe');

  if (result.ok) {
    const bot = result.result;
    console.log('📊 Bot Info:');
    console.log(`   Name: ${bot.first_name}`);
    console.log(`   Username: @${bot.username}`);
    console.log(`   ID: ${bot.id}`);
    console.log(`   Can Join Groups: ${bot.can_join_groups}`);
    console.log(`   Can Read Messages: ${bot.can_read_all_group_messages}`);
  } else {
    console.error('❌ Error:', result.description);
  }
}

async function main() {
  try {
    await getBotInfo();
    console.log('\n' + '='.repeat(50) + '\n');

    switch (command) {
      case 'set':
        await setWebhook();
        break;
      case 'check':
        await checkWebhook();
        break;
      case 'delete':
        await deleteWebhook();
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/setup-telegram-webhook.js set     - Set webhook');
        console.log('  node scripts/setup-telegram-webhook.js check   - Check status');
        console.log('  node scripts/setup-telegram-webhook.js delete  - Delete webhook');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
