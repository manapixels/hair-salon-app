import type {
  Appointment,
  AdminSettings,
  Service,
  ServiceCategory,
  User,
  Stylist,
  CreateAppointmentInput,
  StylistSummary,
  BlockedPeriod,
  BookingSource,
} from '../types';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, gte, lt, desc, asc, not, isNull, sql, ilike } from 'drizzle-orm';
import { unstable_cache, revalidateTag } from 'next/cache';

/**
 * DATABASE FUNCTIONS USING DRIZZLE + NEON
 * Edge-compatible PostgreSQL database layer for Cloudflare Workers
 */

// Cache tags for on-demand revalidation
const CACHE_TAGS = {
  SERVICE_CATEGORIES: 'service-categories',
  SERVICES: 'services',
  SERVICE_BY_ID: (id: string) => `service-${id}`,
  CATEGORY_BY_ID: (id: string) => `category-${id}`,
  STYLISTS: 'stylists',
  STYLIST_BY_ID: (id: string) => `stylist-${id}`,
  AVAILABILITY: 'availability',
  AVAILABILITY_BY_DATE: (date: string) => `availability-${date}`,
  AVAILABILITY_BY_STYLIST: (stylistId: string, date: string) => `availability-${stylistId}-${date}`,
  ADMIN_SETTINGS: 'admin-settings',
} as const;

/**
 * Revalidate availability cache for a specific date
 */
export function revalidateAvailability(dateKey: string, stylistId?: string) {
  revalidateTag(CACHE_TAGS.AVAILABILITY);
  revalidateTag(CACHE_TAGS.AVAILABILITY_BY_DATE(dateKey));
  if (stylistId) {
    revalidateTag(CACHE_TAGS.AVAILABILITY_BY_STYLIST(stylistId, dateKey));
  }
}

const normalizeServiceId = (id: any): string => String(id);

// Initialize default admin user and settings on first run
async function initializeDatabase() {
  try {
    const db = await getDb();

    // Check if any admin user exists
    const adminUser = await db
      .select()
      .from(schema.users)
      .where(sql`'ADMIN' = ANY(${schema.users.roles})`)
      .limit(1);

    if (adminUser.length === 0) {
      console.log('⚠️  No admin user found. To create an admin:');
      console.log('1. Login via WhatsApp/Telegram OAuth first');
      console.log('2. Run: npm run create-admin <your-email>');
    }

    // Check if admin settings exist
    const settings = await db.select().from(schema.adminSettings).limit(1);
    if (settings.length === 0) {
      await db.insert(schema.adminSettings).values({
        weeklySchedule: getDefaultWeeklySchedule(),
        closedDates: [],
        blockedSlots: {},
        businessName: 'Signature Trims Hair Salon',
        businessAddress: '930 Yishun Avenue 1 #01-127, Singapore 760930',
        businessPhone: '(555) 123-4567',
      });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize on module load
initializeDatabase();

// --- HELPERS ---
// Use local timezone for date key to prevent date shifting across timezones
const dateToKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateTimeSlots = (start: string, end: string): string[] => {
  const slots: string[] = [];
  let currentTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);
  while (currentTime < endTime) {
    slots.push(currentTime.toTimeString().substring(0, 5));
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }
  return slots;
};

// --- USER MANAGEMENT ---

export const findUserByEmail = async (email: string) => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .limit(1);
  return result[0] || null;
};

export const findUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.telegramId, telegramId))
    .limit(1);

  const user = result[0];
  if (!user) return null;

  return {
    ...user,
    roles: user.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };
};

export const findUserById = async (id: string): Promise<User | null> => {
  const db = await getDb();
  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);

  const user = result[0];
  if (!user) return null;

  return {
    ...user,
    roles: user.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };
};

export const createUserFromOAuth = async (userData: Omit<User, 'id' | 'roles'>): Promise<User> => {
  const db = await getDb();

  // Check for existing user
  let existingUser = null;

  if (userData.authProvider === 'whatsapp' && userData.whatsappPhone) {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.whatsappPhone, userData.whatsappPhone))
      .limit(1);
    existingUser = result[0];
  } else if (userData.authProvider === 'telegram' && userData.telegramId) {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, userData.telegramId))
      .limit(1);
    existingUser = result[0];
  }

  if (!existingUser) {
    existingUser = await findUserByEmail(userData.email);
  }

  if (existingUser) {
    // Update existing user
    const updateData: any = { authProvider: userData.authProvider };
    if (userData.whatsappPhone) updateData.whatsappPhone = userData.whatsappPhone;
    if (userData.telegramId) updateData.telegramId = userData.telegramId;
    if (userData.avatar) updateData.avatar = userData.avatar;

    const isFallbackName =
      userData.name &&
      (userData.name.startsWith('WhatsApp User') || userData.name.startsWith('User '));
    if (userData.name && !isFallbackName) updateData.name = userData.name;

    const result = await db
      .update(schema.users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schema.users.id, existingUser.id))
      .returning();

    const updatedUser = result[0];
    return {
      ...updatedUser,
      roles: updatedUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
      authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
      telegramId: updatedUser.telegramId ?? undefined,
      whatsappPhone: updatedUser.whatsappPhone ?? undefined,
      avatar: updatedUser.avatar ?? undefined,
    };
  }

  const result = await db
    .insert(schema.users)
    .values({
      name: userData.name || `User ${userData.whatsappPhone?.slice(-4) || 'Unknown'}`,
      email: userData.email.toLowerCase(),
      roles: ['CUSTOMER'],
      authProvider: userData.authProvider,
      telegramId: userData.telegramId,
      whatsappPhone: userData.whatsappPhone,
      avatar: userData.avatar,
      updatedAt: new Date(),
    })
    .returning();

  const newUser = result[0];
  return {
    ...newUser,
    roles: newUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: newUser.authProvider as 'whatsapp' | 'telegram' | undefined,
    telegramId: newUser.telegramId ?? undefined,
    whatsappPhone: newUser.whatsappPhone ?? undefined,
    avatar: newUser.avatar ?? undefined,
  };
};

export const promoteUserToAdmin = async (email: string): Promise<User | null> => {
  const db = await getDb();
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error('User not found. Please login via WhatsApp/Telegram first.');
  }

  const result = await db
    .update(schema.users)
    .set({ roles: ['ADMIN'], updatedAt: new Date() })
    .where(eq(schema.users.email, email.toLowerCase()))
    .returning();

  const updatedUser = result[0];
  return {
    ...updatedUser,
    roles: updatedUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
  };
};

// --- DATA INTEGRITY VALIDATION ---

export interface DataIntegrityIssue {
  type: 'STYLIST_ROLE_NO_RECORD' | 'STYLIST_RECORD_NO_ROLE';
  userId?: string;
  stylistId?: string;
  userName?: string;
  userEmail?: string;
  description: string;
}

export interface DataIntegrityResult {
  isConsistent: boolean;
  issues: DataIntegrityIssue[];
  summary: {
    usersWithStylistRole: number;
    stylistRecords: number;
    usersWithStylistRoleNoRecord: number;
    stylistRecordsNoStylistRole: number;
  };
}

/**
 * Validates consistency between user roles and the stylists table.
 * - Users with STYLIST role should have a matching stylist record
 * - Stylist records should have linked users with STYLIST role
 */
export const validateRoleStylistConsistency = async (): Promise<DataIntegrityResult> => {
  const db = await getDb();

  // Get all users with STYLIST role
  const usersWithStylistRole = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      roles: schema.users.roles,
    })
    .from(schema.users)
    .where(sql`'STYLIST' = ANY(${schema.users.roles})`);

  // Get all stylist records with their linked users
  const stylistRecords = await db
    .select({
      id: schema.stylists.id,
      name: schema.stylists.name,
      email: schema.stylists.email,
      userId: schema.stylists.userId,
    })
    .from(schema.stylists);

  const issues: DataIntegrityIssue[] = [];

  // Check: Users with STYLIST role should have a stylist record
  for (const user of usersWithStylistRole) {
    const hasRecord = stylistRecords.some(s => s.userId === user.id);
    if (!hasRecord) {
      issues.push({
        type: 'STYLIST_ROLE_NO_RECORD',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        description: `User "${user.name}" (${user.email}) has STYLIST role but no matching stylist record`,
      });
    }
  }

  // Check: Stylist records with userId should have that user with STYLIST role
  for (const stylist of stylistRecords) {
    if (stylist.userId) {
      const userHasStylistRole = usersWithStylistRole.some(u => u.id === stylist.userId);
      if (!userHasStylistRole) {
        issues.push({
          type: 'STYLIST_RECORD_NO_ROLE',
          stylistId: stylist.id,
          userId: stylist.userId,
          userName: stylist.name,
          userEmail: stylist.email ?? undefined,
          description: `Stylist record "${stylist.name}" links to user ${stylist.userId}, but that user doesn't have STYLIST role`,
        });
      }
    }
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    summary: {
      usersWithStylistRole: usersWithStylistRole.length,
      stylistRecords: stylistRecords.length,
      usersWithStylistRoleNoRecord: issues.filter(i => i.type === 'STYLIST_ROLE_NO_RECORD').length,
      stylistRecordsNoStylistRole: issues.filter(i => i.type === 'STYLIST_RECORD_NO_ROLE').length,
    },
  };
};

// --- SERVICE MANAGEMENT ---

export const getServices = unstable_cache(
  async (): Promise<Service[]> => {
    const db = await getDb();
    const services = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true));
    return services.map(s => ({
      ...s,
      description: s.description ?? undefined,
      maxPrice: s.maxPrice ?? undefined,
      imageUrl: s.imageUrl ?? undefined,
      tags: s.tags ?? [],
    }));
  },
  ['services'],
  { tags: [CACHE_TAGS.SERVICES], revalidate: false },
);

export const getServiceCategories = unstable_cache(
  async (): Promise<ServiceCategory[]> => {
    const db = await getDb();

    // Get categories ordered by sortOrder
    const categories = await db
      .select()
      .from(schema.serviceCategories)
      .orderBy(asc(schema.serviceCategories.sortOrder));

    // Get services with addons for each category
    const servicesWithAddons = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .orderBy(asc(schema.services.createdAt));

    const addons = await db
      .select()
      .from(schema.serviceAddons)
      .orderBy(asc(schema.serviceAddons.createdAt));
    const tagRelations = await db.select().from(schema.serviceTagRelations);
    const tags = await db.select().from(schema.serviceTags);

    return categories.map(cat => ({
      ...cat,
      shortTitle: cat.shortTitle ?? undefined,
      description: cat.description ?? undefined,
      icon: cat.icon ?? undefined,
      priceRangeMin: cat.priceRangeMin ?? undefined,
      priceRangeMax: cat.priceRangeMax ?? undefined,
      priceNote: cat.priceNote ?? undefined,
      estimatedDuration: cat.estimatedDuration ?? undefined,
      isFeatured: cat.isFeatured ?? undefined,
      imageUrl: cat.imageUrl ?? undefined,
      illustrationUrl: cat.illustrationUrl ?? undefined,
      items: servicesWithAddons
        .filter(s => s.categoryId === cat.id)
        .map(s => ({
          ...s,
          description: s.description ?? undefined,
          maxPrice: s.maxPrice ?? undefined,
          imageUrl: s.imageUrl ?? undefined,
          addons: addons
            .filter(a => a.serviceId === s.id)
            .map(a => ({
              ...a,
              description: a.description ?? undefined,
              benefits: (a.benefits as string[]) ?? undefined,
            })),
          tags: s.tags ?? [],
          serviceTags: tagRelations
            .filter(r => r.serviceId === s.id)
            .map(r => {
              const tag = tags.find(t => t.id === r.tagId);
              if (!tag) return null;
              return {
                ...r,
                tag: {
                  ...tag,
                  category: tag.category as 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE',
                  description: tag.description ?? undefined,
                  iconName: tag.iconName ?? undefined,
                  // Ensure other optional fields are handled if necessary
                },
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null),
        })),
    }));
  },
  ['service-categories'],
  { tags: [CACHE_TAGS.SERVICE_CATEGORIES], revalidate: false },
);

export async function getServiceById(id: string): Promise<Service | null> {
  const getCachedService = unstable_cache(
    async () => {
      const db = await getDb();
      const result = await db
        .select()
        .from(schema.services)
        .where(eq(schema.services.id, id))
        .limit(1);
      const service = result[0];
      if (!service) return null;

      const addons = await db
        .select()
        .from(schema.serviceAddons)
        .where(eq(schema.serviceAddons.serviceId, id));

      return {
        ...service,
        description: service.description ?? undefined,
        maxPrice: service.maxPrice ?? undefined,
        imageUrl: service.imageUrl ?? undefined,
        addons: addons.map(a => ({
          ...a,
          description: a.description ?? undefined,
          benefits: (a.benefits as string[]) ?? undefined,
        })),
        tags: service.tags ?? [],
        serviceTags: (
          await Promise.all(
            (
              await db
                .select()
                .from(schema.serviceTagRelations)
                .where(eq(schema.serviceTagRelations.serviceId, id))
            ).map(async r => {
              const tagResult = await db
                .select()
                .from(schema.serviceTags)
                .where(eq(schema.serviceTags.id, r.tagId))
                .limit(1);
              const tag = tagResult[0];
              if (!tag) return null;
              return {
                ...r,
                tag: {
                  ...tag,
                  category: tag.category as 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE',
                  description: tag.description ?? undefined,
                  iconName: tag.iconName ?? undefined,
                },
              };
            }),
          )
        ).filter((r): r is NonNullable<typeof r> => r !== null),
      };
    },
    ['service', id],
    { tags: [CACHE_TAGS.SERVICE_BY_ID(id), CACHE_TAGS.SERVICES], revalidate: false },
  );

  return getCachedService();
}

// --- APPOINTMENT MANAGEMENT ---
export interface GetAppointmentsOptions {
  fromDate?: Date;
  toDate?: Date;
}

export const getAppointments = async (options?: GetAppointmentsOptions): Promise<Appointment[]> => {
  const db = await getDb();

  // Default: 30 days past to 30 days future
  const now = new Date();
  const defaultFromDate = new Date(now);
  defaultFromDate.setDate(defaultFromDate.getDate() - 30);
  const defaultToDate = new Date(now);
  defaultToDate.setDate(defaultToDate.getDate() + 30);

  const fromDate = options?.fromDate ?? defaultFromDate;
  const toDate = options?.toDate ?? defaultToDate;

  // Build query with date filtering
  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(and(gte(schema.appointments.date, fromDate), lt(schema.appointments.date, toDate)))
    .orderBy(asc(schema.appointments.date));
  const stylists = await db.select().from(schema.stylists);
  const categories = await db.select().from(schema.serviceCategories);
  const allServices = await getServices();

  return appointments.map(apt => {
    const stylist = stylists.find(s => s.id === apt.stylistId);
    const category = categories.find(c => c.id === apt.categoryId);

    return {
      ...apt,
      services: Array.isArray(apt.services) ? (apt.services as unknown as Service[]) : [],
      stylistId: apt.stylistId ?? undefined,
      stylist: stylist
        ? {
            ...stylist,
            email: stylist.email ?? undefined,
            bio: stylist.bio ?? undefined,
            avatar: stylist.avatar ?? undefined,
            specialties: Array.isArray(stylist.specialties)
              ? ((stylist.specialties as any[])
                  .map(id => allServices.find(s => s.id === normalizeServiceId(id)))
                  .filter(Boolean) as Service[])
              : [],
            workingHours: (stylist.workingHours as any) || getDefaultWorkingHours(),
            blockedDates:
              stylist.blockedDates && Array.isArray(stylist.blockedDates)
                ? (stylist.blockedDates as string[])
                : [],
          }
        : undefined,
      calendarEventId: apt.calendarEventId ?? undefined,
      categoryId: apt.categoryId ?? undefined,
      category: category
        ? {
            ...category,
            shortTitle: category.shortTitle ?? undefined,
            description: category.description ?? undefined,
            icon: category.icon ?? undefined,
            priceRangeMin: category.priceRangeMin ?? undefined,
            priceRangeMax: category.priceRangeMax ?? undefined,
            priceNote: category.priceNote ?? undefined,
            estimatedDuration: category.estimatedDuration ?? undefined,
            isFeatured: category.isFeatured ?? undefined,
            imageUrl: category.imageUrl ?? undefined,
            illustrationUrl: category.illustrationUrl ?? undefined,
            items: [],
          }
        : undefined,
      estimatedDuration: apt.estimatedDuration ?? undefined,
    };
  });
};

const getDefaultWeeklySchedule = () => ({
  monday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
  tuesday: { isOpen: false, openingTime: '11:00', closingTime: '19:00' },
  wednesday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
  thursday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
  friday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
  saturday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
  sunday: { isOpen: true, openingTime: '11:00', closingTime: '19:00' },
});

export const getAdminSettings = unstable_cache(
  async (): Promise<AdminSettings> => {
    const db = await getDb();
    const result = await db.select().from(schema.adminSettings).limit(1);
    const settings = result[0];

    const defaultSocialLinks = {
      instagram: { url: '', isActive: false },
      facebook: { url: '', isActive: false },
      whatsapp: { url: '', isActive: false },
      telegram: { url: '', isActive: false },
    };

    if (!settings) {
      return {
        weeklySchedule: getDefaultWeeklySchedule(),
        specialClosures: [],
        blockedSlots: {},
        businessName: 'Signature Trims Hair Salon',
        businessAddress: '930 Yishun Avenue 1 #01-127, Singapore 760930',
        businessPhone: '(555) 123-4567',
        depositEnabled: true,
        depositPercentage: 15,
        depositTrustThreshold: 1,
        depositRefundWindowHours: 24,
        socialLinks: defaultSocialLinks,
      };
    }

    // Migrate legacy closedDates to specialClosures
    let specialClosures: BlockedPeriod[] = [];
    if (settings.closedDates && Array.isArray(settings.closedDates)) {
      specialClosures = (settings.closedDates as any[])
        .map(item => {
          if (typeof item === 'object' && item !== null && 'date' in item) {
            return item as BlockedPeriod;
          }
          if (typeof item === 'string') {
            return { date: item, isFullDay: true, reason: undefined };
          }
          return null;
        })
        .filter((item): item is BlockedPeriod => item !== null);
    }

    return {
      weeklySchedule:
        settings.weeklySchedule && typeof settings.weeklySchedule === 'object'
          ? (settings.weeklySchedule as any)
          : getDefaultWeeklySchedule(),
      specialClosures,
      blockedSlots:
        settings.blockedSlots &&
        typeof settings.blockedSlots === 'object' &&
        !Array.isArray(settings.blockedSlots)
          ? (settings.blockedSlots as { [date: string]: string[] })
          : {},
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      businessPhone: settings.businessPhone,
      depositEnabled: settings.depositEnabled,
      depositPercentage: settings.depositPercentage,
      depositTrustThreshold: settings.depositTrustThreshold,
      depositRefundWindowHours: settings.depositRefundWindowHours,
      socialLinks:
        settings.socialLinks && typeof settings.socialLinks === 'object'
          ? (settings.socialLinks as any)
          : defaultSocialLinks,
    };
  },
  ['admin-settings'],
  { tags: [CACHE_TAGS.ADMIN_SETTINGS], revalidate: 60 },
);

export const updateAdminSettings = async (
  newSettings: Partial<AdminSettings>,
): Promise<AdminSettings> => {
  const db = await getDb();
  const existing = await db.select().from(schema.adminSettings).limit(1);
  const currentSettings = await getAdminSettings();

  if (existing.length > 0) {
    await db
      .update(schema.adminSettings)
      .set({
        weeklySchedule: (newSettings.weeklySchedule ?? currentSettings.weeklySchedule) as any,
        closedDates: (newSettings.specialClosures ?? currentSettings.specialClosures) as any,
        businessName: newSettings.businessName ?? existing[0].businessName,
        businessAddress: newSettings.businessAddress ?? existing[0].businessAddress,
        businessPhone: newSettings.businessPhone ?? existing[0].businessPhone,
        blockedSlots: (newSettings.blockedSlots ?? currentSettings.blockedSlots) as any,
        depositEnabled: newSettings.depositEnabled ?? existing[0].depositEnabled,
        depositPercentage: newSettings.depositPercentage ?? existing[0].depositPercentage,
        depositTrustThreshold:
          newSettings.depositTrustThreshold ?? existing[0].depositTrustThreshold,
        depositRefundWindowHours:
          newSettings.depositRefundWindowHours ?? existing[0].depositRefundWindowHours,
        socialLinks: (newSettings.socialLinks ?? currentSettings.socialLinks) as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.adminSettings.id, existing[0].id));
  } else {
    await db.insert(schema.adminSettings).values({
      weeklySchedule: (newSettings.weeklySchedule ?? getDefaultWeeklySchedule()) as any,
      closedDates: (newSettings.specialClosures ?? []) as any,
      blockedSlots: (newSettings.blockedSlots ?? {}) as any,
      businessName: newSettings.businessName ?? 'Signature Trims Hair Salon',
      businessAddress:
        newSettings.businessAddress ?? '930 Yishun Avenue 1 #01-127, Singapore 760930',
      businessPhone: newSettings.businessPhone ?? '(555) 123-4567',
      depositEnabled: newSettings.depositEnabled ?? true,
      depositPercentage: newSettings.depositPercentage ?? 15,
      depositTrustThreshold: newSettings.depositTrustThreshold ?? 1,
      depositRefundWindowHours: newSettings.depositRefundWindowHours ?? 24,
      socialLinks: (newSettings.socialLinks ?? {}) as any,
    });
  }

  // Revalidate the cache after updating settings
  revalidateTag(CACHE_TAGS.ADMIN_SETTINGS);

  return await getAdminSettings();
};

// --- AVAILABILITY ---

export const getAvailability = async (date: Date): Promise<string[]> => {
  const dateKey = dateToKey(date);

  const getCachedAvailability = unstable_cache(
    async (dateKeyParam: string) => {
      const db = await getDb();
      const settings = await getAdminSettings();

      // Check for full-day closure
      const fullDayClosure = settings.specialClosures.find(
        closure => closure.date === dateKeyParam && closure.isFullDay,
      );
      if (fullDayClosure) return [];

      // Get day schedule
      const dateObj = new Date(dateKeyParam + 'T12:00:00.000Z');
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const daySchedule =
        settings.weeklySchedule[dayOfWeek as keyof typeof settings.weeklySchedule];

      if (!daySchedule || !daySchedule.isOpen) return [];

      const allSlots = generateTimeSlots(daySchedule.openingTime, daySchedule.closingTime);

      // Get booked appointments
      const appointments = await db
        .select()
        .from(schema.appointments)
        .where(
          and(
            gte(schema.appointments.date, new Date(dateKeyParam + 'T00:00:00.000Z')),
            lt(schema.appointments.date, new Date(dateKeyParam + 'T23:59:59.999Z')),
          ),
        );

      const bookedSlots = new Set<string>();
      appointments.forEach(app => {
        const appStartTime = new Date(`1970-01-01T${app.time}:00`);
        const services = Array.isArray(app.services) ? (app.services as any[]) : [];

        // Check if any service in the appointment has processing gaps
        let hasProcessingGap = false;
        let totalProcessingWait = 0;
        let totalProcessingDuration = 0;

        for (const svc of services) {
          if (svc.processingWaitTime > 0 && svc.processingDuration > 0) {
            hasProcessingGap = true;
            totalProcessingWait = svc.processingWaitTime;
            totalProcessingDuration = svc.processingDuration;
            break; // Use the first service with gaps (typically primary service)
          }
        }

        if (hasProcessingGap && totalProcessingWait > 0 && totalProcessingDuration > 0) {
          // Block: Start to WaitTime (application phase)
          const busyPhase1Slots = Math.ceil(totalProcessingWait / 30);
          let currentTime = new Date(appStartTime);
          for (let i = 0; i < busyPhase1Slots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }

          // Skip the gap (processing duration)
          currentTime.setMinutes(
            appStartTime.getMinutes() + totalProcessingWait + totalProcessingDuration,
          );

          // Block: After gap to end (finishing phase)
          const finishDuration = app.totalDuration - totalProcessingWait - totalProcessingDuration;
          const busyPhase2Slots = Math.ceil(finishDuration / 30);
          for (let i = 0; i < busyPhase2Slots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        } else {
          // No processing gap - block all slots
          let currentTime = new Date(appStartTime);
          const numSlots = Math.ceil(app.totalDuration / 30);
          for (let i = 0; i < numSlots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        }
      });

      const blockedByAdmin = new Set<string>(settings.blockedSlots[dateKeyParam] || []);

      return allSlots.filter(slot => !bookedSlots.has(slot) && !blockedByAdmin.has(slot));
    },
    ['availability', dateKey],
    { tags: [CACHE_TAGS.AVAILABILITY, CACHE_TAGS.AVAILABILITY_BY_DATE(dateKey)], revalidate: 30 },
  );

  return getCachedAvailability(dateKey);
};

export const getStylistAvailability = async (date: Date, stylistId: string): Promise<string[]> => {
  const dateKey = dateToKey(date);

  const getCachedStylistAvailability = unstable_cache(
    async (dateKeyParam: string, stylistIdParam: string) => {
      const db = await getDb();
      const dateObj = new Date(dateKeyParam + 'T12:00:00.000Z');
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      console.log(`[StylistAvail] Date: ${dateKeyParam}, Day: ${dayOfWeek}`);

      const stylist = await getStylistById(stylistIdParam);
      if (!stylist || !stylist.isActive) {
        console.log(`[StylistAvail] Stylist not found or inactive`);
        return [];
      }

      // Check if date is blocked
      const isDateBlocked = stylist.blockedDates?.some(d => {
        const dateStr = typeof d === 'string' ? d : d.date;
        return dateStr === dateKeyParam;
      });
      if (isDateBlocked) {
        console.log(`[StylistAvail] Date is blocked for stylist`);
        return [];
      }

      if (!stylist.workingHours || typeof stylist.workingHours !== 'object') {
        console.log(`[StylistAvail] No working hours, falling back to general availability`);
        return await getAvailability(dateObj);
      }

      const workingHours = stylist.workingHours[dayOfWeek as keyof typeof stylist.workingHours];
      console.log(`[StylistAvail] Working hours for ${dayOfWeek}:`, workingHours);
      if (!workingHours || !workingHours.isWorking) {
        console.log(`[StylistAvail] Stylist not working on ${dayOfWeek}`);
        return [];
      }

      const stylistSlots = generateTimeSlots(workingHours.start, workingHours.end);
      console.log(
        `[StylistAvail] Generated ${stylistSlots.length} slots from ${workingHours.start} to ${workingHours.end}`,
      );

      // Get stylist appointments
      const stylistAppointments = await db
        .select()
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.stylistId, stylistIdParam),
            gte(schema.appointments.date, new Date(dateKeyParam + 'T00:00:00.000Z')),
            lt(schema.appointments.date, new Date(dateKeyParam + 'T23:59:59.999Z')),
          ),
        );

      const bookedSlots = new Set<string>();
      stylistAppointments.forEach(app => {
        const appStartTime = new Date(`1970-01-01T${app.time}:00`);
        const services = Array.isArray(app.services) ? (app.services as any[]) : [];

        // Check if any service in the appointment has processing gaps
        let hasProcessingGap = false;
        let totalProcessingWait = 0;
        let totalProcessingDuration = 0;

        for (const svc of services) {
          if (svc.processingWaitTime > 0 && svc.processingDuration > 0) {
            hasProcessingGap = true;
            totalProcessingWait = svc.processingWaitTime;
            totalProcessingDuration = svc.processingDuration;
            break; // Use the first service with gaps
          }
        }

        if (hasProcessingGap && totalProcessingWait > 0 && totalProcessingDuration > 0) {
          // Block: Start to WaitTime (application phase)
          const busyPhase1Slots = Math.ceil(totalProcessingWait / 30);
          let currentTime = new Date(appStartTime);
          for (let i = 0; i < busyPhase1Slots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }

          // Skip the gap (processing duration)
          currentTime.setMinutes(
            appStartTime.getMinutes() + totalProcessingWait + totalProcessingDuration,
          );

          // Block: After gap to end (finishing phase)
          const finishDuration = app.totalDuration - totalProcessingWait - totalProcessingDuration;
          const busyPhase2Slots = Math.ceil(finishDuration / 30);
          for (let i = 0; i < busyPhase2Slots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        } else {
          // No processing gap - block all slots
          let currentTime = new Date(appStartTime);
          const numSlots = Math.ceil(app.totalDuration / 30);
          for (let i = 0; i < numSlots; i++) {
            bookedSlots.add(currentTime.toTimeString().substring(0, 5));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
          }
        }
      });

      const settings = await getAdminSettings();
      const blockedByAdmin = new Set<string>(settings.blockedSlots[dateKeyParam] || []);

      const finalSlots = stylistSlots.filter(
        slot => !bookedSlots.has(slot) && !blockedByAdmin.has(slot),
      );
      console.log(`[StylistAvail] Final slots after filtering: ${finalSlots.length}`);
      return finalSlots;
    },
    ['stylist-availability', dateKey, stylistId],
    {
      tags: [
        CACHE_TAGS.AVAILABILITY,
        CACHE_TAGS.AVAILABILITY_BY_DATE(dateKey),
        CACHE_TAGS.AVAILABILITY_BY_STYLIST(stylistId, dateKey),
      ],
      revalidate: 30,
    },
  );

  const result = await getCachedStylistAvailability(dateKey, stylistId);
  console.log(
    `[StylistAvail] FINAL: dateKey=${dateKey}, stylistId=${stylistId}, slots=${result.length}`,
  );
  return result;
};

// --- BOOKING ---

export const bookNewAppointment = async (
  appointmentData: CreateAppointmentInput,
): Promise<Appointment> => {
  const db = await getDb();

  console.log(
    `[Booking] Input date: ${appointmentData.date}, stylistId: ${appointmentData.stylistId}`,
  );
  console.log(
    `[Booking] Date type: ${typeof appointmentData.date}, Date ISO: ${appointmentData.date instanceof Date ? appointmentData.date.toISOString() : 'not a Date'}`,
  );

  const availableSlots = appointmentData.stylistId
    ? await getStylistAvailability(appointmentData.date, appointmentData.stylistId)
    : await getAvailability(appointmentData.date);

  const isCategoryBased = Boolean(appointmentData.categoryId);

  let totalPrice = 0;
  let totalDuration = 0;

  if (isCategoryBased && appointmentData.estimatedDuration) {
    totalDuration = appointmentData.estimatedDuration;
    totalPrice = 0;
  } else {
    const result = appointmentData.services.reduce(
      (acc, service) => {
        acc.totalPrice += service.basePrice;
        acc.totalDuration += service.duration;
        if (service.addons && Array.isArray(service.addons)) {
          service.addons.forEach(addon => {
            acc.totalPrice += addon.basePrice;
            if (addon.duration) acc.totalDuration += addon.duration;
          });
        }
        return acc;
      },
      { totalPrice: 0, totalDuration: 0 },
    );
    totalPrice = result.totalPrice;
    totalDuration = result.totalDuration;
  }

  const numSlotsRequired = Math.ceil(totalDuration / 30);
  console.log(
    `[Booking] Duration: ${totalDuration}min, numSlotsRequired: ${numSlotsRequired}, time: ${appointmentData.time}`,
  );
  console.log(`[Booking] Available slots:`, availableSlots);

  for (let i = 0; i < numSlotsRequired; i++) {
    const slotToCheck = new Date(`1970-01-01T${appointmentData.time}:00`);
    slotToCheck.setMinutes(slotToCheck.getMinutes() + i * 30);
    const timeString = slotToCheck.toTimeString().substring(0, 5);
    console.log(
      `[Booking] Checking slot ${i + 1}/${numSlotsRequired}: ${timeString}, available: ${availableSlots.includes(timeString)}`,
    );
    if (!availableSlots.includes(timeString)) {
      throw new Error('Booking conflict. Not enough consecutive slots available.');
    }
  }

  let result;
  try {
    result = await db
      .insert(schema.appointments)
      .values({
        date: appointmentData.date,
        time: appointmentData.time,
        categoryId: appointmentData.categoryId,
        estimatedDuration: appointmentData.estimatedDuration,
        services: appointmentData.services as any,
        totalPrice,
        totalDuration,
        stylistId: appointmentData.stylistId,
        customerName: appointmentData.customerName,
        customerEmail: appointmentData.customerEmail,
        calendarEventId: null,
        userId: appointmentData.userId,
        bookingSource: appointmentData.bookingSource || 'WEB',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  } catch (dbError: any) {
    console.error('[Booking] Database insert error:', dbError);
    console.error('[Booking] Error message:', dbError.message);
    console.error('[Booking] Error cause:', dbError.cause);
    throw dbError;
  }

  const newAppointment = result[0];

  // Revalidate cache
  const dateKey = dateToKey(appointmentData.date);
  revalidateAvailability(dateKey, appointmentData.stylistId);

  // Fetch category and stylist data if available
  let category = undefined;
  if (newAppointment.categoryId) {
    const categoryResult = await db
      .select()
      .from(schema.serviceCategories)
      .where(eq(schema.serviceCategories.id, newAppointment.categoryId))
      .limit(1);
    const cat = categoryResult[0];
    if (cat) {
      category = {
        ...cat,
        shortTitle: cat.shortTitle ?? undefined,
        description: cat.description ?? undefined,
        icon: cat.icon ?? undefined,
        priceRangeMin: cat.priceRangeMin ?? undefined,
        priceRangeMax: cat.priceRangeMax ?? undefined,
        priceNote: cat.priceNote ?? undefined,
        estimatedDuration: cat.estimatedDuration ?? undefined,
        isFeatured: cat.isFeatured ?? undefined,
        imageUrl: cat.imageUrl ?? undefined,
        illustrationUrl: cat.illustrationUrl ?? undefined,
        items: [],
      };
    }
  }

  let stylist = undefined;
  if (newAppointment.stylistId) {
    const stylistResult = await db
      .select()
      .from(schema.stylists)
      .where(eq(schema.stylists.id, newAppointment.stylistId))
      .limit(1);
    const sty = stylistResult[0];
    if (sty) {
      stylist = {
        id: sty.id,
        name: sty.name,
        email: sty.email ?? undefined,
      };
    }
  }

  return {
    ...newAppointment,
    services: Array.isArray(newAppointment.services)
      ? (newAppointment.services as unknown as Service[])
      : [],
    stylistId: newAppointment.stylistId ?? undefined,
    stylist,
    calendarEventId: newAppointment.calendarEventId ?? undefined,
    categoryId: newAppointment.categoryId ?? undefined,
    category,
    estimatedDuration: newAppointment.estimatedDuration ?? undefined,
    bookingSource: newAppointment.bookingSource,
  };
};

export const cancelAppointment = async (details: {
  customerEmail: string;
  date: string;
  time: string;
}): Promise<Appointment> => {
  const db = await getDb();
  const { customerEmail, date, time } = details;

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        sql`LOWER(${schema.appointments.customerEmail}) = LOWER(${customerEmail})`,
        gte(schema.appointments.date, new Date(date + 'T00:00:00.000Z')),
        lt(schema.appointments.date, new Date(date + 'T23:59:59.999Z')),
        eq(schema.appointments.time, time),
      ),
    );

  const appointment = appointments[0];
  if (!appointment) {
    throw new Error('Appointment not found. Please check the details provided.');
  }

  await db.delete(schema.appointments).where(eq(schema.appointments.id, appointment.id));

  revalidateAvailability(date, appointment.stylistId ?? undefined);

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  };
};

export const blockSlot = async (
  date: Date,
  time: string,
): Promise<AdminSettings['blockedSlots']> => {
  const settings = await getAdminSettings();
  const dateKey = dateToKey(date);

  const updatedBlockedSlots = { ...settings.blockedSlots };
  if (!updatedBlockedSlots[dateKey]) updatedBlockedSlots[dateKey] = [];
  if (!updatedBlockedSlots[dateKey].includes(time)) updatedBlockedSlots[dateKey].push(time);

  await updateAdminSettings({ blockedSlots: updatedBlockedSlots });
  return updatedBlockedSlots;
};

export const unblockSlot = async (
  date: Date,
  time: string,
): Promise<AdminSettings['blockedSlots']> => {
  const settings = await getAdminSettings();
  const dateKey = dateToKey(date);

  const updatedBlockedSlots = { ...settings.blockedSlots };
  if (updatedBlockedSlots[dateKey]) {
    updatedBlockedSlots[dateKey] = updatedBlockedSlots[dateKey].filter(t => t !== time);
  }

  await updateAdminSettings({ blockedSlots: updatedBlockedSlots });
  return updatedBlockedSlots;
};

export const updateAppointmentCalendarId = async (
  appointmentId: string,
  calendarEventId: string,
): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.appointments)
    .set({ calendarEventId, updatedAt: new Date() })
    .where(eq(schema.appointments.id, appointmentId));
};

export const findAppointmentById = async (id: string): Promise<Appointment | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, id))
    .limit(1);
  const appointment = result[0];

  if (!appointment) return null;

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  };
};

export const findAppointmentsByEmail = async (customerEmail: string): Promise<Appointment[]> => {
  const db = await getDb();
  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        sql`LOWER(${schema.appointments.customerEmail}) = LOWER(${customerEmail})`,
        gte(schema.appointments.date, new Date()),
      ),
    )
    .orderBy(asc(schema.appointments.date));

  return appointments.map(appointment => ({
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  }));
};

export const updateAppointment = async (
  id: string,
  appointmentData: {
    customerName: string;
    customerEmail: string;
    date: Date;
    time: string;
    services: Service[];
    totalPrice: number;
    totalDuration: number;
    stylistId?: string | null;
    categoryId?: string | null;
    estimatedDuration?: number | null;
  },
): Promise<Appointment> => {
  const db = await getDb();
  const dateKey = dateToKey(appointmentData.date);

  // Check conflicts excluding current appointment
  const existingAppointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        gte(schema.appointments.date, new Date(dateKey + 'T00:00:00.000Z')),
        lt(schema.appointments.date, new Date(dateKey + 'T23:59:59.999Z')),
        not(eq(schema.appointments.id, id)),
      ),
    );

  const bookedSlots = new Set<string>();
  existingAppointments.forEach(app => {
    let appTime = new Date(`1970-01-01T${app.time}:00`);
    const numSlots = Math.ceil(app.totalDuration / 30);
    for (let i = 0; i < numSlots; i++) {
      bookedSlots.add(appTime.toTimeString().substring(0, 5));
      appTime.setMinutes(appTime.getMinutes() + 30);
    }
  });

  const numSlotsRequired = Math.ceil(appointmentData.totalDuration / 30);
  for (let i = 0; i < numSlotsRequired; i++) {
    const slotToCheck = new Date(`1970-01-01T${appointmentData.time}:00`);
    slotToCheck.setMinutes(slotToCheck.getMinutes() + i * 30);
    const timeString = slotToCheck.toTimeString().substring(0, 5);
    if (bookedSlots.has(timeString)) {
      throw new Error(`Booking conflict. Time slot ${timeString} is already booked.`);
    }
  }

  const updateData: any = {
    customerName: appointmentData.customerName,
    customerEmail: appointmentData.customerEmail,
    date: appointmentData.date,
    time: appointmentData.time,
    services: appointmentData.services,
    totalPrice: appointmentData.totalPrice,
    totalDuration: appointmentData.totalDuration,
    updatedAt: new Date(),
  };

  if (appointmentData.stylistId !== undefined) updateData.stylistId = appointmentData.stylistId;
  if (appointmentData.categoryId !== undefined) updateData.categoryId = appointmentData.categoryId;
  if (appointmentData.estimatedDuration !== undefined)
    updateData.estimatedDuration = appointmentData.estimatedDuration;

  const result = await db
    .update(schema.appointments)
    .set(updateData)
    .where(eq(schema.appointments.id, id))
    .returning();
  const updatedAppointment = result[0];

  return {
    ...updatedAppointment,
    services: Array.isArray(updatedAppointment.services)
      ? (updatedAppointment.services as unknown as Service[])
      : [],
    stylistId: updatedAppointment.stylistId ?? undefined,
    calendarEventId: updatedAppointment.calendarEventId ?? undefined,
    categoryId: updatedAppointment.categoryId ?? undefined,
    estimatedDuration: updatedAppointment.estimatedDuration ?? undefined,
  };
};

// --- STYLIST MANAGEMENT ---

function getDefaultWorkingHours(): Stylist['workingHours'] {
  return {
    monday: { start: '09:00', end: '17:00', isWorking: true },
    tuesday: { start: '09:00', end: '17:00', isWorking: true },
    wednesday: { start: '09:00', end: '17:00', isWorking: true },
    thursday: { start: '09:00', end: '17:00', isWorking: true },
    friday: { start: '09:00', end: '17:00', isWorking: true },
    saturday: { start: '09:00', end: '15:00', isWorking: true },
    sunday: { start: '10:00', end: '14:00', isWorking: false },
  };
}

export const getStylists = async (): Promise<Stylist[]> => {
  const db = await getDb();
  const stylists = await db
    .select()
    .from(schema.stylists)
    .where(eq(schema.stylists.isActive, true))
    .orderBy(asc(schema.stylists.name));
  const allCategories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));

  return stylists.map(stylist => {
    let workingHours = getDefaultWorkingHours();
    if (
      stylist.workingHours &&
      typeof stylist.workingHours === 'object' &&
      !Array.isArray(stylist.workingHours)
    ) {
      workingHours = stylist.workingHours as any;
    }

    const specialtyCategoryIds = Array.isArray(stylist.specialties)
      ? (stylist.specialties as string[])
      : [];

    return {
      ...stylist,
      email: stylist.email ?? undefined,
      bio: stylist.bio ?? undefined,
      avatar: stylist.avatar ?? undefined,
      specialties: specialtyCategoryIds
        .map(categoryId => allCategories.find(c => c.id === categoryId))
        .filter(Boolean)
        .map(cat => ({ ...cat!, items: [] })) as ServiceCategory[],
      workingHours,
      blockedDates:
        stylist.blockedDates && Array.isArray(stylist.blockedDates)
          ? (stylist.blockedDates as string[])
          : [],
      googleAccessToken: stylist.googleAccessToken ?? undefined,
      googleRefreshToken: stylist.googleRefreshToken ?? undefined,
      googleTokenExpiry: stylist.googleTokenExpiry ?? undefined,
      googleCalendarId: stylist.googleCalendarId ?? undefined,
      googleEmail: stylist.googleEmail ?? undefined,
    };
  });
};

export const getStylistById = async (id: string): Promise<Stylist | null> => {
  const db = await getDb();
  const result = await db.select().from(schema.stylists).where(eq(schema.stylists.id, id)).limit(1);
  const stylist = result[0];

  if (!stylist) return null;

  const allCategories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));

  let workingHours = getDefaultWorkingHours();
  if (
    stylist.workingHours &&
    typeof stylist.workingHours === 'object' &&
    !Array.isArray(stylist.workingHours)
  ) {
    workingHours = stylist.workingHours as any;
  }

  const specialtyCategoryIds = Array.isArray(stylist.specialties)
    ? (stylist.specialties as string[])
    : [];

  return {
    ...stylist,
    email: stylist.email ?? undefined,
    bio: stylist.bio ?? undefined,
    avatar: stylist.avatar ?? undefined,
    specialties: specialtyCategoryIds
      .map(categoryId => allCategories.find(c => c.id === categoryId))
      .filter(Boolean)
      .map(cat => ({ ...cat!, items: [] })) as ServiceCategory[],
    workingHours,
    blockedDates:
      stylist.blockedDates && Array.isArray(stylist.blockedDates)
        ? (stylist.blockedDates as string[])
        : [],
    googleAccessToken: stylist.googleAccessToken ?? undefined,
    googleRefreshToken: stylist.googleRefreshToken ?? undefined,
    googleTokenExpiry: stylist.googleTokenExpiry ?? undefined,
    googleCalendarId: stylist.googleCalendarId ?? undefined,
    googleEmail: stylist.googleEmail ?? undefined,
  };
};

export const createStylist = async (stylistData: {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  specialtyCategoryIds: string[];
  workingHours?: Stylist['workingHours'];
  blockedDates?: string[];
  userId?: string;
}): Promise<Stylist> => {
  const db = await getDb();
  const defaultHours = getDefaultWorkingHours();

  // Insert stylist record FIRST, then update user role if successful
  // This prevents inconsistent state where user role is STYLIST but no stylist record exists
  const now = new Date();
  const result = await db
    .insert(schema.stylists)
    .values({
      name: stylistData.name,
      email: stylistData.email || null,
      bio: stylistData.bio,
      avatar: stylistData.avatar,
      specialties: stylistData.specialtyCategoryIds,
      workingHours: stylistData.workingHours || defaultHours,
      blockedDates: stylistData.blockedDates || [],
      userId: stylistData.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Only update user role AFTER stylist record is successfully created
  if (stylistData.userId) {
    await db
      .update(schema.users)
      .set({ roles: ['STYLIST'], updatedAt: new Date() })
      .where(eq(schema.users.id, stylistData.userId));
  }

  const newStylist = result[0];
  const allCategories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));

  return {
    ...newStylist,
    email: newStylist.email ?? undefined,
    bio: newStylist.bio ?? undefined,
    avatar: newStylist.avatar ?? undefined,
    specialties: stylistData.specialtyCategoryIds
      .map(categoryId => allCategories.find(c => c.id === categoryId))
      .filter(Boolean)
      .map(cat => ({ ...cat!, items: [] })) as ServiceCategory[],
    workingHours: (newStylist.workingHours as any) || defaultHours,
    blockedDates:
      newStylist.blockedDates && Array.isArray(newStylist.blockedDates)
        ? (newStylist.blockedDates as string[])
        : [],
    googleAccessToken: newStylist.googleAccessToken ?? undefined,
    googleRefreshToken: newStylist.googleRefreshToken ?? undefined,
    googleTokenExpiry: newStylist.googleTokenExpiry ?? undefined,
    googleCalendarId: newStylist.googleCalendarId ?? undefined,
    googleEmail: newStylist.googleEmail ?? undefined,
  };
};

export const updateStylist = async (
  id: string,
  updateData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    specialtyCategoryIds?: string[];
    workingHours?: Stylist['workingHours'];
    blockedDates?: string[];
    isActive?: boolean;
  },
): Promise<Stylist> => {
  const db = await getDb();
  const updatePayload: any = { updatedAt: new Date() };

  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.email !== undefined) updatePayload.email = updateData.email;
  if (updateData.bio !== undefined) updatePayload.bio = updateData.bio;
  if (updateData.avatar !== undefined) updatePayload.avatar = updateData.avatar;
  if (updateData.specialtyCategoryIds !== undefined)
    updatePayload.specialties = updateData.specialtyCategoryIds;
  if (updateData.workingHours !== undefined) updatePayload.workingHours = updateData.workingHours;
  if (updateData.blockedDates !== undefined) updatePayload.blockedDates = updateData.blockedDates;
  if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

  const result = await db
    .update(schema.stylists)
    .set(updatePayload)
    .where(eq(schema.stylists.id, id))
    .returning();
  const updatedStylist = result[0];

  const allCategories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));
  const specialtyCategoryIds = Array.isArray(updatedStylist.specialties)
    ? (updatedStylist.specialties as string[])
    : [];

  return {
    ...updatedStylist,
    email: updatedStylist.email ?? undefined,
    bio: updatedStylist.bio ?? undefined,
    avatar: updatedStylist.avatar ?? undefined,
    specialties: specialtyCategoryIds
      .map(categoryId => allCategories.find(c => c.id === categoryId))
      .filter(Boolean)
      .map(cat => ({ ...cat!, items: [] })) as ServiceCategory[],
    workingHours: (updatedStylist.workingHours as any) || getDefaultWorkingHours(),
    blockedDates:
      updatedStylist.blockedDates && Array.isArray(updatedStylist.blockedDates)
        ? (updatedStylist.blockedDates as string[])
        : [],
    googleAccessToken: updatedStylist.googleAccessToken ?? undefined,
    googleRefreshToken: updatedStylist.googleRefreshToken ?? undefined,
    googleTokenExpiry: updatedStylist.googleTokenExpiry ?? undefined,
    googleCalendarId: updatedStylist.googleCalendarId ?? undefined,
    googleEmail: updatedStylist.googleEmail ?? undefined,
  };
};

export const deleteStylist = async (id: string): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.stylists)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(schema.stylists.id, id));
};

/**
 * Get stylist profile by linked user ID
 */
export const getStylistByUserId = async (userId: string): Promise<Stylist | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.stylists)
    .where(eq(schema.stylists.userId, userId))
    .limit(1);
  const stylist = result[0];

  if (!stylist) return null;

  const allCategories = await db
    .select()
    .from(schema.serviceCategories)
    .orderBy(asc(schema.serviceCategories.sortOrder));

  let workingHours = getDefaultWorkingHours();
  if (
    stylist.workingHours &&
    typeof stylist.workingHours === 'object' &&
    !Array.isArray(stylist.workingHours)
  ) {
    workingHours = stylist.workingHours as any;
  }

  const specialtyCategoryIds = Array.isArray(stylist.specialties)
    ? (stylist.specialties as string[])
    : [];

  return {
    ...stylist,
    email: stylist.email ?? undefined,
    bio: stylist.bio ?? undefined,
    avatar: stylist.avatar ?? undefined,
    specialties: specialtyCategoryIds
      .map(categoryId => allCategories.find(c => c.id === categoryId))
      .filter(Boolean)
      .map(cat => ({ ...cat!, items: [] })) as ServiceCategory[],
    workingHours,
    blockedDates:
      stylist.blockedDates && Array.isArray(stylist.blockedDates)
        ? (stylist.blockedDates as string[])
        : [],
    googleAccessToken: stylist.googleAccessToken ?? undefined,
    googleRefreshToken: stylist.googleRefreshToken ?? undefined,
    googleTokenExpiry: stylist.googleTokenExpiry ?? undefined,
    googleCalendarId: stylist.googleCalendarId ?? undefined,
    googleEmail: stylist.googleEmail ?? undefined,
  };
};

/**
 * Update Google OAuth tokens for a stylist
 */
export const updateStylistGoogleTokens = async (
  stylistId: string,
  tokens: {
    googleAccessToken: string;
    googleRefreshToken: string;
    googleTokenExpiry: Date;
    googleCalendarId: string;
    googleEmail: string;
  },
): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.stylists)
    .set({
      googleAccessToken: tokens.googleAccessToken,
      googleRefreshToken: tokens.googleRefreshToken,
      googleTokenExpiry: tokens.googleTokenExpiry,
      googleCalendarId: tokens.googleCalendarId,
      googleEmail: tokens.googleEmail,
      updatedAt: new Date(),
    })
    .where(eq(schema.stylists.id, stylistId));
};

/**
 * Clear Google OAuth tokens for a stylist (disconnect)
 */
export const clearStylistGoogleTokens = async (stylistId: string): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.stylists)
    .set({
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleCalendarId: null,
      googleEmail: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.stylists.id, stylistId));
};

export const getStylistsForCategory = async (categoryId: string): Promise<Stylist[]> => {
  const stylists = await getStylists();
  return stylists.filter(stylist =>
    stylist.specialties.some(specialty => specialty.id === categoryId),
  );
};

// --- USER PROFILE ---

export const updateUserProfile = async (
  userId: string,
  updates: { name?: string },
): Promise<User> => {
  const db = await getDb();
  const result = await db
    .update(schema.users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();
  const updatedUser = result[0];

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    roles: updatedUser.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: (updatedUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
  };
};

export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  const db = await getDb();
  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.userId, userId))
    .orderBy(desc(schema.appointments.date), desc(schema.appointments.time));
  const stylists = await db.select().from(schema.stylists);

  return appointments.map(appointment => {
    const stylist = stylists.find(s => s.id === appointment.stylistId);
    return {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      services: Array.isArray(appointment.services)
        ? (appointment.services as unknown as Service[])
        : [],
      stylistId: appointment.stylistId,
      stylist: stylist
        ? { id: stylist.id, name: stylist.name, email: stylist.email ?? undefined }
        : undefined,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      totalPrice: appointment.totalPrice,
      totalDuration: appointment.totalDuration,
      calendarEventId: appointment.calendarEventId,
      userId: appointment.userId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  });
};

export const getUserAppointmentById = async (
  appointmentId: string,
  userId: string,
): Promise<Appointment | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.appointments)
    .where(and(eq(schema.appointments.id, appointmentId), eq(schema.appointments.userId, userId)))
    .limit(1);

  const appointment = result[0];
  if (!appointment) return null;

  const stylistResult = appointment.stylistId
    ? await db
        .select()
        .from(schema.stylists)
        .where(eq(schema.stylists.id, appointment.stylistId))
        .limit(1)
    : [];
  const stylist = stylistResult[0];

  return {
    id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId,
    stylist: stylist
      ? { id: stylist.id, name: stylist.name, email: stylist.email ?? undefined }
      : undefined,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    totalPrice: appointment.totalPrice,
    totalDuration: appointment.totalDuration,
    calendarEventId: appointment.calendarEventId,
    userId: appointment.userId,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
};

export const deleteAppointment = async (appointmentId: string): Promise<void> => {
  const db = await getDb();
  await db.delete(schema.appointments).where(eq(schema.appointments.id, appointmentId));
};

// --- RESCHEDULING ---

export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: Date,
  newTime: string,
): Promise<Appointment> => {
  const db = await getDb();

  const existingResult = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, appointmentId))
    .limit(1);
  const existingAppointment = existingResult[0];

  if (!existingAppointment) {
    throw new Error('Appointment not found');
  }

  const now = new Date();
  const appointmentDateTime = new Date(`${newDate.toISOString().split('T')[0]}T${newTime}:00`);
  const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < 2) {
    throw new Error('Please provide at least 2 hours advance notice for rescheduling');
  }

  const settings = await getAdminSettings();
  const dateKey = dateToKey(newDate);

  const fullDayClosure = settings.specialClosures.find(
    closure => closure.date === dateKey && closure.isFullDay,
  );
  if (fullDayClosure) {
    throw new Error('The store is closed on this date');
  }

  const dayOfWeek = newDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = settings.weeklySchedule[dayOfWeek as keyof typeof settings.weeklySchedule];

  if (!daySchedule || !daySchedule.isOpen) {
    throw new Error('The store is closed on this day');
  }

  if (newTime < daySchedule.openingTime || newTime >= daySchedule.closingTime) {
    throw new Error(
      `Appointments are only available between ${daySchedule.openingTime} and ${daySchedule.closingTime} on ${dayOfWeek}s`,
    );
  }

  // Check availability
  const requiredSlots = Math.ceil(existingAppointment.totalDuration / 30);
  let availableSlots: string[];

  if (existingAppointment.stylistId) {
    availableSlots = await getStylistAvailability(newDate, existingAppointment.stylistId);
  } else {
    availableSlots = await getAvailability(newDate);
  }

  const startIndex = availableSlots.indexOf(newTime);
  if (startIndex === -1) {
    throw new Error('Selected time slot is not available');
  }

  for (let i = 0; i < requiredSlots; i++) {
    const neededTime = new Date(`1970-01-01T${newTime}:00`);
    neededTime.setMinutes(neededTime.getMinutes() + i * 30);
    const neededTimeStr = neededTime.toTimeString().substring(0, 5);

    if (!availableSlots.includes(neededTimeStr)) {
      throw new Error(
        `Not enough consecutive time slots available. Need ${requiredSlots * 30} minutes.`,
      );
    }
  }

  return await updateAppointment(appointmentId, {
    date: newDate,
    time: newTime,
    customerName: existingAppointment.customerName,
    customerEmail: existingAppointment.customerEmail,
    services: existingAppointment.services as any,
    totalPrice: existingAppointment.totalPrice,
    totalDuration: existingAppointment.totalDuration,
  });
};

// --- REMINDERS ---

/**
 * Check if appointment services include men's haircut
 * Used for filtering reminders - men's haircut is typically a recurring service
 */
const hasMensHaircut = (services: unknown): boolean => {
  if (!Array.isArray(services)) return false;
  return services.some(
    (service: any) =>
      typeof service?.name === 'string' &&
      service.name.toLowerCase().includes('haircut') &&
      service.name.toLowerCase().includes('men'),
  );
};

export const getUpcomingAppointmentsForReminders = async (
  hoursAhead: number = 24,
): Promise<Appointment[]> => {
  const db = await getDb();
  const now = new Date();
  const reminderTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const startWindow = new Date(reminderTime.getTime() - 60 * 60 * 1000);
  const endWindow = new Date(reminderTime.getTime() + 60 * 60 * 1000);

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        gte(schema.appointments.date, startWindow),
        lt(schema.appointments.date, endWindow),
        not(isNull(schema.appointments.userId)),
      ),
    );

  // Filter: only include appointments with men's haircut (recurring service)
  const haircutAppointments = appointments.filter(apt => hasMensHaircut(apt.services));

  const userIds = Array.from(
    new Set(haircutAppointments.map(a => a.userId).filter(Boolean)),
  ) as string[];
  const users =
    userIds.length > 0
      ? await db
          .select()
          .from(schema.users)
          .where(sql`${schema.users.id} IN ${userIds}`)
      : [];

  const stylistIds = Array.from(
    new Set(haircutAppointments.map(a => a.stylistId).filter(Boolean)),
  ) as string[];
  const stylists =
    stylistIds.length > 0
      ? await db
          .select()
          .from(schema.stylists)
          .where(sql`${schema.stylists.id} IN ${stylistIds}`)
      : [];

  return haircutAppointments.map(appointment => {
    const user = users.find(u => u.id === appointment.userId);
    const stylist = stylists.find(s => s.id === appointment.stylistId);

    return {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      services: Array.isArray(appointment.services)
        ? (appointment.services as unknown as Service[])
        : [],
      stylistId: appointment.stylistId,
      stylist: stylist
        ? { id: stylist.id, name: stylist.name, email: stylist.email ?? undefined }
        : undefined,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      totalPrice: appointment.totalPrice,
      totalDuration: appointment.totalDuration,
      calendarEventId: appointment.calendarEventId,
      userId: appointment.userId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            authProvider: user.authProvider as 'whatsapp' | 'telegram' | 'email',
            telegramId: user.telegramId ?? undefined,
            whatsappPhone: user.whatsappPhone ?? undefined,
            roles: user.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
            avatar: user.avatar ?? undefined,
          }
        : undefined,
    };
  });
};

export const markReminderSent = async (appointmentId: string): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.appointments)
    .set({ updatedAt: new Date() })
    .where(eq(schema.appointments.id, appointmentId));
};

// Re-export retention service function
export { markAppointmentCompleted } from '../services/retentionService';

export const getUnsyncedAppointments = async (): Promise<Appointment[]> => {
  const db = await getDb();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        isNull(schema.appointments.calendarEventId),
        gte(schema.appointments.createdAt, twoDaysAgo),
        gte(schema.appointments.date, new Date()),
      ),
    );

  const allServices = await getServices();
  const stylists = await db.select().from(schema.stylists);

  return appointments.map(apt => {
    const stylist = stylists.find(s => s.id === apt.stylistId);
    return {
      ...apt,
      services: Array.isArray(apt.services) ? (apt.services as unknown as Service[]) : [],
      stylistId: apt.stylistId ?? undefined,
      stylist: stylist
        ? {
            ...stylist,
            email: stylist.email ?? undefined,
            bio: stylist.bio ?? undefined,
            avatar: stylist.avatar ?? undefined,
            specialties: Array.isArray(stylist.specialties)
              ? ((stylist.specialties as any[])
                  .map(id => allServices.find(s => s.id === normalizeServiceId(id)))
                  .filter(Boolean) as Service[])
              : [],
            workingHours: (stylist.workingHours as any) || getDefaultWorkingHours(),
            blockedDates:
              stylist.blockedDates && Array.isArray(stylist.blockedDates)
                ? (stylist.blockedDates as string[])
                : [],
          }
        : undefined,
      calendarEventId: apt.calendarEventId ?? undefined,
      categoryId: apt.categoryId ?? undefined,
      estimatedDuration: apt.estimatedDuration ?? undefined,
    };
  });
};

export const getUsersForRebookingReminders = async (daysAgo: number = 28): Promise<User[]> => {
  const db = await getDb();
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  // This is a simplified version - complex subqueries need raw SQL in Drizzle
  const appointments = await db.select().from(schema.appointments);
  const users = await db.select().from(schema.users);

  const usersWithRecentAppointments = users.filter(user => {
    const userAppointments = appointments.filter(a => a.userId === user.id);
    const hasAppointmentOnTargetDate = userAppointments.some(
      a => dateToKey(a.date) === dateToKey(targetDate),
    );
    const hasLaterAppointment = userAppointments.some(a => a.date > targetDate);
    return hasAppointmentOnTargetDate && !hasLaterAppointment;
  });

  return usersWithRecentAppointments.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles as ('CUSTOMER' | 'STYLIST' | 'ADMIN')[],
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  }));
};

export const getLastAppointmentByUserId = async (userId: string): Promise<Appointment | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.userId, userId))
    .orderBy(desc(schema.appointments.date))
    .limit(1);

  const appointment = result[0];
  if (!appointment) return null;

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  };
};

// --- CALENDAR TOKEN MANAGEMENT ---

/**
 * Mark a stylist's Google token as invalid (for reconnection reminders)
 */
export const markStylistTokenInvalid = async (
  stylistId: string,
  invalid: boolean = true,
): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.stylists)
    .set({
      googleTokenInvalid: invalid,
      updatedAt: new Date(),
    })
    .where(eq(schema.stylists.id, stylistId));
};

/**
 * Update the last calendar reminder sent timestamp for a stylist
 */
export const updateLastCalendarReminderSent = async (stylistId: string): Promise<void> => {
  const db = await getDb();
  await db
    .update(schema.stylists)
    .set({
      lastCalendarReminderSent: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.stylists.id, stylistId));
};

/**
 * Get stylists with invalid tokens that need reconnection reminders
 * Only returns stylists who:
 * 1. Have googleTokenInvalid = true
 * 2. Have a connected user account (for messaging)
 * 3. Haven't received a reminder in the last 24 hours
 */
export const getStylistsNeedingCalendarReminders = async (): Promise<
  Array<{
    stylist: Stylist;
    user: User;
  }>
> => {
  const db = await getDb();

  // Get stylists with invalid tokens
  const stylistsWithInvalidTokens = await db
    .select()
    .from(schema.stylists)
    .where(
      and(
        eq(schema.stylists.googleTokenInvalid, true),
        eq(schema.stylists.isActive, true),
        not(isNull(schema.stylists.userId)),
      ),
    );

  const results: Array<{ stylist: Stylist; user: User }> = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const stylistRow of stylistsWithInvalidTokens) {
    // Skip if reminder was sent less than 24 hours ago
    if (stylistRow.lastCalendarReminderSent && stylistRow.lastCalendarReminderSent > oneDayAgo) {
      continue;
    }

    // Get the linked user
    if (!stylistRow.userId) continue;
    const user = await findUserById(stylistRow.userId);
    if (!user) continue;

    // Map services (we don't need full specialties for this use case)
    const allServices = await getServices();
    const specialtyServices = Array.isArray(stylistRow.specialties)
      ? ((stylistRow.specialties as any[])
          .map(id => allServices.find(s => s.id === normalizeServiceId(id)))
          .filter(Boolean) as Service[])
      : [];

    const stylist: Stylist = {
      id: stylistRow.id,
      name: stylistRow.name,
      email: stylistRow.email ?? undefined,
      bio: stylistRow.bio ?? undefined,
      avatar: stylistRow.avatar ?? undefined,
      specialties: [], // Not needed for reminders
      workingHours: (stylistRow.workingHours as any) || {},
      blockedDates: (stylistRow.blockedDates as string[]) ?? [],
      isActive: stylistRow.isActive,
      userId: stylistRow.userId,
      googleAccessToken: stylistRow.googleAccessToken ?? undefined,
      googleRefreshToken: stylistRow.googleRefreshToken ?? undefined,
      googleTokenExpiry: stylistRow.googleTokenExpiry ?? undefined,
      googleCalendarId: stylistRow.googleCalendarId ?? undefined,
      googleEmail: stylistRow.googleEmail ?? undefined,
      googleTokenInvalid: stylistRow.googleTokenInvalid,
      lastCalendarReminderSent: stylistRow.lastCalendarReminderSent,
      createdAt: stylistRow.createdAt,
      updatedAt: stylistRow.updatedAt,
    };

    results.push({ stylist, user });
  }

  return results;
};

/**
 * Get a stylist with their linked user for messaging
 */
export const getStylistWithUser = async (
  stylistId: string,
): Promise<{ stylist: Stylist; user: User } | null> => {
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.stylists)
    .where(eq(schema.stylists.id, stylistId))
    .limit(1);

  const stylistRow = result[0];
  if (!stylistRow || !stylistRow.userId) return null;

  const user = await findUserById(stylistRow.userId);
  if (!user) return null;

  const stylist: Stylist = {
    id: stylistRow.id,
    name: stylistRow.name,
    email: stylistRow.email ?? undefined,
    bio: stylistRow.bio ?? undefined,
    avatar: stylistRow.avatar ?? undefined,
    specialties: [],
    workingHours: (stylistRow.workingHours as any) || {},
    blockedDates: (stylistRow.blockedDates as string[]) ?? [],
    isActive: stylistRow.isActive,
    userId: stylistRow.userId,
    googleAccessToken: stylistRow.googleAccessToken ?? undefined,
    googleRefreshToken: stylistRow.googleRefreshToken ?? undefined,
    googleTokenExpiry: stylistRow.googleTokenExpiry ?? undefined,
    googleCalendarId: stylistRow.googleCalendarId ?? undefined,
    googleEmail: stylistRow.googleEmail ?? undefined,
    googleTokenInvalid: stylistRow.googleTokenInvalid,
    lastCalendarReminderSent: stylistRow.lastCalendarReminderSent,
    createdAt: stylistRow.createdAt,
    updatedAt: stylistRow.updatedAt,
  };

  return { stylist, user };
};

// --- CRON JOBS ---

export const cleanupPendingAppointments = async (): Promise<number> => {
  const db = await getDb();
  // 15 minutes ago
  const cutoffTime = new Date(Date.now() - 15 * 60 * 1000);

  try {
    const result = await db
      .update(schema.appointments)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(
        and(
          eq(schema.appointments.status, 'PENDING_PAYMENT'),
          lt(schema.appointments.createdAt, cutoffTime),
        ),
      )
      .returning();

    return result.length;
  } catch (error) {
    console.error('Failed to cleanup pending appointments:', error);
    return 0;
  }
};
