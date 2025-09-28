import type { Appointment, AdminSettings, CreateAppointmentInput } from '../types';
import { apiClient } from '../lib/apiClient';

// This file now acts as an API client for the frontend.

const dateToKey = (date: Date) => date.toISOString().split('T')[0];

/**
 * Fetches available time slots for a given date from the backend API.
 * If stylistId is provided, returns stylist-specific availability.
 */
export const getAvailableSlots = (date: Date, stylistId?: string): Promise<string[]> => {
  const dateParam = `date=${dateToKey(date)}`;
  const stylistParam = stylistId ? `&stylistId=${stylistId}` : '';
  return apiClient.get(`/api/availability?${dateParam}${stylistParam}`);
};

/**
 * Sends a new appointment to the backend to be created.
 */
export const createAppointment = (
  appointmentData: CreateAppointmentInput,
): Promise<Appointment> => {
  return apiClient.post('/api/appointments', appointmentData);
};

/**
 * Sends a request to the backend to block a specific time slot.
 */
export const blockTimeSlot = (date: Date, time: string): Promise<AdminSettings['blockedSlots']> => {
  return apiClient.post('/api/admin/blocked-slots', { date: dateToKey(date), time });
};

/**
 * Sends a request to the backend to unblock a specific time slot.
 */
export const unblockTimeSlot = (
  date: Date,
  time: string,
): Promise<AdminSettings['blockedSlots']> => {
  return apiClient.delete('/api/admin/blocked-slots', { date: dateToKey(date), time });
};

/**
 * Fetches the current admin settings from the backend.
 */
export const getAdminSettings = (): Promise<AdminSettings> => {
  return apiClient.get('/api/admin/settings');
};

/**
 * Sends updated admin settings to the backend.
 */
export const updateAdminSettings = (settings: AdminSettings): Promise<AdminSettings> => {
  return apiClient.post('/api/admin/settings', settings);
};
