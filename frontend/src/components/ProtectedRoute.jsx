import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiShieldCheck } from 'react-icons/hi';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center text-gray-100">
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col items-center space-y-4">
          <HiShieldCheck className="h-12 w-12 text-blue-500 animate-spin" />
          <span className="text-sm font-mono text-gray-400">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If the user's role is not authorized, redirect to dashboard or access denied
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
