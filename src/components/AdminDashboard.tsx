import { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import type { TimeSlot, Appointment } from '../types';
import EditAppointmentModal from './EditAppointmentModal';
import StylistManagement from './StylistManagement';

const AdminDashboard: React.FC = () => {
  const {
    adminSettings,
    getAvailableSlots,
    blockTimeSlot,
    unblockTimeSlot,
    appointments,
    fetchAndSetAdminSettings,
    fetchAndSetAppointments,
    saveAdminSettings,
  } = useBooking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingTime, setOpeningTime] = useState(adminSettings.openingTime);
  const [closingTime, setClosingTime] = useState(adminSettings.closingTime);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'stylists' | 'availability'>(
    'appointments',
  );
  const [showStylistManagement, setShowStylistManagement] = useState(false);

  useEffect(() => {
    // FIX: `fetchAndSetAdminSettings` returns `Promise<void>`, so its resolved value cannot be used.
    // This call triggers a context update, and another `useEffect` syncs the local state.
    fetchAndSetAdminSettings();
    fetchAndSetAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpeningTime(adminSettings.openingTime);
    setClosingTime(adminSettings.closingTime);
  }, [adminSettings]);

  useEffect(() => {
    const fetchAndProcessSlots = async () => {
      setLoading(true);
      const availableSlotsList = await getAvailableSlots(selectedDate);
      const allSlots = generateAllTimeSlots(adminSettings.openingTime, adminSettings.closingTime);

      const apptTimes = appointments
        .filter(a => new Date(a.date).toDateString() === selectedDate.toDateString())
        .map(a => a.time);

      const processedSlots = allSlots.map(slot => {
        let isAvailable = availableSlotsList.includes(slot.time) && !apptTimes.includes(slot.time);

        return {
          time: slot.time,
          available: isAvailable,
        };
      });
      setTimeSlots(processedSlots);
      setLoading(false);
    };

    fetchAndProcessSlots();
  }, [selectedDate, adminSettings, appointments, getAvailableSlots]);

  const handleTimeSlotClick = async (time: string, isAvailable: boolean) => {
    // Optimistic update
    setTimeSlots(prev =>
      prev.map(slot => (slot.time === time ? { ...slot, available: !isAvailable } : slot)),
    );
    try {
      if (isAvailable) {
        await blockTimeSlot(selectedDate, time);
      } else {
        await unblockTimeSlot(selectedDate, time);
      }
    } catch (error) {
      // Revert on error
      setTimeSlots(prev =>
        prev.map(slot => (slot.time === time ? { ...slot, available: isAvailable } : slot)),
      );
      alert('Failed to update slot.');
    }
  };

  const generateAllTimeSlots = (start: string, end: string) => {
    const slots: TimeSlot[] = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    while (currentTime < endTime) {
      slots.push({ time: currentTime.toTimeString().substring(0, 5), available: true });
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    return slots;
  };

  const handleSettingsSave = async () => {
    try {
      await saveAdminSettings({ ...adminSettings, openingTime, closingTime });
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save settings.');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditModalOpen(true);
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (
      window.confirm(
        `Are you sure you want to cancel the appointment for ${appointment.customerName}?`,
      )
    ) {
      try {
        const response = await fetch('/api/appointments/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: appointment.customerEmail,
            date: appointment.date.toISOString().split('T')[0],
            time: appointment.time,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to cancel appointment');
        }

        await fetchAndSetAppointments();
        alert('Appointment cancelled successfully');
      } catch (error) {
        alert('Failed to cancel appointment');
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const handleSaveAppointment = async (updatedData: Partial<Appointment>) => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch('/api/appointments/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAppointment.id,
          ...updatedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update appointment');
      }

      await fetchAndSetAppointments();
      setEditModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      throw error; // Re-throw for modal to handle
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      appointment.customerName.toLowerCase().includes(term) ||
      appointment.customerEmail.toLowerCase().includes(term) ||
      appointment.services.some(s => s.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h2>
        <button
          onClick={() => setShowStylistManagement(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors flex items-center"
        >
          <i className="fas fa-users mr-2"></i>
          Manage Stylists
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-600 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'appointments'
                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'availability'
                ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <i className="fas fa-clock mr-2"></i>
            Availability & Settings
          </button>
        </nav>
      </div>

      {activeTab === 'appointments' && (
        <div>
          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">All Appointments</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredAppointments.length} of {appointments.length} appointments
                </div>
              </div>
            </div>
            {filteredAppointments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {appointments.length === 0
                    ? 'No appointments booked yet.'
                    : 'No appointments match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Stylist
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredAppointments
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(appointment => (
                          <tr
                            key={appointment.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {new Date(appointment.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {appointment.customerName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.customerEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {appointment.stylist
                                  ? appointment.stylist.name
                                  : 'No stylist assigned'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {appointment.services.map(s => s.name).join(', ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {appointment.totalDuration} mins
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${appointment.totalPrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                                  title="Edit appointment"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appointment)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                  title="Cancel appointment"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Operating Hours</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label
                    htmlFor="openingTime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300"
                  >
                    Opening Time
                  </label>
                  <input
                    type="time"
                    id="openingTime"
                    value={openingTime}
                    onChange={e => setOpeningTime(e.target.value)}
                    className="mt-1 p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500"
                    step="1800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="closingTime"
                    className="block text-sm font-medium text-gray-600 dark:text-gray-300"
                  >
                    Closing Time
                  </label>
                  <input
                    type="time"
                    id="closingTime"
                    value={closingTime}
                    onChange={e => setClosingTime(e.target.value)}
                    className="mt-1 p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500"
                    step="1800"
                  />
                </div>
                <button
                  onClick={handleSettingsSave}
                  className="self-end bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Appointments Today</h3>
              <p className="text-4xl font-bold text-indigo-600">
                {
                  appointments.filter(
                    a => new Date(a.date).toDateString() === new Date().toDateString(),
                  ).length
                }
              </p>
            </div>
          </div>

          {/* Appointments Management Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">All Appointments</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredAppointments.length} of {appointments.length} appointments
                </div>
              </div>
            </div>
            {filteredAppointments.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {appointments.length === 0
                    ? 'No appointments booked yet.'
                    : 'No appointments match your search.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Services
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredAppointments
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map(appointment => (
                          <tr
                            key={appointment.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {new Date(appointment.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.time}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {appointment.customerName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.customerEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-gray-100">
                                {appointment.services.map(s => s.name).join(', ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {appointment.totalDuration} mins
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${appointment.totalPrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditAppointment(appointment)}
                                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                                  title="Edit appointment"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  onClick={() => handleCancelAppointment(appointment)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                  title="Cancel appointment"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Manage Availability</h3>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className="w-full md:w-auto p-2 border rounded-md bg-white dark:bg-gray-600 dark:border-gray-500 mb-4"
            />
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {timeSlots.map(({ time, available }) => {
                  const isBooked = appointments.some(
                    a =>
                      new Date(a.date).toDateString() === selectedDate.toDateString() &&
                      a.time === time,
                  );
                  let buttonClass = '';
                  if (isBooked) {
                    buttonClass = 'bg-red-500 text-white cursor-not-allowed';
                  } else if (available) {
                    buttonClass =
                      'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-700';
                  } else {
                    buttonClass =
                      'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-500';
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => !isBooked && handleTimeSlotClick(time, available)}
                      disabled={isBooked}
                      className={`p-3 rounded-md text-sm font-medium transition-colors text-center ${buttonClass}`}
                    >
                      {time}
                      {isBooked && <span className="block text-xs mt-1">Booked</span>}
                      {!isBooked &&
                        (available ? (
                          <span className="block text-xs mt-1">Available</span>
                        ) : (
                          <span className="block text-xs mt-1">Blocked</span>
                        ))}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
      />

      {/* Stylist Management Modal */}
      {showStylistManagement && (
        <StylistManagement onClose={() => setShowStylistManagement(false)} />
      )}
    </div>
  );
};

export default AdminDashboard;
