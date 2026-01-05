'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from '@/lib/icons';
import { LoadingSpinner } from '@/components/feedback/loaders/LoadingSpinner';
import { BookingConfirmationSummary } from './BookingConfirmationSummary';
import OAuthLoginModal from '@/components/auth/OAuthLoginModal';
import type { Service, Stylist, ServiceCategory } from '@/types';

interface ConfirmationFormProps {
  onConfirm: (name: string, email: string) => void;
  isSubmitting: boolean;
  selectedCategory?: ServiceCategory | null;
  selectedStylist: Stylist | null;
  selectedDate: Date;
  selectedTime: string;
  totalDuration: number;
}

export const ConfirmationForm: React.FC<ConfirmationFormProps> = ({
  onConfirm,
  isSubmitting,
  selectedCategory,
  selectedStylist,
  selectedDate,
  selectedTime,
  totalDuration,
}) => {
  const t = useTranslations('BookingForm');
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Please fill in both your name and email.');
      return;
    }
    setError('');
    onConfirm(name, email);
  };

  return (
    <div>
      <h2 id="step-4-heading" className="text-lg font-semibold mb-4 text-gray-800">
        {t('step4')}
      </h2>

      <BookingConfirmationSummary
        selectedCategory={selectedCategory}
        selectedStylist={selectedStylist}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        totalDuration={totalDuration}
      />

      <form onSubmit={handleSubmit} className="mx-auto bg-gray-50/50 rounded-xl">
        <div className="px-6 py-4 space-y-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="text-md font-semibold text-gray-800">{t('bookingUsing')}</div>
            {user ? (
              <div className="text-sm text-gray-500">{t('loggedIn')}</div>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
              >
                {t('logIn')}
              </button>
            )}
          </div>
          <InputGroup className="bg-white">
            <InputGroupInput
              id="name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              disabled={!!user}
              required
              className="text-base"
            />
            <InputGroupAddon align="block-start">
              <Label htmlFor="name" className="text-foreground">
                {t('name')}
              </Label>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup className="bg-white">
            <InputGroupInput
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={!!user}
              required
              className="text-base"
            />
            <InputGroupAddon align="block-start">
              <Label htmlFor="email" className="text-foreground">
                {t('email')}
              </Label>
            </InputGroupAddon>
          </InputGroup>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isSubmitting}
          className="w-full py-6 text-base"
          aria-label={isSubmitting ? t('bookingInProgress') : t('confirmYourAppointment')}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('booking')}
            </>
          ) : (
            <>
              <Check className="h-6 w-6 mr-2" aria-hidden="true" />
              {t('confirmAppointment')}
            </>
          )}
        </Button>
      </form>

      <OAuthLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};
