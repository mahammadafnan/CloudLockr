import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { HiShieldCheck, HiOutlineDatabase, HiServer, HiChip, HiRefresh } from 'react-icons/hi';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      // In Vite dev, the proxy in vite.config.js forwards '/api/health' to 'http://localhost:5000/api/health'
      const response = await axios.get('/api/health');
      setHealth(response.data);
      toast.success('Connected to SentinelCloud Backend API!');
    } catch (error) {
      console.error('Error fetching health status:', error);
      setHealth({
        status: 'error',
        message: 'Could not connect to backend. Make sure the backend server is running.',
        database: 'unknown'
      });
      toast.error('Failed to connect to SentinelCloud Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-gray-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="cyber-glass sticky top-0 z-50 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-500 animate-pulse-slow">
            <HiShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">
              Sentinel<span className="text-blue-500">Cloud</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">AI-powered CSPM</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800/40">
            Sprint 1: Project Setup
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-grow flex flex-col justify-center items-center w-full">
        <div className="w-full bg-[#111827] border border-gray-800 rounded-2xl p-8 glow-blue cyber-glass">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mb-3">
              Environment Setup Verification
            </h2>
            <p className="text-gray-400">
              SentinelCloud full-stack framework has been successfully initialized. Verify backend integration and database status below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Backend Server Status Card */}
            <div className="p-6 bg-[#0c1325]/80 border border-gray-800 rounded-xl flex items-start space-x-4">
              <div className={`p-3 rounded-lg text-white ${health?.status === 'healthy' ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-600/20 border border-red-500/30 text-red-400'}`}>
                <HiServer size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-semibold text-gray-300">Backend Express Server</h3>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-mono font-medium text-white">
                    {health?.status === 'healthy' ? 'ONLINE (Port 5000)' : 'OFFLINE'}
                  </span>
                </div>
                {health?.uptime && (
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    Uptime: {Math.floor(health.uptime)} seconds
                  </p>
                )}
              </div>
            </div>

            {/* MongoDB Status Card */}
            <div className="p-6 bg-[#0c1325]/80 border border-gray-800 rounded-xl flex items-start space-x-4">
              <div className={`p-3 rounded-lg text-white ${health?.database === 'connected' ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-600/20 border border-red-500/30 text-red-400'}`}>
                <HiOutlineDatabase size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-semibold text-gray-300">MongoDB Connection</h3>
                <div className="mt-1 flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${health?.database === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-mono font-medium text-white">
                    {health?.database === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  URI: {health?.status === 'healthy' ? '127.0.0.1:27017' : 'Pending Server Connection'}
                </p>
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
              <HiChip className="text-blue-500" />
              <span>System Metadata</span>
            </h3>
            <div className="bg-[#090d16] border border-gray-900 rounded-lg p-4 font-mono text-xs text-gray-400 overflow-x-auto space-y-1">
              <div><span className="text-blue-400">Node Environment:</span> {process.env.NODE_ENV || 'development'}</div>
              <div><span className="text-blue-400">API Health Status:</span> {health?.status || 'Unknown'}</div>
              <div><span className="text-blue-400">Server Time:</span> {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={checkHealth}
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Rechecking...' : 'Recheck Health'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-500 font-mono">
        © {new Date().getFullYear()} SentinelCloud. Managed with Mongoose & React + Vite.
      </footer>
    </div>
  );
}

export default App;
