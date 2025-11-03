'use client';

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Appointment, AdminSettings, CreateAppointmentInput } from '@/types';
import {
  getAvailableSlots as apiGetAvailableSlots,
  createAppointment as apiCreateAppointment,
  blockTimeSlot as apiBlockTimeSlot,
  unblockTimeSlot as apiUnblockTimeSlot,
  getAdminSettings,
  updateAdminSettings,
} from '@/services/calendarService';

interface BookingContextType {
  appointments: Appointment[];
  adminSettings: AdminSettings;
  setAdminSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  fetchAndSetAppointments: () => Promise<void>;
  fetchAndSetAdminSettings: () => Promise<void>;
  getAvailableSlots: (date: Date, stylistId?: string) => Promise<string[]>;
  createAppointment: (appointment: CreateAppointmentInput) => Promise<Appointment>;
  blockTimeSlot: (date: Date, time: string) => Promise<void>;
  unblockTimeSlot: (date: Date, time: string) => Promise<void>;
  saveAdminSettings: (settings: AdminSettings) => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    openingTime: '09:00',
    closingTime: '18:00',
    saturdayClosing: '15:00',
    blockedSlots: {},
    businessName: 'Luxe Cuts Hair Salon',
    businessAddress: '123 Main St, Your City, ST 12345',
    businessPhone: '(555) 123-4567',
  });

  const fetchAndSetAppointments = useCallback(async () => {
    try {
      const response = await fetch('/api/appointments');
      if (!response.ok) {
        console.error('Failed to fetch appointments:', response.status, response.statusText);
        setAppointments([]);
        return;
      }

      const fetchedAppointments = await response.json();

      // Validate response is an array
      if (!Array.isArray(fetchedAppointments)) {
        console.error('Invalid appointments response format:', fetchedAppointments);
        setAppointments([]);
        return;
      }

      setAppointments(fetchedAppointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    }
  }, []);

  const fetchAndSetAdminSettings = useCallback(async () => {
    const settings = await getAdminSettings();
    setAdminSettings(settings);
  }, []);

  const getAvailableSlots = useCallback(async (date: Date, stylistId?: string) => {
    return apiGetAvailableSlots(date, stylistId);
  }, []);

  const createAppointment = useCallback(async (appointmentData: CreateAppointmentInput) => {
    const newAppointment = await apiCreateAppointment(appointmentData);
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
  }, []);

  const blockTimeSlot = useCallback(async (date: Date, time: string) => {
    const newBlockedSlots = await apiBlockTimeSlot(date, time);
    setAdminSettings(prev => ({ ...prev, blockedSlots: newBlockedSlots }));
  }, []);

  const unblockTimeSlot = useCallback(async (date: Date, time: string) => {
    const newBlockedSlots = await apiUnblockTimeSlot(date, time);
    setAdminSettings(prev => ({ ...prev, blockedSlots: newBlockedSlots }));
  }, []);

  const saveAdminSettings = useCallback(async (settings: AdminSettings) => {
    const updatedSettings = await updateAdminSettings(settings);
    setAdminSettings(updatedSettings);
  }, []);

  const value = {
    appointments,
    adminSettings,
    setAdminSettings,
    getAvailableSlots,
    createAppointment,
    blockTimeSlot,
    unblockTimeSlot,
    fetchAndSetAppointments,
    fetchAndSetAdminSettings,
    saveAdminSettings,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
