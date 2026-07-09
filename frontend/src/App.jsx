import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

// Simple modular placeholder pages for navigation targets
const CloudAccounts = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Cloud Accounts Manager</h2>
    <p className="text-sm text-gray-400">AWS credentials configuration panel will be implemented in **Sprint 4**.</p>
  </div>
);

const ResourceExplorer = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Resource Explorer</h2>
    <p className="text-sm text-gray-400">AWS assets inventory scanner tables will be implemented in **Sprint 5**.</p>
  </div>
);

const SecurityFindings = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Security Findings & Risks</h2>
    <p className="text-sm text-gray-400">Rule engine risk scan outputs will be implemented in **Sprint 6**.</p>
  </div>
);

const ComplianceBenchmarks = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Compliance Benchmarks</h2>
    <p className="text-sm text-gray-400">CIS Foundations Benchmarking metrics will be implemented in **Sprint 8**.</p>
  </div>
);

const ExecutiveReports = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Executive PDF Reports</h2>
    <p className="text-sm text-gray-400">Downloadable PDFKit security report engines will be implemented in **Sprint 8**.</p>
  </div>
);

const ScanHistory = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">Scan History & Trends</h2>
    <p className="text-sm text-gray-400">Scan histories and trend analysis charts will be implemented in **Sprint 10**.</p>
  </div>
);

const SystemSettings = () => (
  <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 cyber-glass">
    <h2 className="text-xl font-bold text-white mb-2">System Settings</h2>
    <p className="text-sm text-gray-400">Notification and scanning preferences will be configured in **Sprint 10**.</p>
  </div>
);

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
