'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from '@/components/booking/step4-confirmation/StripePaymentForm';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appointmentId = searchParams.get('appointmentId');
  const clientSecret = searchParams.get('clientSecret');
  const amount = parseInt(searchParams.get('amount') || '0', 10);

  useEffect(() => {
    if (!appointmentId || !clientSecret) {
      setError('Missing payment information. Please try booking again.');
    }
  }, [appointmentId, clientSecret]);

  const handlePaymentSuccess = async () => {
    setPaymentComplete(true);
    toast.success('Payment successful! Your booking is confirmed.');

    // Email confirmation is sent server-side via payment webhook

    // Redirect to success page after delay
    setTimeout(() => {
      router.push(`/booking/payment-success?appointmentId=${appointmentId}`);
    }, 2000);
  };

  const handlePaymentError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/book')}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Your booking has been confirmed.</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white text-center">
            <Shield className="h-10 w-10 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Complete Your Booking</h1>
            <p className="text-white/80 mt-2">Secure deposit payment required</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">First-time booking deposit</p>
                  <p className="text-sm text-amber-700 mt-1">
                    As a first-time customer, a small deposit secures your appointment. It&apos;s
                    fully refundable if you cancel 24+ hours in advance.
                  </p>
                </div>
              </div>
            </div>

            {/* Stripe Payment Form */}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#7A6400',
                    borderRadius: '8px',
                  },
                },
              }}
            >
              <StripePaymentForm
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Payments secured by Stripe. Your card details are never stored on our servers.
        </p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
