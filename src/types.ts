export interface ServiceAddon {
  id: string;
  name: string;
  description?: string;
  benefits?: string[];
  price: string;
  basePrice: number;
  duration: number;
  isRecommended: boolean;
  isPopular: boolean;
  serviceId: string;
}

export type TagCategory = 'CONCERN' | 'OUTCOME' | 'HAIR_TYPE';

export type Role = 'CUSTOMER' | 'STYLIST' | 'ADMIN';

export interface ServiceTag {
  id: string;
  slug: string;
  label: string;
  category: TagCategory;
  description?: string | null;
  iconName?: string | null;
  sortOrder: number;
}

export interface ServiceTagRelation {
  id: string;
  serviceId: string;
  tagId: string;
  tag: ServiceTag;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  basePrice: number;
  maxPrice?: number;
  duration: number; // in minutes
  imageUrl?: string;
  popularityScore: number;
  tags: string[];
  categoryId: string;
  addons?: ServiceAddon[];
  serviceTags?: ServiceTagRelation[];
  isActive: boolean;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  description?: string;
  icon?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  priceNote?: string;
  estimatedDuration?: number;
  sortOrder: number;
  isFeatured?: boolean;
  imageUrl?: string;
  illustrationUrl?: string;
  items: Service[];
  matchingServiceCount?: number; // For concern search results
}

export interface TimeSlot {
  time: string; // e.g., "09:00"
  available: boolean;
}

/**
 * Represents a blocked period for a stylist.
 * Can be a full-day block or a partial-day block with specific times.
 */
export interface BlockedPeriod {
  date: string; // "YYYY-MM-DD"
  isFullDay: boolean; // true = entire day blocked
  startTime?: string; // "HH:mm" - blocked FROM this time (when isFullDay=false)
  endTime?: string; // "HH:mm" - blocked UNTIL this time (when isFullDay=false)
  reason?: string; // Optional reason (e.g., "Doctor appointment")
}

export interface Stylist {
  id: string;
  name: string;
  email?: string; // Optional - may be inherited from linked User
  bio?: string;
  avatar?: string;
  specialties: ServiceCategory[]; // Service categories this stylist specializes in
  workingHours: {
    [day: string]: {
      // e.g., 'monday', 'tuesday'
      start: string; // "09:00"
      end: string; // "17:00"
      isWorking: boolean;
    };
  };
  // Supports both legacy string[] and enhanced BlockedPeriod[] format
  blockedDates: string[] | BlockedPeriod[];
  isActive: boolean;
  // Google Calendar OAuth fields
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: Date;
  googleCalendarId?: string;
  googleEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingSource = 'WEB' | 'TELEGRAM' | 'WHATSAPP';

export interface Appointment {
  id: string;
  date: Date;
  time: string;

  // Category-based booking
  categoryId?: string;
  category?: ServiceCategory;
  estimatedDuration?: number;

  // Legacy service-based booking (DEPRECATED - kept for backward compatibility)
  services: Service[];
  totalPrice: number;
  totalDuration: number;

  // Common fields
  stylistId?: string | null; // The assigned stylist
  stylist?: StylistSummary; // Populated stylist data
  customerName: string;
  customerEmail: string;
  calendarEventId?: string | null; // Google Calendar event ID
  userId?: string | null; // User who booked the appointment
  user?: User; // Populated user data (for reminders)
  bookingSource?: BookingSource; // WEB, TELEGRAM, WHATSAPP
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
  email?: string;
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
  specialClosures: BlockedPeriod[]; // Full or partial day closures
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
  roles: Role[]; // All user roles
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

// Customer status based on visit patterns
export type CustomerStatus = 'NEW' | 'ACTIVE' | 'AT_RISK' | 'CHURNED';

// CustomerWithStats extends base user data with computed statistics for admin view
export interface CustomerWithStats {
  // Base user fields from users table
  id: string;
  name: string;
  email: string;
  avatar?: string;
  authProvider?: 'email' | 'whatsapp' | 'telegram';
  telegramId?: number;
  whatsappPhone?: string;
  totalVisits: number;
  lastVisitDate?: Date;
  createdAt: Date;

  // Computed fields for admin customer list
  nextAppointment?: {
    id: string;
    date: Date;
    time: string;
    categoryTitle?: string;
    stylistName?: string;
  };
  preferredStylist?: StylistSummary;
  status: CustomerStatus;
}
