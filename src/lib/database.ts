import type { Appointment, AdminSettings, Service, User } from '../types';
import { SALON_SERVICES } from '../constants';

/**
 * SERVER-SIDE IN-MEMORY DATABASE
 * In a real application, this would be replaced with a proper database like PostgreSQL, MongoDB, etc.
 * This state is persistent for the lifetime of the server process.
 */
let appointmentsDB: Appointment[] = [];
let adminSettingsDB: AdminSettings = {
  openingTime: '09:00',
  closingTime: '18:00',
  blockedSlots: {},
};
// User database with a default admin user. In a real app, passwords would be hashed.
export let usersDB: (User & { password: string })[] = [
  {
    id: 'user-admin-01',
    name: 'Admin',
    email: 'admin@luxecuts.com',
    password: 'adminpassword', // In a real app, NEVER store plain text passwords
    role: 'admin',
  },
];

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
export const findUserByEmail = (email: string) => {
  return usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = (userData: Omit<User, 'id' | 'role'> & { password: string }): User => {
  if (findUserByEmail(userData.email)) {
    throw new Error('User with this email already exists.');
  }
  const newUser: User & { password: string } = {
    ...userData,
    id: `user-${Date.now()}`,
    role: 'customer', // Default role
  };
  usersDB.push(newUser);
  const { password, ...userToReturn } = newUser;
  return userToReturn;
};

// Service Management
export const getServices = (): Service[] => {
  return SALON_SERVICES;
};

// Appointment Management
export const getAppointments = (): Appointment[] => {
  return appointmentsDB;
};

export const getAdminSettings = (): AdminSettings => {
  return adminSettingsDB;
};

export const updateAdminSettings = (newSettings: Partial<AdminSettings>): AdminSettings => {
  adminSettingsDB = { ...adminSettingsDB, ...newSettings };
  return adminSettingsDB;
};

export const getAvailability = (date: Date): string[] => {
  const allSlots = generateTimeSlots(adminSettingsDB.openingTime, adminSettingsDB.closingTime);
  const dateKey = dateToKey(date);

  const bookedSlots = new Set<string>();
  appointmentsDB
    .filter(app => dateToKey(new Date(app.date)) === dateKey)
    .forEach(app => {
      let appTime = new Date(`1970-01-01T${app.time}:00`);
      const numSlots = Math.ceil(app.totalDuration / 30);
      for (let i = 0; i < numSlots; i++) {
        bookedSlots.add(appTime.toTimeString().substring(0, 5));
        appTime.setMinutes(appTime.getMinutes() + 30);
      }
    });

  const blockedByAdmin = new Set<string>(adminSettingsDB.blockedSlots[dateKey] || []);

  return allSlots.filter(slot => !bookedSlots.has(slot) && !blockedByAdmin.has(slot));
};

export const bookNewAppointment = (
  appointmentData: Omit<Appointment, 'id' | 'totalPrice' | 'totalDuration'>,
): Appointment => {
  const availableSlots = getAvailability(appointmentData.date);
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

  const newAppointment: Appointment = {
    ...appointmentData,
    id: `appt-${Date.now()}`,
    totalPrice,
    totalDuration,
  };

  appointmentsDB.push(newAppointment);
  return newAppointment;
};

export const cancelAppointment = (details: {
  customerEmail: string;
  date: string;
  time: string;
}): Appointment => {
  const { customerEmail, date, time } = details;
  const appointmentIndex = appointmentsDB.findIndex(
    app =>
      app.customerEmail.toLowerCase() === customerEmail.toLowerCase() &&
      dateToKey(new Date(app.date)) === date &&
      app.time === time,
  );

  if (appointmentIndex === -1) {
    throw new Error('Appointment not found. Please check the details provided.');
  }

  const [cancelledAppointment] = appointmentsDB.splice(appointmentIndex, 1);
  return cancelledAppointment;
};

export const blockSlot = (date: Date, time: string): AdminSettings['blockedSlots'] => {
  const dateKey = dateToKey(date);
  if (!adminSettingsDB.blockedSlots[dateKey]) {
    adminSettingsDB.blockedSlots[dateKey] = [];
  }
  if (!adminSettingsDB.blockedSlots[dateKey].includes(time)) {
    adminSettingsDB.blockedSlots[dateKey].push(time);
  }
  return adminSettingsDB.blockedSlots;
};

export const unblockSlot = (date: Date, time: string): AdminSettings['blockedSlots'] => {
  const dateKey = dateToKey(date);
  if (adminSettingsDB.blockedSlots[dateKey]) {
    adminSettingsDB.blockedSlots[dateKey] = adminSettingsDB.blockedSlots[dateKey].filter(
      t => t !== time,
    );
  }
  return adminSettingsDB.blockedSlots;
};

// Export the users database for auth endpoints
export const database = {
  users: usersDB,
  appointments: appointmentsDB,
  adminSettings: adminSettingsDB,
};
