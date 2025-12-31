// src/config/retention.ts
// Note: Retention features (feedback requests, rebooking nudges, win-back campaigns)
// have been removed. Only appointment reminders for men's haircut are active.
export const RETENTION_CONFIG = {
  rateLimit: { daysBetweenMessages: 7 },
} as const;
