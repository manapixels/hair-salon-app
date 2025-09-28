'use client';

import ReminderTesting from './ReminderTesting';

export default function RemindersPanel() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <i className="fa-solid fa-bell text-indigo-600 text-xl"></i>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appointment Reminders
          </h1>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <i className="fa-solid fa-info-circle text-blue-600 mt-1"></i>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                How Appointment Reminders Work
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Automatically sends reminders 24 hours before appointments</li>
                <li>• Uses WhatsApp for WhatsApp users, Telegram for Telegram users</li>
                <li>• Only sends to registered users (not guest bookings)</li>
                <li>• Includes appointment details, services, stylist, and pricing</li>
              </ul>
            </div>
          </div>
        </div>

        <ReminderTesting />

        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            <i className="fa-solid fa-cog mr-2"></i>
            Automated Setup
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>For Production:</strong> Set up automated reminders using Vercel Cron or
              external cron services.
            </p>
            <p>
              <strong>API Endpoint:</strong>{' '}
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                POST /api/reminders/send
              </code>
            </p>
            <p>
              <strong>Documentation:</strong> See <code>REMINDER_SETUP.md</code> for detailed setup
              instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
