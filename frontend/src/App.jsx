import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import CloudAccounts from './pages/CloudAccounts';
import ResourceExplorer from './pages/ResourceExplorer';
import SecurityFindings from './pages/SecurityFindings';
import ComplianceBenchmarks from './pages/ComplianceBenchmarks';
import ExecutiveReports from './pages/ExecutiveReports';
import ScanHistory from './pages/ScanHistory';
import SystemSettings from './pages/SystemSettings';
import { Toaster } from 'react-hot-toast';

const Unauthorized = () => (
  <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-8 text-center max-w-md mx-auto mt-20">
    <h2 className="text-xl font-bold text-red-500 mb-2">Unauthorized Access</h2>
    <p className="text-sm text-gray-400 mb-4">Your assigned role lacks authorization permissions to view this resource.</p>
    <Navigate to="/dashboard" replace />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Secure Protected Dashboard Workspace */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<CloudAccounts />} />
              <Route path="/resources" element={<ResourceExplorer />} />
              <Route path="/findings" element={<SecurityFindings />} />
              <Route path="/compliance" element={<ComplianceBenchmarks />} />
              <Route path="/reports" element={<ExecutiveReports />} />
              <Route path="/history" element={<ScanHistory />} />
              <Route path="/settings" element={<SystemSettings />} />
              
              {/* Redirect any nested route query to main dashboard */}
              <Route path="" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Global redirect fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
