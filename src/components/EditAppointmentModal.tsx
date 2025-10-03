'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { Appointment, Service } from '../types';
import { SALON_SERVICES } from '../constants';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSave: (updatedAppointment: Partial<Appointment>) => Promise<void>;
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    date: '',
    time: '',
    services: [] as Service[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment) {
      setFormData({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        time: appointment.time,
        services: appointment.services,
      });
    }
  }, [appointment]);

  const handleServiceToggle = (service: Service) => {
    setFormData(prev => {
      const isSelected = prev.services.some(s => s.id === service.id);
      if (isSelected) {
        return {
          ...prev,
          services: prev.services.filter(s => s.id !== service.id),
        };
      } else {
        return {
          ...prev,
          services: [...prev.services, service],
        };
      }
    });
  };

  const calculateTotals = () => {
    const totalPrice = formData.services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = formData.services.reduce((sum, service) => sum + service.duration, 0);
    return { totalPrice, totalDuration };
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName || !formData.customerEmail || !formData.date || !formData.time) {
      const errorMsg = 'Please fill in all required fields';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.services.length === 0) {
      const errorMsg = 'Please select at least one service';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Updating appointment...');

    try {
      const { totalPrice, totalDuration } = calculateTotals();
      await onSave({
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        date: new Date(formData.date),
        time: formData.time,
        services: formData.services,
        totalPrice,
        totalDuration,
      });
      toast.success('Appointment updated successfully!', { id: toastId });
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const { totalPrice, totalDuration } = calculateTotals();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Appointment
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, customerName: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Customer Email *
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, customerEmail: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time *
                    </label>
                    <select
                      value={formData.time}
                      onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select time</option>
                      {generateTimeSlots().map(slot => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Services *
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
                    {SALON_SERVICES.map(service => {
                      const isSelected = formData.services.some(s => s.id === service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleServiceToggle(service)}
                            className="mr-3 text-yellow-600 focus:ring-yellow-500"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {service.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {service.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  ${service.price}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {service.duration} min
                                </div>
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {formData.services.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Appointment Summary
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {totalDuration} minutes
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || formData.services.length === 0}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Updating...
                      </span>
                    ) : (
                      'Update Appointment'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
