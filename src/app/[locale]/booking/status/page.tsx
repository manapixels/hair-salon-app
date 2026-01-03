'use client';

import { useState } from 'react';
import { Search, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import Link from 'next/link';

interface PendingBooking {
  appointmentId: string;
  date: string;
  time: string;
  categoryTitle?: string;
  stylistName?: string;
  deposit?: {
    id: string;
    amount: number;
    status: string;
    paymentUrl?: string;
  };
}

export default function BookingStatusPage() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSearching(true);
    setError('');
    setPendingBookings([]);

    try {
      const response = await fetch(`/api/bookings/pending?email=${encodeURIComponent(email)}`);
      const data = (await response.json()) as {
        pendingBookings?: PendingBooking[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search');
      }

      setPendingBookings(data.pendingBookings || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Your Booking</h1>
          <p className="text-gray-600 mb-6">
            Enter your email to view pending bookings and complete payment.
          </p>

          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <Button type="submit" disabled={isSearching} className="w-full">
              {isSearching ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Bookings
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {searched && pendingBookings.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No pending bookings found for this email.</p>
              <Link
                href="/booking"
                className="text-primary hover:underline text-sm mt-2 inline-block"
              >
                Make a new booking
              </Link>
            </div>
          )}

          {pendingBookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Pending Deposit Payments</h2>
              {pendingBookings.map(booking => (
                <div
                  key={booking.appointmentId}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.categoryTitle || 'Appointment'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.date).toLocaleDateString('en-SG', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {booking.time}
                      </p>
                      {booking.stylistName && (
                        <p className="text-sm text-gray-500">With {booking.stylistName}</p>
                      )}
                    </div>
                    {booking.deposit && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded">
                        ${(booking.deposit.amount / 100).toFixed(2)} due
                      </span>
                    )}
                  </div>
                  {booking.deposit?.paymentUrl && (
                    <a href={booking.deposit.paymentUrl} className="block w-full">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Complete Payment
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
