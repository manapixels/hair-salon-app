'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Shield,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  LogIn,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import OAuthLoginModal from '../auth/OAuthLoginModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface AccountPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountPopup({ isOpen, onClose }: AccountPopupProps) {
  const t = useTranslations('AccountPopup');
  const { user, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Popup Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed bottom-20 left-4 right-4 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('title')}
                </h3>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />

                  <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {user ? (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                        <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
                          {user.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                          {user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-2">
                      {user.role === 'CUSTOMER' && (
                        <Link
                          href="/dashboard"
                          onClick={onClose}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                              <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {t('dashboard')}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        </Link>
                      )}

                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={onClose}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                              <Shield className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {t('adminPanel')}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('signingOut')}
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          {t('signOut')}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {t('signIn')}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('loginPrompt')}</p>
                    </div>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={() => setIsLoginOpen(true)}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {t('signInSignUp')}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OAuthLoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
