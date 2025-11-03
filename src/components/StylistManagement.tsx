import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stylist, Service } from '../types';
import { SALON_SERVICES } from '../constants';

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
  });
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
      });
    } else {
      setFormData({
        name: '',
        email: '',
        bio: '',
        avatar: '',
        specialtyIds: [],
        workingHours: getDefaultWorkingHours(),
      });
    }
    setError('');
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
                  {stylist ? 'Edit Stylist' : 'Add New Stylist'}
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
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Brief description of the stylist's experience and style"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Specialties *
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
                    {SALON_SERVICES.map(service => {
                      const isSelected = formData.specialtyIds.includes(service.id);
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
                            onChange={() => handleSpecialtyToggle(service.id)}
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
                    disabled={isLoading || formData.specialtyIds.length === 0}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {stylist ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : stylist ? (
                      'Update Stylist'
                    ) : (
                      'Create Stylist'
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
