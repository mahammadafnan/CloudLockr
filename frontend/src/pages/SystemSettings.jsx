import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineAdjustments, HiOutlineCheckCircle, HiOutlineClock, HiOutlineServer } from 'react-icons/hi';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axios.get('/api/health');
        setHealth(res.data);
      } catch (error) {
        console.error('[Health API] Error:', error.message);
        toast.error('Failed to query backend system diagnostics.');
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">System Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure scanning job schedulers, email alert notifications, and view diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Diagnostics */}
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass glow-blue md:col-span-2 space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <HiOutlineServer size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Diagnostics & Status</h3>
              <p className="text-xs text-gray-400 mt-0.5">Core Express Node.js & Database indicators</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Backend Status</span>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <HiOutlineCheckCircle className="h-4 w-4" />
                <span>{health?.status === 'healthy' ? 'HEALTHY (ACTIVE)' : 'OFFLINE'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Database Link</span>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <HiOutlineCheckCircle className="h-4 w-4" />
                <span>{health?.database === 'connected' ? 'MONGODB CONNECTED' : 'DISCONNECTED'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">System Uptime</span>
              <div className="text-gray-300">{Math.round(health?.uptime || 0)} seconds</div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Server Local Time</span>
              <div className="text-gray-300">{health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Scan scheduler configurations */}
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <HiOutlineClock className="text-blue-400 h-4 w-4" />
            <span>Scanning Jobs Scheduler</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Automated scanning jobs are scheduled via node-cron server schedulers to execute every midnight (00:00 UTC) dynamically.
          </p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-850">
            <span className="text-xs text-gray-400">Daily Cron Audit:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
