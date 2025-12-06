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
} from '../types';
import { prisma } from './prisma';
import { unstable_cache } from 'next/cache';

/**
 * DATABASE FUNCTIONS USING PRISMA + NEON
 * Persistent PostgreSQL database for production use
 */

// Cache tags for on-demand revalidation
const CACHE_TAGS = {
  SERVICE_CATEGORIES: 'service-categories',
  SERVICES: 'services',
  SERVICE_BY_ID: (id: string) => `service-${id}`,
  CATEGORY_BY_ID: (id: string) => `category-${id}`,
  STYLISTS: 'stylists',
  STYLIST_BY_ID: (id: string) => `stylist-${id}`,
} as const;

// Helper to normalize service ID for comparison (handles both string and number IDs)
const normalizeServiceId = (id: any): string => String(id);

// Initialize default admin user and settings on first run
async function initializeDatabase() {
  try {
    // Check if any admin user exists
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('⚠️  No admin user found. To create an admin:');
      console.log('1. Login via WhatsApp/Telegram OAuth first');
      console.log('2. Run: npm run create-admin <your-email>');
      console.log('3. This will promote your user to admin role');
    }

    // Check if admin settings exist
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      await prisma.adminSettings.create({
        data: {
          weeklySchedule: getDefaultWeeklySchedule() as any,
          closedDates: [],
          blockedSlots: {},
          businessName: 'Signature Trims Hair Salon',
          businessAddress: '930 Yishun Avenue 1 #01-127, Singapore 760930',
          businessPhone: '(555) 123-4567',
        },
      });
    }

    // Services are now seeded via prisma/seed.ts
    // No need to initialize here
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize on module load
initializeDatabase();

// --- HELPERS ---
const dateToKey = (date: Date) => date.toISOString().split('T')[0];

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

// --- PUBLIC API for the database module ---

// User Management
export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

export const findUserByTelegramId = async (telegramId: number): Promise<User | null> => {
  const user = await prisma.user.findFirst({
    where: { telegramId },
  });

  if (!user) return null;

  return {
    ...user,
    role: user.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };
};

export const findUserById = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    ...user,
    role: user.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  };
};

export const createUserFromOAuth = async (userData: Omit<User, 'id' | 'role'>): Promise<User> => {
  // First, check by whatsappPhone if it's a WhatsApp login
  let existingUser = null;

  if (userData.authProvider === 'whatsapp' && userData.whatsappPhone) {
    existingUser = await prisma.user.findFirst({
      where: { whatsappPhone: userData.whatsappPhone },
    });
  } else if (userData.authProvider === 'telegram' && userData.telegramId) {
    existingUser = await prisma.user.findFirst({
      where: { telegramId: userData.telegramId },
    });
  }

  // Fallback to email check
  if (!existingUser) {
    existingUser = await findUserByEmail(userData.email);
  }

  if (existingUser) {
    // For returning users: only update fields that should change
    const updateData: any = {
      authProvider: userData.authProvider,
    };

    // Update phone/telegram ID if provided
    if (userData.whatsappPhone) {
      updateData.whatsappPhone = userData.whatsappPhone;
    }
    if (userData.telegramId) {
      updateData.telegramId = userData.telegramId;
    }
    if (userData.avatar) {
      updateData.avatar = userData.avatar;
    }

    // Only update name if:
    // 1. User provided a new name AND
    // 2. It's not the fallback name pattern (WhatsApp User XXXX or User XXXX)
    const isFallbackName =
      userData.name &&
      (userData.name.startsWith('WhatsApp User') || userData.name.startsWith('User '));

    if (userData.name && !isFallbackName) {
      updateData.name = userData.name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
    });

    return {
      ...updatedUser,
      role: updatedUser.role as 'CUSTOMER' | 'ADMIN',
      authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
      telegramId: updatedUser.telegramId ?? undefined,
      whatsappPhone: updatedUser.whatsappPhone ?? undefined,
      avatar: updatedUser.avatar ?? undefined,
    };
  }

  // New user creation
  const newUser = await prisma.user.create({
    data: {
      name: userData.name || `User ${userData.whatsappPhone?.slice(-4) || 'Unknown'}`,
      email: userData.email.toLowerCase(),
      role: 'CUSTOMER',
      authProvider: userData.authProvider,
      telegramId: userData.telegramId,
      whatsappPhone: userData.whatsappPhone,
      avatar: userData.avatar,
    },
  });

  return {
    ...newUser,
    role: newUser.role as 'CUSTOMER' | 'ADMIN',
    authProvider: newUser.authProvider as 'whatsapp' | 'telegram' | undefined,
    telegramId: newUser.telegramId ?? undefined,
    whatsappPhone: newUser.whatsappPhone ?? undefined,
    avatar: newUser.avatar ?? undefined,
  };
};

export const promoteUserToAdmin = async (email: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new Error('User not found. Please login via WhatsApp/Telegram first.');
  }

  const updatedUser = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: 'ADMIN' },
  });

  return {
    ...updatedUser,
    role: updatedUser.role as 'CUSTOMER' | 'ADMIN',
    authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
  };
};

// Service Management
export const getServices = unstable_cache(
  async (): Promise<Service[]> => {
    const services = await prisma.service.findMany({
      where: { isActive: true },
    });
    return services.map(s => ({
      ...s,
      subtitle: s.subtitle ?? undefined,
      description: s.description ?? undefined,
      maxPrice: s.maxPrice ?? undefined,
      imageUrl: s.imageUrl ?? undefined,
    }));
  },
  ['services'],
  {
    tags: [CACHE_TAGS.SERVICES],
    revalidate: false,
  },
);

export const getServiceCategories = unstable_cache(
  async (): Promise<ServiceCategory[]> => {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        items: {
          where: { isActive: true },
          include: {
            addons: true,
            serviceTags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

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
      items: cat.items.map(s => ({
        ...s,
        subtitle: s.subtitle ?? undefined,
        description: s.description ?? undefined,
        maxPrice: s.maxPrice ?? undefined,
        imageUrl: s.imageUrl ?? undefined,
        addons: s.addons?.map(a => ({
          ...a,
          description: a.description ?? undefined,
          benefits: (a.benefits as string[]) ?? undefined,
        })),
      })),
    }));
  },
  ['service-categories'],
  {
    tags: [CACHE_TAGS.SERVICE_CATEGORIES],
    revalidate: false,
  },
);

export async function getServiceById(id: string): Promise<Service | null> {
  const getCachedService = unstable_cache(
    async () => {
      const service = await prisma.service.findUnique({
        where: { id },
        include: {
          addons: true,
        },
      });

      if (!service) return null;

      return {
        ...service,
        subtitle: service.subtitle ?? undefined,
        description: service.description ?? undefined,
        maxPrice: service.maxPrice ?? undefined,
        imageUrl: service.imageUrl ?? undefined,
        addons: service.addons?.map(a => ({
          ...a,
          description: a.description ?? undefined,
          benefits: (a.benefits as string[]) ?? undefined,
        })),
      };
    },
    ['service', id],
    {
      tags: [CACHE_TAGS.SERVICE_BY_ID(id), CACHE_TAGS.SERVICES],
      revalidate: false,
    },
  );

  return getCachedService();
}

// Appointment Management
export const getAppointments = async (): Promise<Appointment[]> => {
  const appointments = await prisma.appointment.findMany({
    include: {
      stylist: true,
      category: true, // Include category relation
    },
    orderBy: { date: 'asc' },
  });

  const allServices = await getServices();

  return appointments.map(apt => ({
    ...apt,
    services: Array.isArray(apt.services) ? (apt.services as unknown as Service[]) : [],
    stylistId: apt.stylistId ?? undefined,
    stylist: apt.stylist
      ? {
          ...apt.stylist,
          email: apt.stylist.email ?? undefined,
          bio: apt.stylist.bio ?? undefined,
          avatar: apt.stylist.avatar ?? undefined,
          specialties: Array.isArray(apt.stylist.specialties)
            ? ((apt.stylist.specialties as any[])
                .map(id => allServices.find(s => s.id === normalizeServiceId(id)))
                .filter(Boolean) as Service[])
            : [],
          workingHours: (apt.stylist.workingHours as any) || getDefaultWorkingHours(),
          blockedDates:
            apt.stylist.blockedDates && Array.isArray(apt.stylist.blockedDates)
              ? (apt.stylist.blockedDates as string[])
              : [],
        }
      : undefined,
    calendarEventId: apt.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: apt.categoryId ?? undefined,
    category: apt.category
      ? {
          ...apt.category,
          shortTitle: apt.category.shortTitle ?? undefined,
          description: apt.category.description ?? undefined,
          icon: apt.category.icon ?? undefined,
          priceRangeMin: apt.category.priceRangeMin ?? undefined,
          priceRangeMax: apt.category.priceRangeMax ?? undefined,
          priceNote: apt.category.priceNote ?? undefined,
          estimatedDuration: apt.category.estimatedDuration ?? undefined,
          isFeatured: apt.category.isFeatured ?? undefined,
          imageUrl: apt.category.imageUrl ?? undefined,
          illustrationUrl: apt.category.illustrationUrl ?? undefined,
          items: [], // Don't load all services for appointments
        }
      : undefined,
    estimatedDuration: apt.estimatedDuration ?? undefined,
  }));
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

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const settings = await prisma.adminSettings.findFirst();
  if (!settings) {
    // Return default settings if none exist
    return {
      weeklySchedule: getDefaultWeeklySchedule(),
      specialClosures: [],
      blockedSlots: {},
      businessName: 'Signature Trims Hair Salon',
      businessAddress: '930 Yishun Avenue 1 #01-127, Singapore 760930',
      businessPhone: '(555) 123-4567',
    };
  }

  // Migrate legacy closedDates (string[]) to specialClosures (BlockedPeriod[])
  let specialClosures: BlockedPeriod[] = [];
  if (settings.closedDates && Array.isArray(settings.closedDates)) {
    const rawClosures = settings.closedDates as any[];
    specialClosures = rawClosures
      .map(item => {
        // If it's already a BlockedPeriod object, use it
        if (typeof item === 'object' && item !== null && 'date' in item) {
          return item as BlockedPeriod;
        }
        // If it's a legacy string date, convert to full-day closure
        if (typeof item === 'string') {
          return {
            date: item,
            isFullDay: true,
            reason: undefined,
          };
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
  };
};

export const updateAdminSettings = async (
  newSettings: Partial<AdminSettings>,
): Promise<AdminSettings> => {
  const existingSettings = await prisma.adminSettings.findFirst();
  const currentSettings = await getAdminSettings();

  if (existingSettings) {
    const updated = await prisma.adminSettings.update({
      where: { id: existingSettings.id },
      data: {
        weeklySchedule: (newSettings.weeklySchedule ?? currentSettings.weeklySchedule) as any,
        closedDates: (newSettings.specialClosures ?? currentSettings.specialClosures) as any,
        businessName: newSettings.businessName ?? existingSettings.businessName,
        businessAddress: newSettings.businessAddress ?? existingSettings.businessAddress,
        businessPhone: newSettings.businessPhone ?? existingSettings.businessPhone,
        blockedSlots: (newSettings.blockedSlots ?? currentSettings.blockedSlots) as any,
      },
    });

    return await getAdminSettings();
  } else {
    await prisma.adminSettings.create({
      data: {
        weeklySchedule: (newSettings.weeklySchedule ?? getDefaultWeeklySchedule()) as any,
        closedDates: (newSettings.specialClosures ?? []) as any,
        blockedSlots: (newSettings.blockedSlots ?? {}) as any,
        businessName: newSettings.businessName ?? 'Signature Trims Hair Salon',
        businessAddress:
          newSettings.businessAddress ?? '930 Yishun Avenue 1 #01-127, Singapore 760930',
        businessPhone: newSettings.businessPhone ?? '(555) 123-4567',
      },
    });

    return await getAdminSettings();
  }
};

export const getAvailability = async (date: Date): Promise<string[]> => {
  const settings = await getAdminSettings();
  const dateKey = dateToKey(date);

  // Check if date has a full-day closure
  const fullDayClosure = settings.specialClosures.find(
    closure => closure.date === dateKey && closure.isFullDay,
  );
  if (fullDayClosure) {
    return []; // Store is closed on this date
  }

  // Get day of week and check if store is open
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySchedule = settings.weeklySchedule[dayOfWeek as keyof typeof settings.weeklySchedule];

  if (!daySchedule || !daySchedule.isOpen) {
    return []; // Store is closed on this day of week
  }

  // Generate time slots based on day-specific hours
  const allSlots = generateTimeSlots(daySchedule.openingTime, daySchedule.closingTime);

  // Get booked appointments for this date
  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(dateKey + 'T00:00:00.000Z'),
        lt: new Date(dateKey + 'T23:59:59.999Z'),
      },
    },
  });

  const bookedSlots = new Set<string>();
  appointments.forEach(app => {
    let appTime = new Date(`1970-01-01T${app.time}:00`);
    const numSlots = Math.ceil(app.totalDuration / 30);
    for (let i = 0; i < numSlots; i++) {
      bookedSlots.add(appTime.toTimeString().substring(0, 5));
      appTime.setMinutes(appTime.getMinutes() + 30);
    }
  });

  const blockedByAdmin = new Set<string>(settings.blockedSlots[dateKey] || []);

  return allSlots.filter(slot => !bookedSlots.has(slot) && !blockedByAdmin.has(slot));
};

export const getStylistAvailability = async (date: Date, stylistId: string): Promise<string[]> => {
  const dateKey = dateToKey(date);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Get stylist information including working hours
  const stylist = await getStylistById(stylistId);
  if (!stylist || !stylist.isActive) {
    return []; // Inactive stylist has no availability
  }

  // Check if stylist has blocked this date (holidays/breaks)
  // Handle both string[] and BlockedPeriod[] formats
  const isDateBlocked = stylist.blockedDates?.some(d => {
    const dateStr = typeof d === 'string' ? d : d.date;
    return dateStr === dateKey;
  });
  if (isDateBlocked) {
    return []; // Stylist is not available on this date
  }

  // Check if stylist is working on this day
  if (!stylist.workingHours || typeof stylist.workingHours !== 'object') {
    console.warn(`Stylist ${stylistId} has invalid workingHours, falling back to salon hours`);
    // Fall back to salon's general availability instead of returning empty
    return await getAvailability(date);
  }

  const workingHours = stylist.workingHours[dayOfWeek as keyof typeof stylist.workingHours];
  if (!workingHours || !workingHours.isWorking) {
    return []; // Stylist doesn't work on this day
  }

  // Generate time slots based on stylist's working hours
  const stylistSlots = generateTimeSlots(workingHours.start, workingHours.end);

  // Get appointments for this stylist on this date
  const stylistAppointments = await prisma.appointment.findMany({
    where: {
      stylistId: stylistId,
      date: {
        gte: new Date(dateKey + 'T00:00:00.000Z'),
        lt: new Date(dateKey + 'T23:59:59.999Z'),
      },
    },
  });

  // Calculate booked slots for this stylist
  const bookedSlots = new Set<string>();
  stylistAppointments.forEach(app => {
    let appTime = new Date(`1970-01-01T${app.time}:00`);
    const numSlots = Math.ceil(app.totalDuration / 30);
    for (let i = 0; i < numSlots; i++) {
      bookedSlots.add(appTime.toTimeString().substring(0, 5));
      appTime.setMinutes(appTime.getMinutes() + 30);
    }
  });

  // Get admin blocked slots for this date
  const settings = await getAdminSettings();
  const blockedByAdmin = new Set<string>(settings.blockedSlots[dateKey] || []);

  // Return available slots for this stylist
  return stylistSlots.filter(slot => !bookedSlots.has(slot) && !blockedByAdmin.has(slot));
};

export const bookNewAppointment = async (
  appointmentData: CreateAppointmentInput,
): Promise<Appointment> => {
  const availableSlots = appointmentData.stylistId
    ? await getStylistAvailability(appointmentData.date, appointmentData.stylistId)
    : await getAvailability(appointmentData.date);

  // Determine if this is category-based or service-based booking
  const isCategoryBased = Boolean(appointmentData.categoryId);

  let totalPrice = 0;
  let totalDuration = 0;

  if (isCategoryBased && appointmentData.estimatedDuration) {
    // Category-based booking: use estimated duration, no upfront price
    totalDuration = appointmentData.estimatedDuration;
    totalPrice = 0; // Price TBD during appointment
  } else {
    // Legacy service-based booking: calculate from services
    const result = appointmentData.services.reduce(
      (acc, service) => {
        acc.totalPrice += service.basePrice;
        acc.totalDuration += service.duration;

        // Include selected add-ons in price and duration
        if (service.addons && Array.isArray(service.addons)) {
          service.addons.forEach(addon => {
            acc.totalPrice += addon.basePrice;
            // Add addon duration if it exists
            if (addon.duration) {
              acc.totalDuration += addon.duration;
            }
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

  for (let i = 0; i < numSlotsRequired; i++) {
    const slotToCheck = new Date(`1970-01-01T${appointmentData.time}:00`);
    slotToCheck.setMinutes(slotToCheck.getMinutes() + i * 30);
    const timeString = slotToCheck.toTimeString().substring(0, 5);
    if (!availableSlots.includes(timeString)) {
      throw new Error(
        `Booking conflict. Not enough consecutive slots available for the selected services.`,
      );
    }
  }

  const newAppointment = await prisma.appointment.create({
    data: {
      date: appointmentData.date,
      time: appointmentData.time,
      services: appointmentData.services as any,
      stylistId: appointmentData.stylistId,
      customerName: appointmentData.customerName,
      customerEmail: appointmentData.customerEmail,
      userId: appointmentData.userId, // Link to user account if available
      totalPrice,
      totalDuration,
      // Category-based fields (optional)
      categoryId: appointmentData.categoryId,
      estimatedDuration: appointmentData.estimatedDuration,
    },
    include: {
      stylist: true,
      category: true,
    },
  });

  const allServices = await getServices();

  return {
    ...newAppointment,
    services: Array.isArray(newAppointment.services)
      ? (newAppointment.services as unknown as Service[])
      : [],
    stylistId: newAppointment.stylistId ?? undefined,
    stylist: newAppointment.stylist
      ? {
          id: newAppointment.stylist.id,
          name: newAppointment.stylist.name,
          email: newAppointment.stylist.email ?? undefined,
        }
      : undefined,
    calendarEventId: newAppointment.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: newAppointment.categoryId ?? undefined,
    category: newAppointment.category
      ? {
          ...newAppointment.category,
          shortTitle: newAppointment.category.shortTitle ?? undefined,
          description: newAppointment.category.description ?? undefined,
          icon: newAppointment.category.icon ?? undefined,
          priceRangeMin: newAppointment.category.priceRangeMin ?? undefined,
          priceRangeMax: newAppointment.category.priceRangeMax ?? undefined,
          priceNote: newAppointment.category.priceNote ?? undefined,
          estimatedDuration: newAppointment.category.estimatedDuration ?? undefined,
          isFeatured: newAppointment.category.isFeatured ?? undefined,
          imageUrl: newAppointment.category.imageUrl ?? undefined,
          illustrationUrl: newAppointment.category.illustrationUrl ?? undefined,
          items: [], // Don't load all services for appointments
        }
      : undefined,
    estimatedDuration: newAppointment.estimatedDuration ?? undefined,
  };
};

export const cancelAppointment = async (details: {
  customerEmail: string;
  date: string;
  time: string;
}): Promise<Appointment> => {
  const { customerEmail, date, time } = details;

  const appointment = await prisma.appointment.findFirst({
    where: {
      customerEmail: { equals: customerEmail, mode: 'insensitive' },
      date: {
        gte: new Date(date + 'T00:00:00.000Z'),
        lt: new Date(date + 'T23:59:59.999Z'),
      },
      time: time,
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found. Please check the details provided.');
  }

  await prisma.appointment.delete({
    where: { id: appointment.id },
  });

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    // Category-based booking fields
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
  if (!updatedBlockedSlots[dateKey]) {
    updatedBlockedSlots[dateKey] = [];
  }
  if (!updatedBlockedSlots[dateKey].includes(time)) {
    updatedBlockedSlots[dateKey].push(time);
  }

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
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { calendarEventId },
  });
};

export const findAppointmentById = async (id: string): Promise<Appointment | null> => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) return null;

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  };
};

export const findAppointmentsByEmail = async (customerEmail: string): Promise<Appointment[]> => {
  const appointments = await prisma.appointment.findMany({
    where: {
      customerEmail: { equals: customerEmail, mode: 'insensitive' },
      date: { gte: new Date() }, // Only future appointments
    },
    include: {
      category: true,
      stylist: true,
    },
    orderBy: { date: 'asc' },
  });

  return appointments.map(appointment => ({
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
    // Convert null to undefined and cast for type compatibility
    category: (appointment.category ?? undefined) as ServiceCategory | undefined,
    stylist: (appointment.stylist ?? undefined) as Stylist | undefined,
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
  // Check if the updated time slot is available (excluding the current appointment)
  const availableSlots = await getAvailability(appointmentData.date);
  const numSlotsRequired = Math.ceil(appointmentData.totalDuration / 30);

  // Get existing appointments for this date excluding the current one
  const dateKey = dateToKey(appointmentData.date);
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(dateKey + 'T00:00:00.000Z'),
        lt: new Date(dateKey + 'T23:59:59.999Z'),
      },
      id: { not: id }, // Exclude current appointment
    },
  });

  const bookedSlots = new Set<string>();
  existingAppointments.forEach(app => {
    let appTime = new Date(`1970-01-01T${app.time}:00`);
    const numSlots = Math.ceil(app.totalDuration / 30);
    for (let i = 0; i < numSlots; i++) {
      bookedSlots.add(appTime.toTimeString().substring(0, 5));
      appTime.setMinutes(appTime.getMinutes() + 30);
    }
  });

  // Check if the new time slots are available
  for (let i = 0; i < numSlotsRequired; i++) {
    const slotToCheck = new Date(`1970-01-01T${appointmentData.time}:00`);
    slotToCheck.setMinutes(slotToCheck.getMinutes() + i * 30);
    const timeString = slotToCheck.toTimeString().substring(0, 5);
    if (bookedSlots.has(timeString)) {
      throw new Error(
        `Booking conflict. Time slot ${timeString} is already booked for the selected date.`,
      );
    }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      customerName: appointmentData.customerName,
      customerEmail: appointmentData.customerEmail,
      date: appointmentData.date,
      time: appointmentData.time,
      services: appointmentData.services as any,
      totalPrice: appointmentData.totalPrice,
      totalDuration: appointmentData.totalDuration,
      // Optional fields - only update if explicitly provided
      ...(appointmentData.stylistId !== undefined && { stylistId: appointmentData.stylistId }),
      ...(appointmentData.categoryId !== undefined && { categoryId: appointmentData.categoryId }),
      ...(appointmentData.estimatedDuration !== undefined && {
        estimatedDuration: appointmentData.estimatedDuration,
      }),
    },
  });

  return {
    ...updatedAppointment,
    services: Array.isArray(updatedAppointment.services)
      ? (updatedAppointment.services as unknown as Service[])
      : [],
    stylistId: updatedAppointment.stylistId ?? undefined,
    calendarEventId: updatedAppointment.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: updatedAppointment.categoryId ?? undefined,
    estimatedDuration: updatedAppointment.estimatedDuration ?? undefined,
  };
};

// Stylist Management
export const getStylists = async (): Promise<Stylist[]> => {
  const stylists = await prisma.stylist.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  // Fetch all categories for specialty mapping
  const allCategories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return stylists.map(stylist => {
    // Ensure workingHours is valid, otherwise use default
    let workingHours = getDefaultWorkingHours();
    if (
      stylist.workingHours &&
      typeof stylist.workingHours === 'object' &&
      !Array.isArray(stylist.workingHours)
    ) {
      workingHours = stylist.workingHours as any;
    } else if (stylist.workingHours) {
      console.warn(
        `Stylist ${stylist.id} has invalid workingHours structure, using defaults:`,
        stylist.workingHours,
      );
    }

    // Map specialty category IDs to full ServiceCategory objects
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
        .map(cat => ({
          ...cat!,
          items: [], // Categories don't need items for specialty display
        })) as ServiceCategory[],
      workingHours,
      blockedDates:
        stylist.blockedDates && Array.isArray(stylist.blockedDates)
          ? (stylist.blockedDates as string[])
          : [],
    };
  });
};

export const getStylistById = async (id: string): Promise<Stylist | null> => {
  const stylist = await prisma.stylist.findUnique({
    where: { id },
  });

  if (!stylist) return null;

  // Fetch all categories for specialty mapping
  const allCategories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // Ensure workingHours is valid, otherwise use default
  let workingHours = getDefaultWorkingHours();
  if (
    stylist.workingHours &&
    typeof stylist.workingHours === 'object' &&
    !Array.isArray(stylist.workingHours)
  ) {
    workingHours = stylist.workingHours as any;
  } else if (stylist.workingHours) {
    console.warn(
      `Stylist ${id} has invalid workingHours structure, using defaults:`,
      stylist.workingHours,
    );
  }

  // Map specialty category IDs to full ServiceCategory objects
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
      .map(cat => ({
        ...cat!,
        items: [], // Categories don't need items for specialty display
      })) as ServiceCategory[],
    workingHours,
    blockedDates:
      stylist.blockedDates && Array.isArray(stylist.blockedDates)
        ? (stylist.blockedDates as string[])
        : [],
  };
};

export const createStylist = async (stylistData: {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  specialtyCategoryIds: string[]; // Category IDs instead of service IDs
  workingHours?: Stylist['workingHours'];
  blockedDates?: string[];
  userId?: string; // Link to User account (for promoted users)
}): Promise<Stylist> => {
  const defaultHours = getDefaultWorkingHours();

  // If userId provided, update user's role to STYLIST
  if (stylistData.userId) {
    await prisma.user.update({
      where: { id: stylistData.userId },
      data: { role: 'STYLIST' as any }, // Type assertion until Prisma client regenerated
    });
  }

  const newStylist = await prisma.stylist.create({
    data: {
      name: stylistData.name,
      email: stylistData.email || null, // null is accepted by Prisma for optional fields
      bio: stylistData.bio,
      avatar: stylistData.avatar,
      specialties: stylistData.specialtyCategoryIds,
      workingHours: stylistData.workingHours || defaultHours,
      blockedDates: stylistData.blockedDates || [],
      userId: stylistData.userId,
    },
  });

  // Fetch all categories for specialty mapping
  const allCategories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  return {
    ...newStylist,
    email: newStylist.email ?? undefined,
    bio: newStylist.bio ?? undefined,
    avatar: newStylist.avatar ?? undefined,
    specialties: stylistData.specialtyCategoryIds
      .map(categoryId => allCategories.find(c => c.id === categoryId))
      .filter(Boolean)
      .map(cat => ({
        ...cat!,
        items: [], // Categories don't need items for specialty display
      })) as ServiceCategory[],
    workingHours: (newStylist.workingHours as any) || defaultHours,
    blockedDates:
      newStylist.blockedDates && Array.isArray(newStylist.blockedDates)
        ? (newStylist.blockedDates as string[])
        : [],
  };
};

export const updateStylist = async (
  id: string,
  updateData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    specialtyCategoryIds?: string[]; // Category IDs instead of service IDs
    workingHours?: Stylist['workingHours'];
    blockedDates?: string[];
    isActive?: boolean;
  },
): Promise<Stylist> => {
  const updatePayload: any = {};

  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.email !== undefined) updatePayload.email = updateData.email;
  if (updateData.bio !== undefined) updatePayload.bio = updateData.bio;
  if (updateData.avatar !== undefined) updatePayload.avatar = updateData.avatar;
  if (updateData.specialtyCategoryIds !== undefined)
    updatePayload.specialties = updateData.specialtyCategoryIds;
  if (updateData.workingHours !== undefined) updatePayload.workingHours = updateData.workingHours;
  if (updateData.blockedDates !== undefined) updatePayload.blockedDates = updateData.blockedDates;
  if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

  const updatedStylist = await prisma.stylist.update({
    where: { id },
    data: updatePayload,
  });

  // Fetch all categories for specialty mapping
  const allCategories = await prisma.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  // Map specialty category IDs to full ServiceCategory objects
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
      .map(cat => ({
        ...cat!,
        items: [], // Categories don't need items for specialty display
      })) as ServiceCategory[],
    workingHours: (updatedStylist.workingHours as any) || getDefaultWorkingHours(),
    blockedDates:
      updatedStylist.blockedDates && Array.isArray(updatedStylist.blockedDates)
        ? (updatedStylist.blockedDates as string[])
        : [],
  };
};

export const deleteStylist = async (id: string): Promise<void> => {
  await prisma.stylist.update({
    where: { id },
    data: { isActive: false },
  });
};

/**
 * Get stylists that specialize in a specific category
 * Used in category-based booking flow
 */
export const getStylistsForCategory = async (categoryId: string): Promise<Stylist[]> => {
  const stylists = await getStylists();

  return stylists.filter(stylist =>
    stylist.specialties.some(specialty => specialty.id === categoryId),
  );
};

export const rescheduleAppointment = async (
  appointmentId: string,
  newDate: Date,
  newTime: string,
): Promise<Appointment> => {
  // Get the existing appointment
  const existingAppointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { stylist: true },
  });

  if (!existingAppointment) {
    throw new Error('Appointment not found');
  }

  // Validate minimum advance notice (2 hours)
  const now = new Date();
  const appointmentDateTime = new Date(`${newDate.toISOString().split('T')[0]}T${newTime}:00`);
  const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < 2) {
    throw new Error('Please provide at least 2 hours advance notice for rescheduling');
  }

  // Check if new time is during business hours
  const settings = await getAdminSettings();
  const dateKey = dateToKey(newDate);

  // Check if store is closed on this date (full-day closure)
  const fullDayClosure = settings.specialClosures.find(
    closure => closure.date === dateKey && closure.isFullDay,
  );
  if (fullDayClosure) {
    throw new Error('The store is closed on this date');
  }

  // Get day schedule
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

  // Check stylist availability for the new time
  if (existingAppointment.stylistId) {
    const stylistAvailability = await getStylistAvailability(
      newDate,
      existingAppointment.stylistId,
    );

    // Check if enough consecutive slots are available
    const requiredSlots = Math.ceil(existingAppointment.totalDuration / 30);
    const timeSlots = stylistAvailability;
    const startIndex = timeSlots.indexOf(newTime);

    if (startIndex === -1) {
      throw new Error('Selected time slot is not available');
    }

    // Check consecutive availability
    for (let i = 0; i < requiredSlots; i++) {
      const neededTime = new Date(`1970-01-01T${newTime}:00`);
      neededTime.setMinutes(neededTime.getMinutes() + i * 30);
      const neededTimeStr = neededTime.toTimeString().substring(0, 5);

      if (!timeSlots.includes(neededTimeStr)) {
        throw new Error(
          `Not enough consecutive time slots available. Need ${requiredSlots * 30} minutes.`,
        );
      }
    }
  } else {
    // Check general availability if no specific stylist
    const generalAvailability = await getAvailability(newDate);
    const requiredSlots = Math.ceil(existingAppointment.totalDuration / 30);
    const startIndex = generalAvailability.indexOf(newTime);

    if (startIndex === -1) {
      throw new Error('Selected time slot is not available');
    }

    for (let i = 0; i < requiredSlots; i++) {
      const neededTime = new Date(`1970-01-01T${newTime}:00`);
      neededTime.setMinutes(neededTime.getMinutes() + i * 30);
      const neededTimeStr = neededTime.toTimeString().substring(0, 5);

      if (!generalAvailability.includes(neededTimeStr)) {
        throw new Error(
          `Not enough consecutive time slots available. Need ${requiredSlots * 30} minutes.`,
        );
      }
    }
  }

  // Update the appointment
  const updatedAppointment = await updateAppointment(appointmentId, {
    date: newDate,
    time: newTime,
    customerName: existingAppointment.customerName,
    customerEmail: existingAppointment.customerEmail,
    services: existingAppointment.services as any,
    totalPrice: existingAppointment.totalPrice,
    totalDuration: existingAppointment.totalDuration,
  });

  return updatedAppointment;
};

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

// Customer dashboard functions
export const updateUserProfile = async (
  userId: string,
  updates: { name?: string },
): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (updatedUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
  };
};

export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    console.log('[getUserAppointments] Querying appointments for userId:', userId);

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });

    console.log(`[getUserAppointments] Found ${appointments.length} raw appointments`);

    // Map appointments with error handling for each record
    return appointments.map((appointment, index) => {
      try {
        return {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          services: Array.isArray(appointment.services)
            ? (appointment.services as unknown as Service[])
            : [],
          stylistId: appointment.stylistId,
          stylist: appointment.stylist
            ? {
                id: appointment.stylist.id,
                name: appointment.stylist.name,
                email: appointment.stylist.email ?? undefined,
              }
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
      } catch (mapError) {
        console.error(`[getUserAppointments] Error mapping appointment ${index}:`, {
          appointmentId: appointment.id,
          error: mapError,
          services: appointment.services,
        });
        // Return a safe version of the appointment
        return {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          services: [], // Default to empty array if services are malformed
          stylistId: appointment.stylistId,
          stylist: appointment.stylist
            ? {
                id: appointment.stylist.id,
                name: appointment.stylist.name,
                email: appointment.stylist.email ?? undefined,
              }
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
      }
    });
  } catch (error) {
    console.error('[getUserAppointments] Database query failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });
    throw error; // Re-throw to be handled by API route
  }
};

export const getUserAppointmentById = async (
  appointmentId: string,
  userId: string,
): Promise<Appointment | null> => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      userId: userId,
    },
    include: {
      stylist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!appointment) return null;

  return {
    id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId,
    stylist: appointment.stylist
      ? {
          id: appointment.stylist.id,
          name: appointment.stylist.name,
          email: appointment.stylist.email ?? undefined,
        }
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
  await prisma.appointment.delete({
    where: { id: appointmentId },
  });
};

// Appointment Reminders Functions
export const getUpcomingAppointmentsForReminders = async (
  hoursAhead: number = 24,
): Promise<Appointment[]> => {
  const now = new Date();
  const reminderTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  // Get appointments that are approximately 24 hours away (within a 2-hour window for flexibility)
  const startWindow = new Date(reminderTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const endWindow = new Date(reminderTime.getTime() + 60 * 60 * 1000); // 1 hour after

  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startWindow,
        lte: endWindow,
      },
      // Only send reminders for appointments with users (not guest bookings)
      userId: {
        not: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          authProvider: true,
          telegramId: true,
          whatsappPhone: true,
          role: true,
          avatar: true,
        },
      },
      stylist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return appointments.map(appointment => ({
    id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId,
    stylist: appointment.stylist
      ? {
          id: appointment.stylist.id,
          name: appointment.stylist.name,
          email: appointment.stylist.email ?? undefined,
        }
      : undefined,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    totalPrice: appointment.totalPrice,
    totalDuration: appointment.totalDuration,
    calendarEventId: appointment.calendarEventId,
    userId: appointment.userId,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    // Add user data for messaging
    user: appointment.user
      ? {
          id: appointment.user.id,
          name: appointment.user.name,
          email: appointment.user.email,
          authProvider: appointment.user.authProvider as 'whatsapp' | 'telegram' | 'email',
          telegramId: appointment.user.telegramId ?? undefined,
          whatsappPhone: appointment.user.whatsappPhone ?? undefined,
          role: appointment.user.role as 'CUSTOMER' | 'ADMIN',
          avatar: appointment.user.avatar ?? undefined,
        }
      : undefined,
  }));
};

export const markReminderSent = async (appointmentId: string): Promise<void> => {
  // Add a reminder sent flag to prevent duplicate reminders
  // For now, we'll use the updatedAt field, but in production you might want a dedicated field
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { updatedAt: new Date() },
  });
};

// Re-export retention service function for auto-complete
export { markAppointmentCompleted } from '../services/retentionService';

export const getUnsyncedAppointments = async (): Promise<Appointment[]> => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const appointments = await prisma.appointment.findMany({
    where: {
      calendarEventId: null,
      createdAt: { gte: twoDaysAgo },
      date: { gte: new Date() },
    },
    include: {
      stylist: true,
    },
  });

  const allServices = await getServices();

  return appointments.map(apt => ({
    ...apt,
    services: Array.isArray(apt.services) ? (apt.services as unknown as Service[]) : [],
    stylistId: apt.stylistId ?? undefined,
    stylist: apt.stylist
      ? {
          ...apt.stylist,
          email: apt.stylist.email ?? undefined,
          bio: apt.stylist.bio ?? undefined,
          avatar: apt.stylist.avatar ?? undefined,
          specialties: Array.isArray(apt.stylist.specialties)
            ? ((apt.stylist.specialties as any[])
                .map(id => allServices.find(s => s.id === normalizeServiceId(id)))
                .filter(Boolean) as Service[])
            : [],
          workingHours: (apt.stylist.workingHours as any) || getDefaultWorkingHours(),
          blockedDates:
            apt.stylist.blockedDates && Array.isArray(apt.stylist.blockedDates)
              ? (apt.stylist.blockedDates as string[])
              : [],
        }
      : undefined,
    calendarEventId: apt.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: apt.categoryId ?? undefined,
    estimatedDuration: apt.estimatedDuration ?? undefined,
  }));
};

export const getUsersForRebookingReminders = async (daysAgo: number = 28): Promise<User[]> => {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);

  const users = await prisma.user.findMany({
    where: {
      appointments: {
        some: {
          date: {
            equals: targetDate,
          },
        },
        none: {
          date: {
            gt: targetDate,
          },
        },
      },
    },
    include: {
      appointments: {
        orderBy: {
          date: 'desc',
        },
        take: 1,
      },
    },
  });

  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'CUSTOMER' | 'ADMIN',
    authProvider: (user.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: user.telegramId ?? undefined,
    whatsappPhone: user.whatsappPhone ?? undefined,
    avatar: user.avatar ?? undefined,
  }));
};

export const getLastAppointmentByUserId = async (userId: string): Promise<Appointment | null> => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      userId: userId,
    },
    orderBy: {
      date: 'desc',
    },
  });

  if (!appointment) return null;

  return {
    ...appointment,
    services: Array.isArray(appointment.services)
      ? (appointment.services as unknown as Service[])
      : [],
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
    // Category-based booking fields
    categoryId: appointment.categoryId ?? undefined,
    estimatedDuration: appointment.estimatedDuration ?? undefined,
  };
};
