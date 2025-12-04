/**
 * Centralized query key factory
 * Prevents typos and ensures consistency across the app
 */
export const queryKeys = {
  // Static data
  services: {
    all: ['services'] as const,
    byId: (id: string) => ['services', id] as const,
  },
  categories: {
    all: ['service-categories'] as const,
    byId: (id: string) => ['service-categories', id] as const,
  },
  tags: {
    all: ['service-tags'] as const,
  },
  stylists: {
    all: ['stylists-all'] as const,
    filtered: (serviceIds: string[]) => ['stylists', { services: serviceIds }] as const,
  },

  // Dynamic data
  availability: (params: { date: string; stylistId?: string; duration?: number }) =>
    ['availability', params] as const,

  // User-specific
  auth: {
    session: ['auth', 'session'] as const,
  },
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    appointments: (userId: string) => ['user', 'appointments', userId] as const,
    pattern: (userId: string) => ['user', 'pattern', userId] as const,
  },

  // Admin data
  admin: {
    settings: ['admin', 'settings'] as const,
    appointments: ['admin', 'appointments'] as const,
    analytics: (range: string) => ['admin', 'analytics', range] as const,
  },
} as const;
