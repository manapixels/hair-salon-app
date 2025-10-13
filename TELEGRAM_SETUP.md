# Telegram Bot Setup Guide

Your Telegram bot needs to be configured to receive messages from users. Here's how to set it up:

## Prerequisites

1. You have a Telegram bot (created via @BotFather)
2. You have the `TELEGRAM_BOT_TOKEN` from @BotFather
3. Your app is deployed to Vercel (https://hair-salon-appt.vercel.app)

## Step 1: Set Environment Variable on Vercel

1. Go to your Vercel project: https://vercel.com/manapixels/hair-salon-app
2. Go to **Settings** → **Environment Variables**
3. Add: `TELEGRAM_BOT_TOKEN` = `your_bot_token_here`
4. Click **Save**
5. Redeploy your app

## Step 2: Configure Webhook

Run this command locally (make sure you have the environment variable set):

```bash
# Export your bot token
export TELEGRAM_BOT_TOKEN=your_bot_token_here

# Set the webhook
node scripts/setup-telegram-webhook.js set
```

**Alternative: Set webhook manually via browser**

Open this URL in your browser (replace `YOUR_BOT_TOKEN`):

```
https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://hair-salon-appt.vercel.app/api/telegram/webhook
```

You should see: `{"ok":true,"result":true,"description":"Webhook was set"}`

## Step 3: Test Your Bot

1. Open Telegram
2. Search for your bot (e.g., @YourBotName)
3. Click **Start** or send `/start`
4. You should receive a welcome message with interactive buttons! 🎉

## Troubleshooting

### Check webhook status:

```bash
node scripts/setup-telegram-webhook.js check
```

### Bot not responding?

1. **Check Vercel logs**: Go to your Vercel deployment → View Function Logs
2. **Verify environment variable**: Make sure `TELEGRAM_BOT_TOKEN` is set in Vercel
3. **Check webhook**: Run `node scripts/setup-telegram-webhook.js check`
4. **Test webhook manually**:
   ```bash
   curl -X POST https://hair-salon-appt.vercel.app/api/telegram/webhook \
     -H "Content-Type: application/json" \
     -d '{"message":{"chat":{"id":123},"text":"/start","from":{"id":123,"first_name":"Test"}}}'
   ```

### Delete webhook (if needed):

```bash
node scripts/setup-telegram-webhook.js delete
```

## Bot Commands

Once set up, users can use:

- `/start` - Welcome menu with buttons
- `/book` - Book appointment
- `/appointments` - View bookings
- `/services` - Browse services
- `/cancel` - Cancel booking
- `/reschedule` - Reschedule booking
- `/hours` - Business hours
- `/help` - Command help

Users can also just talk naturally - the AI will understand! 💬

## Quick Check

**Is your webhook working?**

Send this in your browser (replace YOUR_BOT_TOKEN):

```
https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

You should see:

- `"url": "https://hair-salon-appt.vercel.app/api/telegram/webhook"`
- `"pending_update_count": 0` (or low number)
- `"last_error_message": null` or empty

If you see errors, check your Vercel environment variables and redeploy!
