import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CloudProvider } from './context/CloudContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center p-6 text-center select-none font-sans">
          <div className="bg-white border border-[#e6e8eb] rounded-2xl p-8 max-w-md shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ⚠
            </div>
            <h2 className="text-lg font-bold text-black mb-1.5">Something went wrong</h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Unauthorized = () => (
  <div className="bg-white border border-border-subtle rounded-xl p-8 text-center max-w-md mx-auto mt-20 shadow-sm">
    <h2 className="text-xl font-bold text-on-surface mb-2">Unauthorized Access</h2>
    <p className="text-sm text-on-surface-variant mb-4">Your assigned role lacks authorization permissions to view this resource.</p>
    <Navigate to="/dashboard" replace />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CloudProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<Landing />} />
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
              <Route path="/history" element={<ScanHistory />} />
              
              {/* Admin & Security Analyst Only Routes (Hidden/Removed for Viewer) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Security Analyst']} />}>
                <Route path="/reports" element={<ExecutiveReports />} />
                <Route path="/settings" element={<SystemSettings />} />
              </Route>
              
              {/* Redirect any nested route query to main dashboard */}
              <Route path="" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Global redirect fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </CloudProvider>
  </AuthProvider>
</ErrorBoundary>
  );
}

export default App;
