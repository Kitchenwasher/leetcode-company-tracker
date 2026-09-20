import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, setShowAuthModal } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowAuthModal(true);
    }
  }, [isLoading, isAuthenticated, setShowAuthModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B0F] text-primary flex flex-col items-center justify-center font-mono space-y-4">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-zinc-400 tracking-wider">// VERIFYING_SESSION_CREDENTIALS...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
