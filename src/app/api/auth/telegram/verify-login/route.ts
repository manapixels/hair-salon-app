import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/database';
import { getDb } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendTelegramMessage } from '@/services/messagingService';

// Import translations from centralized i18n files
// Import translations from centralized i18n files
import enMessages from '@/i18n/en/common.json';
import zhMessages from '@/i18n/zh/common.json';

type SupportedLocale = 'en' | 'zh';

const translations: Record<SupportedLocale, { title: string; heading: string; message: string }> = {
  en: enMessages.LoginComplete,
  zh: zhMessages.LoginComplete,
};

function getTranslation(locale: string | null) {
  if (locale && locale in translations) {
    return translations[locale as SupportedLocale];
  }
  return translations.en; // Default to English
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionToken = searchParams.get('token');
  const locale = searchParams.get('locale');

  console.log('[VERIFY-LOGIN] Starting verification process');
  console.log('[VERIFY-LOGIN] Locale:', locale);

  // Check if this is Telegram's link preview bot
  const userAgent = request.headers.get('user-agent') || '';
  const isTelegramBot = userAgent.includes('TelegramBot');

  console.log('[VERIFY-LOGIN] User-Agent:', userAgent);
  console.log('[VERIFY-LOGIN] Is Telegram Bot:', isTelegramBot);

  if (isTelegramBot) {
    console.log('[VERIFY-LOGIN] Telegram preview bot detected - returning simple success page');
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Complete Your Login</title>
  <meta property="og:title" content="Complete Your Login to Signature Trims" />
  <meta property="og:description" content="Click to complete your Telegram login" />
</head>
<body>
  <h1>Click to complete your login</h1>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      },
    );
  }

  if (!sessionToken) {
    console.error('[VERIFY-LOGIN] FAILED: Token parameter missing from URL');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token`);
  }

  console.log('[VERIFY-LOGIN] Token received (redacted):', sessionToken.substring(0, 10) + '...');
  console.log('[VERIFY-LOGIN] Token full length:', sessionToken.length);

  try {
    const db = await getDb();
    console.log('[VERIFY-LOGIN] Querying database for token...');

    // Query all tokens to see what's in the database
    const allTokens = await db
      .select({
        id: schema.loginTokens.id,
        token: schema.loginTokens.token,
        userId: schema.loginTokens.userId,
        expiresAt: schema.loginTokens.expiresAt,
        createdAt: schema.loginTokens.createdAt,
      })
      .from(schema.loginTokens);

    console.log('[VERIFY-LOGIN] Total tokens in database:', allTokens.length);
    console.log(
      '[VERIFY-LOGIN] Token prefixes:',
      allTokens.map(t => ({
        prefix: t.token.substring(0, 10) + '...',
        userId: t.userId,
        expired: t.expiresAt < new Date(),
      })),
    );

    const tokenResults = await db
      .select()
      .from(schema.loginTokens)
      .where(eq(schema.loginTokens.token, sessionToken))
      .limit(1);
    const tokenData = tokenResults[0];

    if (!tokenData) {
      console.error('[VERIFY-LOGIN] FAILED: Token not found in database');
      console.error('[VERIFY-LOGIN] Searched for token:', sessionToken.substring(0, 10) + '...');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_or_expired_token`);
    }

    console.log('[VERIFY-LOGIN] Token found in database, checking expiry...');
    console.log('[VERIFY-LOGIN] Token expires at:', tokenData.expiresAt);
    console.log('[VERIFY-LOGIN] Current time:', new Date());

    if (tokenData.expiresAt.getTime() < Date.now()) {
      console.error('[VERIFY-LOGIN] FAILED: Token expired');
      await db.delete(schema.loginTokens).where(eq(schema.loginTokens.id, tokenData.id));
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_expired`);
    }

    console.log('[VERIFY-LOGIN] Token not expired, checking userId...');

    if (!tokenData.userId) {
      console.error(
        '[VERIFY-LOGIN] FAILED: Token has no userId attached (webhook may have failed to update)',
      );
      console.error('[VERIFY-LOGIN] Token data:', {
        id: tokenData.id,
        createdAt: tokenData.createdAt,
        expiresAt: tokenData.expiresAt,
      });
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    console.log('[VERIFY-LOGIN] UserId found:', tokenData.userId);
    console.log('[VERIFY-LOGIN] Looking up user in database...');

    const user = await findUserById(tokenData.userId);

    if (!user) {
      console.error('[VERIFY-LOGIN] FAILED: UserId exists on token but user not found in database');
      console.error('[VERIFY-LOGIN] UserId:', tokenData.userId);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }

    console.log('[VERIFY-LOGIN] User found:', {
      id: user.id,
      name: user.name,
      authProvider: user.authProvider,
    });

    // Mark the token as COMPLETED instead of setting cookie here
    // The original browser will poll for this status and claim the session
    console.log('[VERIFY-LOGIN] Marking token as COMPLETED...');
    await db
      .update(schema.loginTokens)
      .set({ status: 'COMPLETED' })
      .where(eq(schema.loginTokens.id, tokenData.id));

    console.log('[VERIFY-LOGIN] SUCCESS: Token marked as COMPLETED, returning success page');

    // Send success message to Telegram chat (non-blocking)
    if (user.telegramId) {
      const successMessage = `✅ *You have successfully logged in!*

Welcome to Signature Trims! 🎉

✨ *What you can do:*
• Book appointments with our professional stylists
• View and manage your bookings
• Get reminders for upcoming appointments
• Chat with me anytime for help

Thank you for choosing Signature Trims! 💇‍♀️`;

      sendTelegramMessage(user.telegramId, successMessage).catch(error => {
        console.error('[VERIFY-LOGIN] Failed to send Telegram success message:', error);
      });
    }

    // Get localized text
    const t = getTranslation(locale);

    // Return a success HTML page for Telegram's browser
    // The original browser is polling and will detect the COMPLETED status
    const successHtml = `<!DOCTYPE html>
<html lang="${locale || 'en'}">
<head>
  <title>${t.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f5f0e6 0%, #e8dfc9 50%, #d4c5a9 100%);
      color: #1a1a1a;
      text-align: center;
      padding: 20px;
    }
    .container {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      padding: 48px 40px;
      border-radius: 20px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(122, 100, 0, 0.15), 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid rgba(122, 100, 0, 0.1);
    }
    .checkmark {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #7A6400 0%, #9a8000 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 16px rgba(122, 100, 0, 0.25);
    }
    .checkmark svg {
      width: 40px;
      height: 40px;
      stroke: white;
      stroke-width: 3;
      fill: none;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: #1a1a1a;
    }
    p {
      font-size: 15px;
      color: #666;
      margin: 0;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">
      <svg viewBox="0 0 24 24">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <h1>${t.heading}</h1>
    <p>${t.message}</p>
  </div>
</body>
</html>`;

    return new NextResponse(successHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('[VERIFY-LOGIN] EXCEPTION during verification:', error);
    console.error('[VERIFY-LOGIN] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=login_failed`);
  }
}
