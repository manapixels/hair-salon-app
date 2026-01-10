'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { StripePaymentForm } from './StripePaymentForm';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DepositStepProps {
  customerEmail: string;
  customerName: string;
  appointmentId: string;
  totalPrice: number; // in cents
  onDepositRequired: (paymentUrl: string) => void;
  onNoDepositRequired: () => void;
  onPaymentSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Deposit check and payment component
 * Embeds Stripe Payment Elements for inline payment
 */
export const DepositStep: React.FC<DepositStepProps> = ({
  customerEmail,
  customerName,
  appointmentId,
  totalPrice,
  onDepositRequired,
  onNoDepositRequired,
  onPaymentSuccess,
  onError,
}) => {
  const t = useTranslations('Deposit');
  const [isChecking, setIsChecking] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<{
    required: boolean;
    amount: number;
    percentage: number;
  } | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const checkDepositRequirement = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          totalPrice,
          customerEmail,
          customerName,
          source: 'web', // Use embedded Elements
        }),
      });

      const data = (await response.json()) as {
        required: boolean;
        clientSecret?: string;
        amount?: number;
        percentage?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check deposit requirement');
      }

      if (!data.required) {
        onNoDepositRequired();
        return;
      }

      setDepositInfo({
        required: true,
        amount: data.amount ?? 0,
        percentage: data.percentage ?? 15,
      });
      setClientSecret(data.clientSecret || null);
      setIsChecking(false);
    } catch (error: any) {
      console.error('[DepositStep] Error:', error);
      onError(error.message || 'Failed to process deposit check');
    }
  }, [appointmentId, totalPrice, customerEmail, customerName, onNoDepositRequired, onError]);

  // Check deposit requirement on mount
  useEffect(() => {
    checkDepositRequirement();
  }, [checkDepositRequirement]);

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    onPaymentSuccess();
  };

  const handlePaymentError = (message: string) => {
    onError(message);
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">
          {t('checkingRequirements', { fallback: 'Checking booking requirements...' })}
        </p>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="font-semibold text-green-900">
          {t('paymentSuccess', { fallback: 'Payment Successful!' })}
        </h3>
        <p className="text-sm text-green-700 mt-2">
          {t('bookingConfirmed', { fallback: 'Your booking is now confirmed.' })}
        </p>
      </div>
    );
  }

  if (!depositInfo?.required || !clientSecret) {
    return null;
  }

  const amountFormatted = `$${(depositInfo.amount / 100).toFixed(2)}`;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900">
            {t('depositRequired', { fallback: 'Deposit Required' })}
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            {t('firstTimeMessage', {
              fallback:
                'As a first-time customer, a small deposit is required to secure your booking.',
            })}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-amber-100">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {t('depositAmount', { fallback: 'Deposit' })} ({depositInfo.percentage}%)
          </span>
          <span className="text-xl font-bold text-gray-900">{amountFormatted}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {t('refundPolicy', {
            fallback: 'Fully refundable if cancelled 24+ hours before your appointment.',
          })}
        </p>
      </div>

      <div className="flex items-start gap-2 text-xs text-amber-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          {t('trustNote', {
            fallback: "After your first completed visit, future bookings won't require a deposit.",
          })}
        </span>
      </div>

      {/* Stripe Payment Elements */}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#d97706', // amber-600
              borderRadius: '8px',
            },
          },
        }}
      >
        <StripePaymentForm
          amount={depositInfo.amount}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </Elements>
    </div>
  );
};

export default DepositStep;
