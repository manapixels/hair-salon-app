# OAuth Setup Guide

This guide explains how to set up real WhatsApp and Telegram login functionality for the hair salon app.

## WhatsApp Business API OAuth Setup

### 1. Create a Facebook Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a developer account if you don't have one
3. Create a new App

### 2. Configure WhatsApp Business Platform

1. In your Facebook App, add the "WhatsApp Business Platform" product
2. Go to Configuration and note your:
   - **App ID** (use as `WHATSAPP_CLIENT_ID`)
   - **App Secret** (use as `WHATSAPP_CLIENT_SECRET`)

### 3. Set OAuth Redirect URIs

1. In the WhatsApp Business Platform settings, add your redirect URI:
   - For development: `http://localhost:3000/api/auth/whatsapp/callback`
   - For production: `https://yourdomain.com/api/auth/whatsapp/callback`

### 4. Add Required Permissions

Your app needs these permissions:

- `whatsapp_business_management`
- `whatsapp_business_messaging`

### 5. Environment Variables

Add to your `.env.local`:

```bash
WHATSAPP_CLIENT_ID=your_facebook_app_id
WHATSAPP_CLIENT_SECRET=your_facebook_app_secret
WHATSAPP_REDIRECT_URI=http://localhost:3000/api/auth/whatsapp/callback
```

## Telegram Bot Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Save the **Bot Token** (use as `TELEGRAM_BOT_TOKEN`)

### 2. Configure Bot Domain

1. Send `/setdomain` to @BotFather
2. Select your bot
3. Enter your domain:
   - For development: `localhost:3000`
   - For production: `yourdomain.com`

### 3. Environment Variables

Add to your `.env.local`:

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

## General Configuration

Add these to your `.env.local`:

```bash
# App URL for OAuth redirects
NEXTAUTH_URL=http://localhost:3000  # Change to your production URL in production
```

## Testing the Implementation

### WhatsApp Login Flow

1. User clicks "Continue with WhatsApp"
2. Redirects to Facebook OAuth
3. User authorizes the app
4. Redirects back to `/api/auth/whatsapp/callback`
5. Creates/updates user account
6. Sets session and redirects to main app

### Telegram Login Flow

1. User sees Telegram Login Widget
2. Widget loads from Telegram's servers
3. User clicks and authorizes on telegram.org
4. Redirects to `/api/auth/telegram/callback`
5. Verifies auth data with HMAC-SHA256
6. Creates/updates user account
7. Sets session and redirects to main app

## Security Features

### WhatsApp Security

- CSRF protection with state parameter
- Secure token exchange
- HTTPS enforcement in production

### Telegram Security

- HMAC-SHA256 verification of auth data
- Timestamp validation (24-hour window)
- Bot token verification

## Production Considerations

1. **HTTPS Required**: Both WhatsApp and Telegram require HTTPS in production
2. **Domain Verification**: Make sure your domains are properly configured
3. **Environment Variables**: Use secure environment variable storage
4. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
5. **Logging**: Add proper logging for security monitoring

## Troubleshooting

### WhatsApp Issues

- Check that your redirect URI exactly matches the configured one
- Ensure your app has the correct permissions
- Verify your client ID and secret

### Telegram Issues

- Make sure your bot token is correct
- Check that the domain is properly set with @BotFather
- Verify HMAC signature calculation

### General Issues

- Check browser console for JavaScript errors
- Verify environment variables are loaded
- Check server logs for authentication errors
