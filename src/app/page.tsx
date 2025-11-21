'use client';

import LandingPage from '../components/views/LandingPage';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <LandingPage />
      </main>
    </div>
  );
}
