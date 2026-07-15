import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center text-gray-100">
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex flex-col items-center space-y-4">
          <svg className="h-12 w-12 text-[#ff7a18] animate-pulse" viewBox="0 0 200 200" fill="currentColor">
            <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
          </svg>
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
