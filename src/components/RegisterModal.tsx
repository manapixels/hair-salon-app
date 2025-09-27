import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TelegramLoginWidget from './TelegramLoginWidget';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register(name, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [telegramBotUsername, setTelegramBotUsername] = useState<string>('');

  useEffect(() => {
    // Load Telegram bot username for widget
    if (isOpen) {
      fetch('/api/auth/telegram')
        .then(res => res.json())
        .then(data => {
          if (data.botUsername) {
            setTelegramBotUsername(data.botUsername);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleWhatsAppRegister = () => {
    // Redirect to WhatsApp OAuth flow (same as login since OAuth handles both)
    window.location.href = '/api/auth/whatsapp';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          Create Your Account
        </h2>

        <div className="space-y-3">
          <button
            onClick={handleWhatsAppRegister}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#25D366] hover:bg-[#1EBE57] disabled:bg-[#25D366]/60 transition-colors"
          >
            <i className="fa-brands fa-whatsapp text-xl mr-2"></i>
            {isLoading ? 'Connecting...' : 'Sign Up with WhatsApp'}
          </button>
          {telegramBotUsername ? (
            <TelegramLoginWidget
              botUsername={telegramBotUsername}
              buttonSize="large"
              requestAccess="write"
              className="w-full"
            />
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
            >
              <i className="fa-brands fa-telegram text-xl mr-2"></i>
              Telegram Not Configured
            </button>
          )}
        </div>

        <div className="my-4 flex items-center before:flex-1 before:border-t before:border-gray-300 dark:before:border-gray-600 after:flex-1 after:border-t after:border-gray-300 dark:after:border-gray-600">
          <p className="text-center text-sm mx-4 text-gray-500 dark:text-gray-400">OR</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="register-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="register-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              type="password"
              id="register-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up with Email'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;
