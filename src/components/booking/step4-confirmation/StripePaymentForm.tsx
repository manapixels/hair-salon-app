'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StripePaymentFormProps {
  amount: number; // in cents
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Stripe Payment Form using Payment Elements
 * Handles card input, Apple Pay, Google Pay
 */
export function StripePaymentForm({ amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('Deposit');

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/payment-success`,
        },
        redirect: 'if_required', // Only redirect if needed (e.g., 3D Secure)
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        // Payment is processing - webhook will confirm
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
      onError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const amountFormatted = `$${(amount / 100).toFixed(2)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          // Disable "Save my information for faster checkout" (Stripe Link)
          terms: {
            card: 'never',
          },
        }}
      />

      {errorMessage && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {t('processing', { fallback: 'Processing...' })}
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            {t('payDeposit', { fallback: 'Pay Deposit' })} {amountFormatted}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        {t('securePayment', { fallback: 'Secure payment powered by Stripe' })}
      </p>
    </form>
  );
}

export default StripePaymentForm;
