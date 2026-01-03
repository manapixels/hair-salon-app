'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { Shield, CreditCard, AlertCircle } from 'lucide-react';

interface DepositStepProps {
  customerEmail: string;
  customerName: string;
  appointmentId: string;
  totalPrice: number; // in cents
  onDepositRequired: (paymentUrl: string) => void;
  onNoDepositRequired: () => void;
  onError: (message: string) => void;
}

/**
 * Deposit check and payment redirect component
 * Checks if user requires deposit and initiates HitPay payment if needed
 */
export const DepositStep: React.FC<DepositStepProps> = ({
  customerEmail,
  customerName,
  appointmentId,
  totalPrice,
  onDepositRequired,
  onNoDepositRequired,
  onError,
}) => {
  const t = useTranslations('Deposit');
  const [isChecking, setIsChecking] = useState(true);
  const [depositInfo, setDepositInfo] = useState<{
    required: boolean;
    amount: number;
    percentage: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        }),
      });

      const data = (await response.json()) as {
        required: boolean;
        amount?: number;
        percentage?: number;
        error?: string;
        paymentUrl?: string;
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

  const handlePayDeposit = async () => {
    if (!depositInfo) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          totalPrice,
          customerEmail,
          customerName,
        }),
      });

      const data = (await response.json()) as {
        required: boolean;
        paymentUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error || 'Failed to create payment');
      }

      // Redirect to HitPay payment page
      onDepositRequired(data.paymentUrl);
      window.location.href = data.paymentUrl;
    } catch (error: any) {
      onError(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">Checking booking requirements...</p>
      </div>
    );
  }

  if (!depositInfo?.required) {
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

      <Button
        onClick={handlePayDeposit}
        disabled={isProcessing}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay Deposit {amountFormatted}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Secure payment via PayNow, Card, or GrabPay
      </p>
    </div>
  );
};

export default DepositStep;
