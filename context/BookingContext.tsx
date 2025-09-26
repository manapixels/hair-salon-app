import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Appointment, AdminSettings } from '../types';
import { getAvailableSlots as apiGetAvailableSlots, createAppointment as apiCreateAppointment, blockTimeSlot as apiBlockTimeSlot, unblockTimeSlot as apiUnblockTimeSlot, getAdminSettings, updateAdminSettings } from '../services/calendarService';

interface BookingContextType {
  appointments: Appointment[];
  adminSettings: AdminSettings;
  setAdminSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  fetchAndSetAppointments: () => Promise<void>;
  fetchAndSetAdminSettings: () => Promise<void>;
  getAvailableSlots: (date: Date) => Promise<string[]>;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'totalPrice' | 'totalDuration'>) => Promise<Appointment>;
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
    blockedSlots: {},
  });

  const fetchAndSetAppointments = async () => {
    // In a real app, you would fetch all appointments. For this demo, we'll keep it client-side after creation.
  };
  
  const fetchAndSetAdminSettings = useCallback(async () => {
      const settings = await getAdminSettings();
      setAdminSettings(settings);
  }, []);

  const getAvailableSlots = useCallback(async (date: Date) => {
    return apiGetAvailableSlots(date);
  }, []);

  const createAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'totalPrice' | 'totalDuration'>) => {
    const newAppointment = await apiCreateAppointment(appointmentData);
    setAppointments(prev => [...prev, newAppointment]);
    return newAppointment;
  }, []);
  
  const blockTimeSlot = useCallback(async (date: Date, time: string) => {
    const newBlockedSlots = await apiBlockTimeSlot(date, time);
    setAdminSettings(prev => ({...prev, blockedSlots: newBlockedSlots}));
  }, []);

  const unblockTimeSlot = useCallback(async (date: Date, time: string) => {
    const newBlockedSlots = await apiUnblockTimeSlot(date, time);
    setAdminSettings(prev => ({...prev, blockedSlots: newBlockedSlots}));
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
    saveAdminSettings
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