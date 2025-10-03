'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface WhatsAppOTPLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function WhatsAppOTPLogin({ onSuccess, onBack }: WhatsAppOTPLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [existingName, setExistingName] = useState('');

  const checkUserExists = async (phone: string) => {
    if (!phone || phone.length < 10) return;

    try {
      const response = await fetch('/api/auth/whatsapp/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (data.exists) {
        setIsReturningUser(true);
        setExistingName(data.name || 'User');
      } else {
        setIsReturningUser(false);
        setExistingName('');
      }
    } catch (error) {
      console.error('Failed to check user:', error);
      // Don't block login flow on error
      setIsReturningUser(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/whatsapp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Show test OTP if available (for development when WhatsApp fails)
      if (data.testOtp) {
        toast.info(`Development mode: Your OTP is ${data.testOtp}`, { duration: 10000 });
      }

      setExpiresAt(Date.now() + data.expiresIn * 1000);
      setStep('otp');
      toast.success('Verification code sent to your WhatsApp');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send OTP';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Trigger auth refresh
      window.dispatchEvent(new Event('auth-refresh'));
      toast.success('Login successful! Welcome to Luxe Cuts.');
      onSuccess();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Verification failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits and non-plus
    const cleaned = value.replace(/[^\d+]/g, '');

    // Ensure it starts with +
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }

    return cleaned;
  };

  if (step === 'phone') {
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sign in with WhatsApp
        </h3>

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <PhoneInput
              international
              defaultCountry="SG"
              value={phoneNumber}
              onChange={value => {
                setPhoneNumber(value || '');
                if (value && value.length >= 10) {
                  checkUserExists(value);
                }
              }}
              placeholder="Enter phone number"
              className="phone-input-wrapper"
              disabled={loading}
              required
            />
          </div>

          {isReturningUser && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                <span>👋</span>
                <span>Welcome back, {existingName}!</span>
              </p>
            </div>
          )}

          {!isReturningUser && phoneNumber && phoneNumber.length >= 10 && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                disabled={loading}
                required
              />
            </div>
          )}

          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            ← Back to login options
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Enter Verification Code
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        We sent a 6-digit code to <strong>{phoneNumber}</strong> via WhatsApp.
      </p>

      <form onSubmit={handleOTPSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-center text-lg tracking-wider"
            maxLength={6}
            required
            disabled={loading}
            autoComplete="one-time-code"
          />
        </div>

        {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
          >
            ← Change phone number
          </button>

          <button
            type="button"
            onClick={async () => {
              setOtp('');
              setError('');
              await handlePhoneSubmit(new Event('submit') as any);
              toast.info('New verification code sent');
            }}
            disabled={loading}
            className="w-full text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm"
          >
            Resend code
          </button>
        </div>
      </form>
    </div>
  );
}
