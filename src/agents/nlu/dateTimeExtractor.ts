import * as chrono from 'chrono-node';

export function extractDateTime(text: string): { date: Date | null; time: string | null } {
  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  if (parsed.length === 0) return { date: null, time: null };
  const result = parsed[0];
  const date = result.start.date(); // chrono type fix
  const hour = result.start.get('hour');
  const time = hour !== undefined ? `${hour}:${result.start.get('minute') || 0}` : null;
  return { date, time };
}
