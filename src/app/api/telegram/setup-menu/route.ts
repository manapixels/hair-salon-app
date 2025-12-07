import { NextRequest, NextResponse } from 'next/server';
import { BOT_MENU_COMMANDS } from '@/lib/telegramBotSetup';

/**
 * POST /api/telegram/setup-menu
 * Sets up the Telegram bot menu commands programmatically
 *
 * This endpoint configures the bot's command menu that appears when users
 * type "/" in the chat. It uses the same command definitions from
 * telegramBotSetup.ts to ensure consistency.
 *
 * Note: The bot menu is automatically configured on app startup.
 * This endpoint is mainly for manual testing or debugging.
 */
export async function POST(req: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'TELEGRAM_BOT_TOKEN not configured in environment variables',
        },
        { status: 500 },
      );
    }

    // Use shared command definitions from telegramBotSetup.ts
    const commands = BOT_MENU_COMMANDS;

    // Legacy hardcoded commands (kept for reference)
    const _legacyCommands = [
      {
        command: 'book',
        description: '=� Book a new appointment',
      },
      {
        command: 'appointments',
        description: '=� View my appointments',
      },
      {
        command: 'services',
        description: ' Browse services & prices',
      },
      {
        command: 'hours',
        description: '=P Business hours & location',
      },
      {
        command: 'help',
        description: 'S Get help & all commands',
      },
    ];

    // Call Telegram Bot API to set commands
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`;

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commands,
        // Optional: Set scope to apply to all users
        scope: {
          type: 'default',
        },
      }),
    });

    const data = (await response.json()) as { ok: boolean; description?: string; result?: any };

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to set bot commands',
          details: data.description || 'Unknown error',
          telegram_response: data,
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bot menu commands set successfully!',
      commands_configured: commands.length,
      commands: commands.map(cmd => `/${cmd.command} - ${cmd.description}`),
      telegram_response: data,
    });
  } catch (error) {
    console.error('Error setting bot menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/telegram/setup-menu
 * Retrieves the current bot menu commands
 */
export async function GET(req: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'TELEGRAM_BOT_TOKEN not configured in environment variables',
        },
        { status: 500 },
      );
    }

    // Call Telegram Bot API to get current commands
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMyCommands`;

    const response = await fetch(telegramApiUrl);
    const data = (await response.json()) as {
      ok: boolean;
      result?: Array<{ command: string; description: string }>;
      description?: string;
    };

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get bot commands',
          details: data.description || 'Unknown error',
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      commands_count: data.result?.length || 0,
      commands: data.result || [],
      formatted_commands:
        data.result?.map(
          (cmd: { command: string; description: string }) => `/${cmd.command} - ${cmd.description}`,
        ) || [],
    });
  } catch (error) {
    console.error('Error getting bot menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/telegram/setup-menu
 * Removes all bot menu commands
 */
export async function DELETE(req: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'TELEGRAM_BOT_TOKEN not configured in environment variables',
        },
        { status: 500 },
      );
    }

    // Call Telegram Bot API to delete commands
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMyCommands`;

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scope: {
          type: 'default',
        },
      }),
    });

    const data = (await response.json()) as { ok: boolean; description?: string };

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete bot commands',
          details: data.description || 'Unknown error',
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bot menu commands deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting bot menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
