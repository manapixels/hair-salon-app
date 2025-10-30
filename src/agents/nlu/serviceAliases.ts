// src/agents/nlu/serviceAliases.ts
export const SERVICE_ALIASES: Record<string, string> = {
  haircut: "Men's Haircut",
  'mens cut': "Men's Haircut",
  trim: "Men's Haircut",
  'womens haircut': "Women's Haircut",
  'ladies cut': "Women's Haircut",
  color: 'Single Process Color',
  highlights: 'Partial Highlights',
  blowout: 'Blowout',
  'blow dry': 'Blowout',
};

export function lookupService(userInput: string): string | null {
  const lower = userInput.toLowerCase();
  return SERVICE_ALIASES[lower] || null;
}
