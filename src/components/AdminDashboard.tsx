import { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import type { TimeSlot } from '../types';

const AdminDashboard: React.FC = () => {
  const {
    adminSettings,
    getAvailableSlots,
    blockTimeSlot,
    unblockTimeSlot,
    appointments,
    fetchAndSetAdminSettings,
    saveAdminSettings,
  } = useBooking();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingTime, setOpeningTime] = useState(adminSettings.openingTime);
  const [closingTime, setClosingTime] = useState(adminSettings.closingTime);

  useEffect(() => {
    // FIX: `fetchAndSetAdminSettings` returns `Promise<void>`, so its resolved value cannot be used.
    // This call triggers a context update, and another `useEffect` syncs the local state.
    fetchAndSetAdminSettings();
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

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Admin Dashboard</h2>

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
  );
};

export default AdminDashboard;
