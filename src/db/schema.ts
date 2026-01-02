/**
 * Drizzle ORM Schema for Hair Salon App
 */
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  json,
  index,
  unique,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================
export const roleEnum = pgEnum('Role', ['CUSTOMER', 'STYLIST', 'ADMIN']);
export const appointmentStatusEnum = pgEnum('AppointmentStatus', [
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export const retentionMessageTypeEnum = pgEnum('RetentionMessageType', [
  'FEEDBACK_REQUEST',
  'REBOOKING_NUDGE',
  'WIN_BACK',
]);
export const tagCategoryEnum = pgEnum('TagCategory', ['CONCERN', 'OUTCOME', 'HAIR_TYPE']);
export const bookingSourceEnum = pgEnum('BookingSource', ['WEB', 'TELEGRAM', 'WHATSAPP']);

// ============================================
// TABLES
// ============================================

// Users
export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password'),
    roles: text('roles').array().default(['CUSTOMER']).notNull(),
    authProvider: text('authProvider'),
    telegramId: bigint('telegramId', { mode: 'number' }).unique(),
    whatsappPhone: text('whatsappPhone').unique(),
    avatar: text('avatar'),
    lastVisitDate: timestamp('lastVisitDate'),
    totalVisits: integer('totalVisits').default(0).notNull(),
    lastRetentionMessageSent: timestamp('lastRetentionMessageSent'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  table => ({
    whatsappPhoneIdx: index('users_whatsappPhone_idx').on(table.whatsappPhone),
  }),
);

// Service Categories
export const serviceCategories = pgTable('service_categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  shortTitle: text('shortTitle'),
  description: text('description'),
  icon: text('icon'),
  priceRangeMin: integer('priceRangeMin'),
  priceRangeMax: integer('priceRangeMax'),
  priceNote: text('priceNote'),
  estimatedDuration: integer('estimatedDuration'),
  sortOrder: integer('sortOrder').default(0).notNull(),
  isFeatured: boolean('isFeatured').default(false).notNull(),
  imageUrl: text('imageUrl'),
  illustrationUrl: text('illustrationUrl'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Services
export const services = pgTable('services', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  price: text('price').notNull(),
  basePrice: integer('basePrice').notNull(),
  maxPrice: integer('maxPrice'),
  duration: integer('duration').notNull(),
  // Processing time fields for concurrent scheduling
  // processingWaitTime: Time from start until the processing gap begins (e.g., application time)
  // processingDuration: Length of the gap during which the stylist is free
  processingWaitTime: integer('processingWaitTime').default(0).notNull(),
  processingDuration: integer('processingDuration').default(0).notNull(),
  imageUrl: text('imageUrl'),
  popularityScore: integer('popularityScore').default(0).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  categoryId: text('categoryId')
    .notNull()
    .references(() => serviceCategories.id, { onDelete: 'cascade' }),
  isActive: boolean('isActive').default(true).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Service Addons
export const serviceAddons = pgTable('service_addons', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  benefits: json('benefits').$type<string[]>().default([]),
  price: text('price').notNull(),
  basePrice: integer('basePrice').notNull(),
  duration: integer('duration').default(0).notNull(),
  isRecommended: boolean('isRecommended').default(false).notNull(),
  isPopular: boolean('isPopular').default(false).notNull(),
  serviceId: text('serviceId')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Stylists
export const stylists = pgTable('stylists', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email'),
  bio: text('bio'),
  avatar: text('avatar'),
  specialties: json('specialties').notNull(),
  workingHours: json('workingHours').notNull(),
  blockedDates: json('blockedDates').default([]),
  isActive: boolean('isActive').default(true).notNull(),
  userId: text('userId')
    .unique()
    .references(() => users.id, { onDelete: 'set null' }),
  // Google Calendar OAuth fields
  googleAccessToken: text('googleAccessToken'),
  googleRefreshToken: text('googleRefreshToken'),
  googleTokenExpiry: timestamp('googleTokenExpiry'),
  googleCalendarId: text('googleCalendarId'), // Usually 'primary'
  googleEmail: text('googleEmail'), // Connected Google account email
  // Token status tracking for reconnection reminders
  googleTokenInvalid: boolean('googleTokenInvalid').default(false).notNull(),
  lastCalendarReminderSent: timestamp('lastCalendarReminderSent'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Appointments
export const appointments = pgTable('appointments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  date: timestamp('date').notNull(),
  time: text('time').notNull(),
  categoryId: text('categoryId').references(() => serviceCategories.id, { onDelete: 'set null' }),
  estimatedDuration: integer('estimatedDuration'),
  services: json('services').notNull(),
  totalPrice: integer('totalPrice').notNull(),
  totalDuration: integer('totalDuration').notNull(),
  stylistId: text('stylistId').references(() => stylists.id, { onDelete: 'set null' }),
  customerName: text('customerName').notNull(),
  customerEmail: text('customerEmail').notNull(),
  calendarEventId: text('calendarEventId'),
  userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
  status: appointmentStatusEnum('status').default('SCHEDULED').notNull(),
  completedAt: timestamp('completedAt'),
  feedbackSent: boolean('feedbackSent').default(false).notNull(),
  bookingSource: bookingSourceEnum('bookingSource').default('WEB').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Knowledge Base
export const knowledgeBase = pgTable(
  'knowledge_base',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    tags: json('tags').$type<string[]>().default([]),
    embedding: json('embedding'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  table => ({
    questionIdx: index('knowledge_base_question_idx').on(table.question),
  }),
);

// Login Tokens
export const loginTokens = pgTable(
  'login_tokens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text('token').notNull().unique(),
    userId: text('userId').references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expiresAt').notNull(),
    // Status tracks the login flow: PENDING -> COMPLETED (by Telegram browser) -> Deleted (by original browser)
    status: text('status').default('PENDING').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('login_tokens_userId_idx').on(table.userId),
  }),
);

// Admin Settings
export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  weeklySchedule: json('weeklySchedule')
    .notNull()
    .default({
      monday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      tuesday: { isOpen: false, openingTime: '11:00', closingTime: '19:00' },
      wednesday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      thursday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      friday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      saturday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
      sunday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
    }),
  closedDates: json('closedDates').default([]),
  blockedSlots: json('blockedSlots').default({}),
  businessName: text('businessName').default('Signature Trims Hair Salon').notNull(),
  businessAddress: text('businessAddress')
    .default('930 Yishun Avenue 1 #01-127, Singapore 760930')
    .notNull(),
  businessPhone: text('businessPhone').default('(555) 123-4567').notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Feedback
export const feedback = pgTable('feedback', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  appointmentId: text('appointmentId')
    .notNull()
    .unique()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Retention Messages
export const retentionMessages = pgTable('retention_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  messageType: retentionMessageTypeEnum('messageType').notNull(),
  daysSinceLastVisit: integer('daysSinceLastVisit').notNull(),
  sentAt: timestamp('sentAt').defaultNow().notNull(),
  deliveryStatus: text('deliveryStatus').default('PENDING').notNull(),
  deliveryError: text('deliveryError'),
});

// Flagged Conversations
export const flaggedConversations = pgTable(
  'flagged_conversations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId').notNull(),
    platform: text('platform').notNull(),
    reason: text('reason').notNull(),
    lastMessage: text('lastMessage').notNull(),
    flaggedAt: timestamp('flaggedAt').defaultNow().notNull(),
    resolvedAt: timestamp('resolvedAt'),
    isResolved: boolean('isResolved').default(false).notNull(),
    resolvedBy: text('resolvedBy'),
  },
  table => ({
    userResolvedIdx: index('flagged_conversations_userId_isResolved_idx').on(
      table.userId,
      table.isResolved,
    ),
    resolvedFlaggedIdx: index('flagged_conversations_isResolved_flaggedAt_idx').on(
      table.isResolved,
      table.flaggedAt,
    ),
  }),
);

// Service Tags
export const serviceTags = pgTable(
  'service_tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull().unique(),
    label: text('label').notNull(),
    category: tagCategoryEnum('category').notNull(),
    description: text('description'),
    iconName: text('iconName'),
    sortOrder: integer('sortOrder').default(0).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  table => ({
    categoryIdx: index('service_tags_category_idx').on(table.category),
  }),
);

// Service Tag Relations (Many-to-Many)
export const serviceTagRelations = pgTable(
  'service_tag_relations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    serviceId: text('serviceId')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
    tagId: text('tagId')
      .notNull()
      .references(() => serviceTags.id, { onDelete: 'cascade' }),
  },
  table => ({
    uniqueServiceTag: unique().on(table.serviceId, table.tagId),
    serviceIdIdx: index('service_tag_relations_serviceId_idx').on(table.serviceId),
    tagIdIdx: index('service_tag_relations_tagId_idx').on(table.tagId),
  }),
);

// Conversation Sessions (for Telegram/WhatsApp bot state persistence)
export const conversationSessions = pgTable(
  'conversation_sessions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // User identifier (Telegram chatId or WhatsApp phone)
    chatId: text('chatId').notNull(),
    // Platform: 'telegram' or 'whatsapp'
    platform: text('platform').notNull().default('telegram'),
    // Booking context stored as JSON
    context: json('context')
      .$type<{
        customerName?: string;
        customerEmail?: string;
        categoryId?: string;
        categoryName?: string;
        priceNote?: string;
        services?: string[];
        stylistId?: string;
        stylistName?: string;
        date?: string;
        time?: string;
        confirmed?: boolean;
        awaitingCustomDate?: boolean;
        awaitingInput?: string;
        pendingAction?: string;
        appointmentId?: string;
        newDate?: string;
        newTime?: string;
        lastServiceBooked?: string;
        lastStylistBooked?: string;
        lastBookingDate?: number;
        currentStepMessageId?: number;
        currentStep?: string;
        stepHistory?: Array<{
          step: string;
          context: Record<string, unknown>;
          timestamp: number;
        }>;
        currentWeekOffset?: number;
      }>()
      .notNull()
      .default({}),
    // Timestamps for session management
    lastActivityAt: timestamp('lastActivityAt').defaultNow().notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  table => ({
    chatPlatformIdx: index('conversation_sessions_chatId_platform_idx').on(
      table.chatId,
      table.platform,
    ),
    expiresIdx: index('conversation_sessions_expiresAt_idx').on(table.expiresAt),
  }),
);

// ============================================
// RELATIONS (for Drizzle Query API)
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
  appointments: many(appointments),
  feedback: many(feedback),
  retentionMessages: many(retentionMessages),
  loginTokens: many(loginTokens),
  stylistProfile: one(stylists, {
    fields: [users.id],
    references: [stylists.userId],
  }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  items: many(services),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  addons: many(serviceAddons),
  serviceTags: many(serviceTagRelations),
}));

export const serviceAddonsRelations = relations(serviceAddons, ({ one }) => ({
  service: one(services, {
    fields: [serviceAddons.serviceId],
    references: [services.id],
  }),
}));

export const stylistsRelations = relations(stylists, ({ one, many }) => ({
  user: one(users, {
    fields: [stylists.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  category: one(serviceCategories, {
    fields: [appointments.categoryId],
    references: [serviceCategories.id],
  }),
  stylist: one(stylists, {
    fields: [appointments.stylistId],
    references: [stylists.id],
  }),
  user: one(users, {
    fields: [appointments.userId],
    references: [users.id],
  }),
  feedback: one(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  appointment: one(appointments, {
    fields: [feedback.appointmentId],
    references: [appointments.id],
  }),
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const loginTokensRelations = relations(loginTokens, ({ one }) => ({
  user: one(users, {
    fields: [loginTokens.userId],
    references: [users.id],
  }),
}));

export const retentionMessagesRelations = relations(retentionMessages, ({ one }) => ({
  user: one(users, {
    fields: [retentionMessages.userId],
    references: [users.id],
  }),
}));

export const serviceTagsRelations = relations(serviceTags, ({ many }) => ({
  services: many(serviceTagRelations),
}));

export const serviceTagRelationsRelations = relations(serviceTagRelations, ({ one }) => ({
  service: one(services, {
    fields: [serviceTagRelations.serviceId],
    references: [services.id],
  }),
  tag: one(serviceTags, {
    fields: [serviceTagRelations.tagId],
    references: [serviceTags.id],
  }),
}));
