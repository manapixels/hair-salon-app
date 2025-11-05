import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Stylist, Service } from '../types';
import { SALON_SERVICES } from '../constants';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Button } from '@radix-ui/themes';
import { TextField } from './ui/TextField';
import { TextArea } from './ui/TextArea';

interface StylistManagementProps {
  onClose?: () => void;
}

export default function StylistManagement({ onClose }: StylistManagementProps) {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);

  useEffect(() => {
    fetchStylists();
  }, []);

  const fetchStylists = async () => {
    try {
      const response = await fetch('/api/stylists');
      if (!response.ok) {
        throw new Error('Failed to load stylists');
      }

      const data = await response.json();

      // Validate response is an array
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      setStylists(data);
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
      toast.error('Failed to load stylists');
      setStylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStylist = async (stylistId: string) => {
    toast.custom(
      (t: string | number) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-gray-900 dark:text-white">
              Are you sure you want to delete this stylist?
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  const toastId = toast.loading('Deleting stylist...');
                  try {
                    const response = await fetch(`/api/stylists/${stylistId}`, {
                      method: 'DELETE',
                    });

                    if (response.ok) {
                      await fetchStylists();
                      toast.success('Stylist deleted successfully', { id: toastId });
                    } else {
                      toast.error('Failed to delete stylist', { id: toastId });
                    }
                  } catch (error) {
                    toast.error('Failed to delete stylist', { id: toastId });
                    console.error('Error deleting stylist:', error);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => toast.dismiss(t)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading stylists...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stylist Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Stylist
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          )}
        </div>
      </div>

      {stylists.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center">
          <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No stylists yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your first stylist to start managing appointments by staff.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
          >
            Add First Stylist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylists.map(stylist => (
            <div
              key={stylist.id}
              className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  {stylist.avatar ? (
                    <Image
                      src={stylist.avatar}
                      alt={stylist.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-user text-gray-600 dark:text-gray-400"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stylist.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stylist.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingStylist(stylist)}
                    className="text-yellow-600 hover:text-yellow-700"
                    title="Edit stylist"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteStylist(stylist.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete stylist"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {stylist.bio && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{stylist.bio}</p>
              )}

              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Specialties:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {stylist.specialties.map(service => (
                    <span
                      key={service.id}
                      className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded"
                    >
                      {service.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(stylist.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day.slice(0, 3)}:</span>
                      <span>{hours.isWorking ? `${hours.start}-${hours.end}` : 'Off'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Stylist Modal */}
      <StylistModal
        isOpen={showAddModal || !!editingStylist}
        onClose={() => {
          setShowAddModal(false);
          setEditingStylist(null);
        }}
        stylist={editingStylist}
        onSave={async () => {
          await fetchStylists();
          setShowAddModal(false);
          setEditingStylist(null);
        }}
      />
    </div>
  );
}

interface StylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylist: Stylist | null;
  onSave: () => void;
}

function StylistModal({ isOpen, onClose, stylist, onSave }: StylistModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: '',
    specialtyIds: [] as number[],
    workingHours: getDefaultWorkingHours(),
    blockedDates: [] as string[],
  });
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stylist) {
      setFormData({
        name: stylist.name,
        email: stylist.email,
        bio: stylist.bio || '',
        avatar: stylist.avatar || '',
        specialtyIds: stylist.specialties.map(s => s.id),
        workingHours: stylist.workingHours,
        blockedDates: stylist.blockedDates || [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        bio: '',
        avatar: '',
        specialtyIds: [],
        workingHours: getDefaultWorkingHours(),
        blockedDates: [],
      });
    }
    setError('');
    setNewBlockedDate('');
  }, [stylist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || formData.specialtyIds.length === 0) {
      const errorMsg = 'Please fill in all required fields and select at least one specialty';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const action = stylist ? 'Updating' : 'Creating';
    const toastId = toast.loading(`${action} stylist...`);

    try {
      const url = stylist ? `/api/stylists/${stylist.id}` : '/api/stylists';
      const method = stylist ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save stylist');
      }

      const successMsg = stylist
        ? 'Stylist updated successfully!'
        : 'Stylist created successfully!';
      toast.success(successMsg, { id: toastId });
      onSave();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save stylist';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      specialtyIds: prev.specialtyIds.includes(serviceId)
        ? prev.specialtyIds.filter(id => id !== serviceId)
        : [...prev.specialtyIds, serviceId],
    }));
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

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--color-panel-solid)] rounded-[var(--radius-4)] border border-[var(--gray-6)] shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="p-[var(--space-6)]">
            <div className="flex justify-between items-center mb-[var(--space-6)]">
              <Dialog.Title className="text-[length:var(--font-size-6)] font-bold text-[var(--gray-12)]">
                {stylist ? 'Edit Stylist' : 'Add New Stylist'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  className="text-[var(--gray-11)] hover:text-[var(--gray-12)] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-[var(--space-6)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-4)]">
                <TextField
                  label="Name *"
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <TextField
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <TextArea
                label="Bio"
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                placeholder="Brief description of the stylist's experience and style"
              />

              <div>
                <label className="block text-[length:var(--font-size-2)] font-medium text-[var(--gray-12)] mb-[var(--space-2)]">
                  Specialties *
                </label>
                <div className="grid grid-cols-1 gap-[var(--space-3)] max-h-60 overflow-y-auto border border-[var(--gray-6)] rounded-[var(--radius-3)] p-[var(--space-3)]">
                  {SALON_SERVICES.map(service => {
                    const isSelected = formData.specialtyIds.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className={`flex items-center p-[var(--space-3)] rounded-[var(--radius-3)] border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[var(--accent-8)] bg-[var(--accent-3)]'
                            : 'border-[var(--gray-6)] hover:bg-[var(--gray-3)]'
                        }`}
                      >
                        <Checkbox.Root
                          checked={isSelected}
                          onCheckedChange={() => handleSpecialtyToggle(service.id)}
                          className="flex items-center justify-center w-5 h-5 mr-3 rounded-[var(--radius-1)] border border-[var(--gray-7)] bg-[var(--color-surface)] hover:border-[var(--gray-8)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-8)] data-[state=checked]:bg-accent data-[state=checked]:border-[var(--accent-9)]"
                        >
                          <Checkbox.Indicator>
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-[var(--gray-12)]">{service.name}</h4>
                              <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
                                {service.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-[var(--gray-12)]">
                                ${service.price}
                              </div>
                              <div className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
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

              {/* Blocked Dates Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Blocked Dates (Holidays/Days Off)
                </label>
                <div className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                  <div className="space-y-2 mb-3">
                    {formData.blockedDates.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No blocked dates. Stylist is available according to their schedule.
                      </p>
                    ) : (
                      formData.blockedDates.map(date => (
                        <div
                          key={date}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">{date}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({
                                ...prev,
                                blockedDates: prev.blockedDates.filter(d => d !== date),
                              }))
                            }
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newBlockedDate}
                      onChange={e => setNewBlockedDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBlockedDate && !formData.blockedDates.includes(newBlockedDate)) {
                          setFormData(prev => ({
                            ...prev,
                            blockedDates: [...prev.blockedDates, newBlockedDate].sort(),
                          }));
                          setNewBlockedDate('');
                        }
                      }}
                      disabled={!newBlockedDate}
                      className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-[var(--space-3)] pt-[var(--space-4)]">
                <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || formData.specialtyIds.length === 0}
                  className="flex-1 bg-accent"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {stylist ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : stylist ? (
                    'Update Stylist'
                  ) : (
                    'Create Stylist'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
