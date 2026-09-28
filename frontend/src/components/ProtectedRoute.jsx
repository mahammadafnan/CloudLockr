import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center text-on-surface">
        <div className="p-8 bg-white border border-border-subtle rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-[#39ff14] rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-on-surface-variant">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = (user?.role || '').toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
