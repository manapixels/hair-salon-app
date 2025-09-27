import type { Appointment, AdminSettings, Service, User } from '../types';
import { SALON_SERVICES } from '../constants';
import { prisma } from './prisma';

/**
 * DATABASE FUNCTIONS USING PRISMA + NEON
 * Persistent PostgreSQL database for production use
 */

// Initialize default admin user and settings on first run
async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@luxecuts.com' },
    });

    if (!adminUser) {
      // Create default admin user
      await prisma.user.create({
        data: {
          id: 'user-admin-01',
          name: 'Admin',
          email: 'admin@luxecuts.com',
          password: 'admin123', // In production, this should be hashed
          role: 'ADMIN',
        },
      });
    }

    // Check if admin settings exist
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      await prisma.adminSettings.create({
        data: {
          openingTime: '09:00',
          closingTime: '18:00',
          blockedSlots: {},
        },
      });
    }

    // Initialize services if they don't exist
    const serviceCount = await prisma.service.count();
    if (serviceCount === 0) {
      await prisma.service.createMany({
        data: SALON_SERVICES.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
        })),
      });
    }
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

export const createUser = async (
  userData: Omit<User, 'id' | 'role'> & { password: string },
): Promise<User> => {
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: 'CUSTOMER',
      authProvider: userData.authProvider,
      telegramId: userData.telegramId,
      whatsappPhone: userData.whatsappPhone,
      avatar: userData.avatar,
    },
  });

  const { password, ...userToReturn } = newUser;
  return {
    ...userToReturn,
    role: newUser.role.toLowerCase() as 'customer' | 'admin',
    authProvider: newUser.authProvider as 'email' | 'whatsapp' | 'telegram' | undefined,
    telegramId: newUser.telegramId ?? undefined,
    whatsappPhone: newUser.whatsappPhone ?? undefined,
    avatar: newUser.avatar ?? undefined,
  };
};

// Service Management
export const getServices = async (): Promise<Service[]> => {
  const services = await prisma.service.findMany({
    where: { isActive: true },
  });
  return services;
};

// Appointment Management
export const getAppointments = async (): Promise<Appointment[]> => {
  const appointments = await prisma.appointment.findMany({
    orderBy: { date: 'asc' },
  });

  return appointments.map(apt => ({
    ...apt,
    services: Array.isArray(apt.services) ? (apt.services as unknown as Service[]) : [],
    calendarEventId: apt.calendarEventId ?? undefined,
  }));
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const settings = await prisma.adminSettings.findFirst();
  if (!settings) {
    // Return default settings if none exist
    return {
      openingTime: '09:00',
      closingTime: '18:00',
      blockedSlots: {},
    };
  }

  return {
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    blockedSlots:
      settings.blockedSlots &&
      typeof settings.blockedSlots === 'object' &&
      !Array.isArray(settings.blockedSlots)
        ? (settings.blockedSlots as { [date: string]: string[] })
        : {},
  };
};

export const updateAdminSettings = async (
  newSettings: Partial<AdminSettings>,
): Promise<AdminSettings> => {
  const existingSettings = await prisma.adminSettings.findFirst();

  if (existingSettings) {
    const updated = await prisma.adminSettings.update({
      where: { id: existingSettings.id },
      data: {
        openingTime: newSettings.openingTime ?? existingSettings.openingTime,
        closingTime: newSettings.closingTime ?? existingSettings.closingTime,
        blockedSlots: (newSettings.blockedSlots ?? existingSettings.blockedSlots) as any,
      },
    });

    return {
      openingTime: updated.openingTime,
      closingTime: updated.closingTime,
      blockedSlots:
        updated.blockedSlots &&
        typeof updated.blockedSlots === 'object' &&
        !Array.isArray(updated.blockedSlots)
          ? (updated.blockedSlots as { [date: string]: string[] })
          : {},
    };
  } else {
    const created = await prisma.adminSettings.create({
      data: {
        openingTime: newSettings.openingTime ?? '09:00',
        closingTime: newSettings.closingTime ?? '18:00',
        blockedSlots: newSettings.blockedSlots ?? {},
      },
    });

    return {
      openingTime: created.openingTime,
      closingTime: created.closingTime,
      blockedSlots:
        created.blockedSlots &&
        typeof created.blockedSlots === 'object' &&
        !Array.isArray(created.blockedSlots)
          ? (created.blockedSlots as { [date: string]: string[] })
          : {},
    };
  }
};

export const getAvailability = async (date: Date): Promise<string[]> => {
  const settings = await getAdminSettings();
  const allSlots = generateTimeSlots(settings.openingTime, settings.closingTime);
  const dateKey = dateToKey(date);

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

export const bookNewAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'totalPrice' | 'totalDuration'>,
): Promise<Appointment> => {
  const availableSlots = await getAvailability(appointmentData.date);
  const { totalPrice, totalDuration } = appointmentData.services.reduce(
    (acc, service) => {
      acc.totalPrice += service.price;
      acc.totalDuration += service.duration;
      return acc;
    },
    { totalPrice: 0, totalDuration: 0 },
  );
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
      customerName: appointmentData.customerName,
      customerEmail: appointmentData.customerEmail,
      totalPrice,
      totalDuration,
    },
  });

  return {
    ...newAppointment,
    services: Array.isArray(newAppointment.services)
      ? (newAppointment.services as unknown as Service[])
      : [],
    calendarEventId: newAppointment.calendarEventId ?? undefined,
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
    calendarEventId: appointment.calendarEventId ?? undefined,
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
    calendarEventId: appointment.calendarEventId ?? undefined,
  };
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
    },
  });

  return {
    ...updatedAppointment,
    services: Array.isArray(updatedAppointment.services)
      ? (updatedAppointment.services as unknown as Service[])
      : [],
    calendarEventId: updatedAppointment.calendarEventId ?? undefined,
  };
};
