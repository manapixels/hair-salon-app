import React, { useState } from 'react';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider, useAuth } from './context/AuthContext';

type View = 'booking' | 'admin';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('booking');
  const { user, logout } = useAuth();
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  const renderView = () => {
    switch (view) {
      case 'booking':
        return <BookingForm />;
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard /> : <p>Access Denied.</p>;
      default:
        return <BookingForm />;
    }
  };

  const NavButton: React.FC<{ currentView: View; targetView: View; children: React.ReactNode }> = ({ currentView, targetView, children }) => {
    const isActive = currentView === targetView;
    return (
      <button
        onClick={() => setView(targetView)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
      </button>
    );
  };
  
  const AuthButton: React.FC<{onClick: () => void, children: React.ReactNode, primary?: boolean}> = ({onClick, children, primary}) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
    >
        {children}
    </button>
  )

  return (
     <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
        <header className="bg-white dark:bg-gray-900 shadow-md">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <i className="fa-solid fa-scissors text-3xl text-indigo-600 mr-3"></i>
              <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Luxe Cuts</h1>
            </div>
             <div className="flex items-center space-x-4">
               <div className="hidden sm:flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <NavButton currentView={view} targetView="booking">
                  <i className="fa-solid fa-calendar-check mr-2"></i> Book Online
                </NavButton>
                {user?.role === 'admin' && (
                  <NavButton currentView={view} targetView="admin">
                    <i className="fa-solid fa-user-shield mr-2"></i> Admin
                  </NavButton>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {user ? (
                    <>
                        <span className="text-sm font-medium hidden md:inline">Welcome, {user.name}!</span>
                        <AuthButton onClick={logout}>Logout</AuthButton>
                    </>
                ) : (
                    <>
                       <AuthButton onClick={() => setLoginOpen(true)}>Login</AuthButton>
                       <AuthButton onClick={() => setRegisterOpen(true)} primary>Sign Up</AuthButton>
                    </>
                )}
              </div>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
        <footer className="text-center py-4 text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Luxe Cuts. All rights reserved.</p>
        </footer>
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setLoginOpen(false)} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setRegisterOpen(false)} onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }} />
    </>
  )
}


const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <AppContent />
      </BookingProvider>
    </AuthProvider>
  );
};


export default App;