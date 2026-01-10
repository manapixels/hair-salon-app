'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Shield, AlertCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StripePaymentForm } from './StripePaymentForm';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DepositPaymentViewProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Inline Deposit Payment View
 * Displays as a standalone state within the booking flow (not a modal)
 */
export function DepositPaymentView({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: DepositPaymentViewProps) {
  const t = useTranslations('Deposit');

  return (
    <div className="text-center p-6 bg-white rounded-lg max-w-lg mx-auto">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary to-primary/90 -mx-6 -mt-6 px-6 py-6 rounded-t-lg text-white text-center mb-6">
        <Shield className="h-8 w-8 mx-auto mb-2 opacity-90" />
        <h2 className="text-xl font-bold text-white mb-1">{t('payDeposit')}</h2>
        <p className="text-white/80 text-sm">{t('securePayment')}</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-3 text-left">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">{t('firstTimeMessage')}</div>
      </div>

      {/* Stripe Payment Form */}
      <div className="mb-4">
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
            onSuccess={onSuccess}
            onError={msg => console.error(msg)}
          />
        </Elements>
      </div>

      {/* Refund Policy */}
      <p className="text-center text-xs text-gray-500 mb-4">{t('refundPolicy')}</p>

      {/* Cancel Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-700"
      >
        <X className="h-4 w-4 mr-1" />
        {t('cancelBooking', { fallback: 'Cancel Booking' })}
      </Button>
    </div>
  );
}

export default DepositPaymentView;
