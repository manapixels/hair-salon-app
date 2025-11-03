export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
}

export interface TimeSlot {
  time: string; // e.g., "09:00"
  available: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  specialties: Service[]; // Services this stylist can perform
  workingHours: {
    [day: string]: {
      // e.g., 'monday', 'tuesday'
      start: string; // "09:00"
      end: string; // "17:00"
      isWorking: boolean;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  services: Service[];
  stylistId?: string | null; // The assigned stylist
  stylist?: StylistSummary; // Populated stylist data
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  totalDuration: number;
  calendarEventId?: string | null; // Google Calendar event ID
  userId?: string | null; // User who booked the appointment
  user?: User; // Populated user data (for reminders)
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAppointmentInput = Omit<
  Appointment,
  'id' | 'totalPrice' | 'totalDuration' | 'createdAt' | 'updatedAt'
> & {
  stylistId?: string;
};

export type StylistSummary = {
  id: string;
  name: string;
  email: string;
};

export interface DaySchedule {
  isOpen: boolean;
  openingTime: string; // "HH:MM"
  closingTime: string; // "HH:MM"
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface AdminSettings {
  weeklySchedule: WeeklySchedule;
  closedDates: string[]; // Array of "YYYY-MM-DD" strings
  blockedSlots: { [date: string]: string[] }; // e.g., { "2024-07-28": ["10:00", "10:30"] }
  businessName: string;
  businessAddress: string;
  businessPhone: string;
}

// FIX: Define and export the missing WhatsAppMessage interface.
export interface WhatsAppMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  authProvider?: 'email' | 'whatsapp' | 'telegram';
  telegramId?: number;
  whatsappPhone?: string;
  avatar?: string;
}

export interface WhatsAppAuthData {
  accessToken: string;
  phoneNumber: string;
  name: string;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}
