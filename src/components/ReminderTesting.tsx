'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface ReminderResult {
  appointmentId: string;
  success: boolean;
  error?: string;
  method?: 'whatsapp' | 'telegram' | 'none';
}

interface ReminderTestResponse {
  message: string;
  appointmentsProcessed?: number;
  successful?: number;
  failed?: number;
  results?: ReminderResult[];
  formattedMessage?: string;
}

export default function ReminderTesting() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<ReminderTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestMessageFormat = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    const toastId = toast.loading('Testing message format...');

    try {
      const response = await fetch('/api/reminders/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body for format test
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(data);
        toast.success('Message format test completed', { id: toastId });
      } else {
        const errorMsg = data.error || 'Failed to test message format';
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUpcomingReminders = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    const toastId = toast.loading('Checking upcoming reminders...');

    try {
      const response = await fetch('/api/reminders/send');
      const data = await response.json();

      if (response.ok) {
        setTestResult(data);
        toast.info(`Found ${data.appointmentsProcessed || 0} upcoming appointments`, {
          id: toastId,
        });
      } else {
        const errorMsg = data.error || 'Failed to check upcoming reminders';
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestReminders = async () => {
    toast.custom(
      (t: string | number) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-gray-900 dark:text-white">
              This will send actual reminder messages to customers. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  setLoading(true);
                  setError(null);
                  setTestResult(null);
                  const toastId = toast.loading('Sending reminders...');

                  try {
                    const response = await fetch('/api/reminders/send', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });

                    const data = await response.json();

                    if (response.ok) {
                      setTestResult(data);
                      toast.success(
                        `Reminders sent successfully! ${data.successful || 0} sent, ${data.failed || 0} failed`,
                        { id: toastId },
                      );
                    } else {
                      const errorMsg = data.error || 'Failed to send reminders';
                      setError(errorMsg);
                      toast.error(errorMsg, { id: toastId });
                    }
                  } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
                    setError(errorMsg);
                    toast.error(errorMsg, { id: toastId });
                  } finally {
                    setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          <i className="fa-solid fa-bell mr-2"></i>
          Appointment Reminders Testing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleTestMessageFormat}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-message text-blue-600 text-2xl mb-2"></i>
            <span className="font-medium text-blue-800 dark:text-blue-200">
              Test Message Format
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-300 text-center">
              Preview reminder message without sending
            </span>
          </button>

          <button
            onClick={handleCheckUpcomingReminders}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-calendar-check text-green-600 text-2xl mb-2"></i>
            <span className="font-medium text-green-800 dark:text-green-200">Check Upcoming</span>
            <span className="text-sm text-green-600 dark:text-green-300 text-center">
              View appointments needing reminders
            </span>
          </button>

          <button
            onClick={handleSendTestReminders}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-paper-plane text-orange-600 text-2xl mb-2"></i>
            <span className="font-medium text-orange-800 dark:text-orange-200">Send Reminders</span>
            <span className="text-sm text-orange-600 dark:text-orange-300 text-center">
              Send actual reminders to customers
            </span>
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="text-gray-600 dark:text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Processing...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="text-red-800 dark:text-red-200">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          </div>
        )}

        {testResult && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              <i className="fa-solid fa-clipboard-list mr-2"></i>
              Test Results
            </h3>

            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Message: </span>
                <span className="text-gray-900 dark:text-white">{testResult.message}</span>
              </div>

              {testResult.appointmentsProcessed !== undefined && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Appointments Processed:{' '}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {testResult.appointmentsProcessed}
                  </span>
                </div>
              )}

              {testResult.successful !== undefined && (
                <div className="text-sm">
                  <span className="font-medium text-green-700 dark:text-green-300">
                    Successful:{' '}
                  </span>
                  <span className="text-green-900 dark:text-green-100">
                    {testResult.successful}
                  </span>
                </div>
              )}

              {testResult.failed !== undefined && testResult.failed > 0 && (
                <div className="text-sm">
                  <span className="font-medium text-red-700 dark:text-red-300">Failed: </span>
                  <span className="text-red-900 dark:text-red-100">{testResult.failed}</span>
                </div>
              )}

              {testResult.formattedMessage && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Sample Message:
                  </span>
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-3 text-sm whitespace-pre-wrap font-mono">
                    {testResult.formattedMessage}
                  </div>
                </div>
              )}

              {testResult.results && testResult.results.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    Detailed Results:
                  </span>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {testResult.results.map((result, index) => (
                      <div
                        key={result.appointmentId}
                        className={`p-2 rounded text-sm ${
                          result.success
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                        }`}
                      >
                        <div className="font-medium">
                          Appointment {result.appointmentId.slice(-6)}
                        </div>
                        <div className="text-xs">
                          {result.success ? (
                            <>
                              <i className="fa-solid fa-check mr-1"></i>
                              Sent via {result.method}
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-times mr-1"></i>
                              {result.error}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
