import type { CommandResponse, InlineKeyboardButton } from './botCommandService';
import { setCommandOptions, clearCommandOptions, type CommandOption } from './conversationHistory';

interface FormatResult {
  text: string;
}

function flattenButtons(buttons: InlineKeyboardButton[][]): {
  displayLines: string[];
  options: CommandOption[];
  urlLines: string[];
} {
  const displayLines: string[] = [];
  const options: CommandOption[] = [];
  const urlLines: string[] = [];

  buttons.forEach(row => {
    row.forEach(button => {
      if (button.callback_data === 'no_op') {
        displayLines.push(button.text);
        return;
      }

      if (button.callback_data) {
        const index = (options.length + 1).toString();
        options.push({ id: index, label: button.text, callbackData: button.callback_data });
        displayLines.push(`${index}. ${button.text}`);
        return;
      }

      if (button.url) {
        urlLines.push(`• ${button.text}: ${button.url}`);
      }
    });
  });

  return { displayLines, options, urlLines };
}

export function formatCommandResponseForWhatsApp(
  userId: string,
  response: CommandResponse,
): FormatResult {
  let message = response.text;

  const keyboard = response.keyboard?.inline_keyboard;
  if (keyboard && keyboard.length > 0) {
    const { displayLines, options, urlLines } = flattenButtons(keyboard);

    if (options.length > 0) {
      setCommandOptions(userId, options);
      const formattedOptions = displayLines.join('\n');
      message += `\n\n*Options:*\n${formattedOptions}\n\nReply with the option number.`;
    } else {
      clearCommandOptions(userId);
    }

    if (urlLines.length > 0) {
      message += `\n\n*Links:*\n${urlLines.join('\n')}`;
    }
  } else {
    clearCommandOptions(userId);
  }

  return { text: message };
}

export function formatButtonsForWhatsApp(
  userId: string,
  buttons: Array<{ text: string; data: string }> | undefined,
  baseMessage: string,
): FormatResult {
  if (!buttons || buttons.length === 0) {
    clearCommandOptions(userId);
    return { text: baseMessage };
  }

  const options: CommandOption[] = buttons.map((button, index) => ({
    id: (index + 1).toString(),
    label: button.text,
    callbackData: button.data,
  }));

  setCommandOptions(userId, options);

  const formattedOptions = options.map(option => `${option.id}. ${option.label}`).join('\n');

  const text = `${baseMessage}\n\n*Options:*\n${formattedOptions}\n\nReply with the option number.`;

  return { text };
}
