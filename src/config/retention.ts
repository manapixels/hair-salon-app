// src/config/retention.ts
export const RETENTION_CONFIG = {
  feedback: { delayHours: 4 },
  rebooking: { weeksSinceVisit: 4 },
  winback: { weeksSinceVisit: 8 },
  rateLimit: { daysBetweenMessages: 7 },
} as const;
