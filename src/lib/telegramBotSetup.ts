/**
 * Telegram Bot Menu Auto-Setup
 *
 * Automatically configures the bot menu commands on application startup.
 * This ensures the bot menu is always in sync with the codebase without
 * manual intervention via BotFather or API endpoint calls.
 */

const BOT_MENU_COMMANDS = [
  {
    command: 'book',
    description: '📅 Book a new appointment',
  },
  {
    command: 'appointments',
    description: '📋 View my appointments',
  },
  {
    command: 'services',
    description: '✂️ Browse services & prices',
  },
  {
    command: 'hours',
    description: '🕐 Business hours & location',
  },
  {
    command: 'help',
    description: '❓ Get help & all commands',
  },
];

let setupComplete = false;
let setupInProgress = false;

/**
 * Check if bot menu commands are already configured correctly
 */
async function isMenuAlreadyConfigured(botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMyCommands`);
    const data = await response.json();

    if (!data.ok || !data.result) {
      return false;
    }

    const currentCommands = data.result;

    // Check if we have the right number of commands
    if (currentCommands.length !== BOT_MENU_COMMANDS.length) {
      return false;
    }

    // Check if all commands match
    for (let i = 0; i < BOT_MENU_COMMANDS.length; i++) {
      const expected = BOT_MENU_COMMANDS[i];
      const current = currentCommands[i];

      if (current.command !== expected.command || current.description !== expected.description) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking bot menu configuration:', error);
    return false;
  }
}

/**
 * Set bot menu commands via Telegram Bot API
 */
async function setBotMenuCommands(botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commands: BOT_MENU_COMMANDS,
        scope: {
          type: 'default',
        },
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Failed to set bot commands');
    }

    return true;
  } catch (error) {
    console.error('Error setting bot menu commands:', error);
    return false;
  }
}

/**
 * Automatically configure Telegram bot menu on application startup
 *
 * This function is idempotent and safe to call multiple times.
 * It will only configure the menu if it's not already set correctly.
 *
 * Call this in your root layout or a server component that loads on startup.
 */
export async function autoConfigureTelegramBotMenu(): Promise<void> {
  // Prevent concurrent setup attempts
  if (setupComplete || setupInProgress) {
    return;
  }

  setupInProgress = true;

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    // Skip if bot token is not configured
    if (!TELEGRAM_BOT_TOKEN) {
      console.log('⚠️  Telegram bot token not configured, skipping bot menu setup');
      return;
    }

    console.log('🔍 Checking Telegram bot menu configuration...');

    // Check if already configured correctly
    const alreadyConfigured = await isMenuAlreadyConfigured(TELEGRAM_BOT_TOKEN);

    if (alreadyConfigured) {
      console.log('✅ Telegram bot menu already configured correctly');
      setupComplete = true;
      return;
    }

    // Configure the menu
    console.log('🔧 Configuring Telegram bot menu...');
    const success = await setBotMenuCommands(TELEGRAM_BOT_TOKEN);

    if (success) {
      console.log('✅ Telegram bot menu configured successfully!');
      console.log(`   Commands: ${BOT_MENU_COMMANDS.map(c => `/${c.command}`).join(', ')}`);
      setupComplete = true;
    } else {
      console.error('❌ Failed to configure Telegram bot menu');
    }
  } catch (error) {
    console.error('❌ Error during Telegram bot menu setup:', error);
  } finally {
    setupInProgress = false;
  }
}

/**
 * Export the commands configuration for reference
 */
export { BOT_MENU_COMMANDS };
