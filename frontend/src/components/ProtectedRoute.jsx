import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-on-surface">
        <div className="p-8 bg-white border border-border-subtle rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center space-y-4">
          <svg className="h-12 w-12 text-neon-green animate-pulse" viewBox="0 0 200 200" fill="currentColor">
            <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
          </svg>
          <span className="text-sm font-mono text-on-surface-variant">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
