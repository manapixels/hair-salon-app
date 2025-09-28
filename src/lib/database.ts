import type {
  Appointment,
  AdminSettings,
  Service,
  User,
  Stylist,
  CreateAppointmentInput,
  StylistSummary,
} from '../types';
import { SALON_SERVICES } from '../constants';
import { prisma } from './prisma';

/**
 * DATABASE FUNCTIONS USING PRISMA + NEON
 * Persistent PostgreSQL database for production use
 */

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

export const createUserFromOAuth = async (userData: Omit<User, 'id' | 'role'>): Promise<User> => {
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    // Update existing user with OAuth data
    const updatedUser = await prisma.user.update({
      where: { email: userData.email.toLowerCase() },
      data: {
        name: userData.name,
        authProvider: userData.authProvider,
        telegramId: userData.telegramId,
        whatsappPhone: userData.whatsappPhone,
        avatar: userData.avatar,
      },
    });

    return {
      ...updatedUser,
      role: updatedUser.role.toLowerCase() as 'customer' | 'admin',
      authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
      telegramId: updatedUser.telegramId ?? undefined,
      whatsappPhone: updatedUser.whatsappPhone ?? undefined,
      avatar: updatedUser.avatar ?? undefined,
    };
  }

  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
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
    role: newUser.role.toLowerCase() as 'customer' | 'admin',
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
    role: updatedUser.role.toLowerCase() as 'customer' | 'admin',
    authProvider: updatedUser.authProvider as 'whatsapp' | 'telegram' | undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
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
    include: {
      stylist: true,
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
          bio: apt.stylist.bio ?? undefined,
          avatar: apt.stylist.avatar ?? undefined,
          specialties: Array.isArray(apt.stylist.specialties)
            ? ((apt.stylist.specialties as number[])
                .map(id => allServices.find(s => s.id === id))
                .filter(Boolean) as Service[])
            : [],
          workingHours: (apt.stylist.workingHours as any) || getDefaultWorkingHours(),
        }
      : undefined,
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

export const getStylistAvailability = async (date: Date, stylistId: string): Promise<string[]> => {
  const dateKey = dateToKey(date);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Get stylist information including working hours
  const stylist = await getStylistById(stylistId);
  if (!stylist || !stylist.isActive) {
    return []; // Inactive stylist has no availability
  }

  // Check if stylist is working on this day
  const workingHours = stylist.workingHours[dayOfWeek];
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
      stylistId: appointmentData.stylistId,
      customerName: appointmentData.customerName,
      customerEmail: appointmentData.customerEmail,
      totalPrice,
      totalDuration,
    },
    include: {
      stylist: true,
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
          email: newAppointment.stylist.email,
        }
      : undefined,
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
    stylistId: appointment.stylistId ?? undefined,
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
    stylistId: appointment.stylistId ?? undefined,
    calendarEventId: appointment.calendarEventId ?? undefined,
  };
};

export const findAppointmentsByEmail = async (customerEmail: string): Promise<Appointment[]> => {
  const appointments = await prisma.appointment.findMany({
    where: {
      customerEmail: { equals: customerEmail, mode: 'insensitive' },
      date: { gte: new Date() }, // Only future appointments
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
    stylistId: updatedAppointment.stylistId ?? undefined,
    calendarEventId: updatedAppointment.calendarEventId ?? undefined,
  };
};

// Stylist Management
export const getStylists = async (): Promise<Stylist[]> => {
  const stylists = await prisma.stylist.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const allServices = await getServices();

  return stylists.map(stylist => ({
    ...stylist,
    bio: stylist.bio ?? undefined,
    avatar: stylist.avatar ?? undefined,
    specialties: Array.isArray(stylist.specialties)
      ? ((stylist.specialties as number[])
          .map(id => allServices.find(s => s.id === id))
          .filter(Boolean) as Service[])
      : [],
    workingHours: (stylist.workingHours as any) || getDefaultWorkingHours(),
  }));
};

export const getStylistById = async (id: string): Promise<Stylist | null> => {
  const stylist = await prisma.stylist.findUnique({
    where: { id },
  });

  if (!stylist) return null;

  const allServices = await getServices();

  return {
    ...stylist,
    bio: stylist.bio ?? undefined,
    avatar: stylist.avatar ?? undefined,
    specialties: Array.isArray(stylist.specialties)
      ? ((stylist.specialties as number[])
          .map(id => allServices.find(s => s.id === id))
          .filter(Boolean) as Service[])
      : [],
    workingHours: (stylist.workingHours as any) || getDefaultWorkingHours(),
  };
};

export const createStylist = async (stylistData: {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  specialtyIds: number[];
  workingHours?: Stylist['workingHours'];
}): Promise<Stylist> => {
  const defaultHours = getDefaultWorkingHours();

  const newStylist = await prisma.stylist.create({
    data: {
      name: stylistData.name,
      email: stylistData.email,
      bio: stylistData.bio,
      avatar: stylistData.avatar,
      specialties: stylistData.specialtyIds,
      workingHours: stylistData.workingHours || defaultHours,
    },
  });

  const allServices = await getServices();

  return {
    ...newStylist,
    bio: newStylist.bio ?? undefined,
    avatar: newStylist.avatar ?? undefined,
    specialties: stylistData.specialtyIds
      .map(id => allServices.find(s => s.id === id))
      .filter(Boolean) as Service[],
    workingHours: (newStylist.workingHours as any) || defaultHours,
  };
};

export const updateStylist = async (
  id: string,
  updateData: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    specialtyIds?: number[];
    workingHours?: Stylist['workingHours'];
    isActive?: boolean;
  },
): Promise<Stylist> => {
  const updatePayload: any = {};

  if (updateData.name !== undefined) updatePayload.name = updateData.name;
  if (updateData.email !== undefined) updatePayload.email = updateData.email;
  if (updateData.bio !== undefined) updatePayload.bio = updateData.bio;
  if (updateData.avatar !== undefined) updatePayload.avatar = updateData.avatar;
  if (updateData.specialtyIds !== undefined) updatePayload.specialties = updateData.specialtyIds;
  if (updateData.workingHours !== undefined) updatePayload.workingHours = updateData.workingHours;
  if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

  const updatedStylist = await prisma.stylist.update({
    where: { id },
    data: updatePayload,
  });

  const allServices = await getServices();

  return {
    ...updatedStylist,
    bio: updatedStylist.bio ?? undefined,
    avatar: updatedStylist.avatar ?? undefined,
    specialties: Array.isArray(updatedStylist.specialties)
      ? ((updatedStylist.specialties as number[])
          .map(id => allServices.find(s => s.id === id))
          .filter(Boolean) as Service[])
      : [],
    workingHours: (updatedStylist.workingHours as any) || getDefaultWorkingHours(),
  };
};

export const deleteStylist = async (id: string): Promise<void> => {
  await prisma.stylist.update({
    where: { id },
    data: { isActive: false },
  });
};

export const getStylistsForServices = async (serviceIds: number[]): Promise<Stylist[]> => {
  const stylists = await getStylists();

  return stylists.filter(stylist =>
    serviceIds.every(serviceId =>
      stylist.specialties.some(specialty => specialty.id === serviceId),
    ),
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
  if (newTime < settings.openingTime || newTime >= settings.closingTime) {
    throw new Error(
      `Appointments are only available between ${settings.openingTime} and ${settings.closingTime}`,
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
    role: updatedUser.role.toLowerCase() as 'customer' | 'admin',
    authProvider: (updatedUser.authProvider as 'email' | 'whatsapp' | 'telegram') ?? undefined,
    telegramId: updatedUser.telegramId ?? undefined,
    whatsappPhone: updatedUser.whatsappPhone ?? undefined,
    avatar: updatedUser.avatar ?? undefined,
  };
};

export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
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
          email: appointment.stylist.email,
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
  }));
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
          email: appointment.stylist.email,
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
          email: appointment.stylist.email,
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
          role: appointment.user.role.toLowerCase() as 'customer' | 'admin',
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
