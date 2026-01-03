'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Check, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AppointmentDetails {
  date: string;
  time: string;
  categoryTitle?: string;
  stylistName?: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointmentDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (response.ok) {
        const data = (await response.json()) as {
          date: string;
          time: string;
          category?: { title: string };
          stylist?: { name: string };
        };
        setAppointment({
          date: data.date,
          time: data.time,
          categoryTitle: data.category?.title,
          stylistName: data.stylist?.name,
        });
      }
    } catch (error) {
      console.error('Failed to fetch appointment:', error);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else {
      setLoading(false);
    }
  }, [appointmentId, fetchAppointmentDetails]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deposit Received!</h1>
        <p className="text-gray-600 mb-6">
          Your booking has been confirmed. We&apos;ll see you soon!
        </p>

        {/* Appointment Details */}
        {appointment && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
            {appointment.categoryTitle && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{appointment.categoryTitle}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">
                {new Date(appointment.date).toLocaleDateString('en-SG', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at {appointment.time}
              </span>
            </div>
            {appointment.stylistName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">With {appointment.stylistName}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to you with all the details.
        </p>

        <div className="space-y-3">
          <Link href="/booking" className="block">
            <Button variant="default" className="w-full">
              Book Another Appointment
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
