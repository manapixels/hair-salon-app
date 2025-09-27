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

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  services: Service[];
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  totalDuration: number;
  calendarEventId?: string; // Google Calendar event ID
}

export interface AdminSettings {
  openingTime: string; // "HH:MM"
  closingTime: string; // "HH:MM"
  blockedSlots: { [date: string]: string[] }; // e.g., { "2024-07-28": ["10:00", "10:30"] }
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
  role: 'customer' | 'admin';
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
