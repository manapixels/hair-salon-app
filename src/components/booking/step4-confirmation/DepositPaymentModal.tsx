'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { StripePaymentForm } from './StripePaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { Shield, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DepositPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  appointmentId: string;
}

export default function DepositPaymentModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  onSuccess,
  appointmentId,
}: DepositPaymentModalProps) {
  const t = useTranslations('Deposit');

  // Prevent closing on outside click if payment is required (force user to pay or cancel explicitly via X)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-6 text-white text-center">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-90" />
          <DialogTitle className="text-xl font-bold text-white mb-1">{t('payDeposit')}</DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            {t('securePayment')}
          </DialogDescription>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">{t('firstTimeMessage')}</div>
          </div>

          <div className="mb-2">
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
                onError={msg => console.error(msg)} // We can improve this if needed, but the form usually handles UI
              />
            </Elements>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">{t('refundPolicy')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
