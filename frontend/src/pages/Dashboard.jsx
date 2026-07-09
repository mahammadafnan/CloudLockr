import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  HiShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineClock
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);

  const triggerScan = () => {
    if (user.role === 'Viewer') {
      toast.error('Access Denied: Viewers cannot initiate manual scans.');
      return;
    }

    setScanning(true);
    toast.promise(
      new Promise((res) => setTimeout(res, 2000)),
      {
        loading: 'Discovering AWS cloud resources and scanning configurations...',
        success: 'Security scan complete! Posture index recalculated.',
        error: 'Scan failed.'
      }
    ).then(() => setScanning(false));
  };

  const cards = [
    { title: 'Security Score', value: '84/100', change: '+2.4%', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', desc: 'Recalculated 3m ago', icon: <HiShieldCheck size={28} /> },
    { title: 'Critical Issues', value: '2', change: 'Resolve now', color: 'border-red-500/20 text-red-500 bg-red-500/5', desc: 'Action required immediately', icon: <HiOutlineShieldExclamation size={28} /> },
    { title: 'High Issues', value: '7', change: '-3 this week', color: 'border-orange-500/20 text-orange-400 bg-orange-500/5', desc: 'Resolve within 24h', icon: <HiOutlineExclamation size={28} /> },
    { title: 'Medium Issues', value: '18', change: 'Stable', color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5', desc: 'Standard compliance items', icon: <HiOutlineExclamation size={28} /> },
    { title: 'Cloud Accounts', value: '1 Active', change: 'AWS account', color: 'border-blue-500/20 text-blue-400 bg-blue-500/5', desc: '1 connected account', icon: <HiOutlineShieldCheck size={28} /> },
    { title: 'Discovered Assets', value: '142', change: '+12 discovered', color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5', desc: 'EC2, S3, IAM resources', icon: <HiOutlineTrendingUp size={28} /> },
    { title: 'Compliance Rate', value: '78.5%', change: 'NIST & CIS', color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5', desc: 'CIS Foundations Benchmark', icon: <HiShieldCheck size={28} /> },
    { title: 'Last Scan Finished', value: '10:45 AM', change: 'Manual', color: 'border-gray-800 text-gray-300 bg-gray-800/10', desc: 'Recalculation completed', icon: <HiOutlineClock size={28} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Posture Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time security posture checks for user <span className="text-blue-400 font-semibold font-mono">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/10 active:scale-95 transition-all duration-150"
          >
            <HiOutlineRefresh className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning AWS...' : 'Run Security Scan'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`p-6 border rounded-xl cyber-glass glow-blue flex flex-col justify-between h-40 hover:scale-[1.02] transition-all duration-200 cursor-pointer ${card.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.title}</p>
                <p className="text-3xl font-extrabold text-white mt-2 tracking-tight">{card.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-900/30 border border-white/5">{card.icon}</div>
            </div>
            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-400 uppercase">{card.desc}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Highlights layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active findings panel mockup */}
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-xl p-6 cyber-glass">
          <h3 className="text-base font-semibold text-white mb-4">Critical Pending Actions</h3>
          <div className="space-y-4">
            <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-lg flex items-start justify-between">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                  Critical
                </span>
                <h4 className="text-sm font-semibold text-white mt-2">S3 Public Bucket Access Detected</h4>
                <p className="text-xs text-gray-400 mt-1">Bucket: `sentinelcloud-production-logs` is fully accessible to anyone on the internet.</p>
              </div>
              <span className="text-xs font-mono text-gray-500">AWS S3</span>
            </div>
            <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-lg flex items-start justify-between">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                  Critical
                </span>
                <h4 className="text-sm font-semibold text-white mt-2">EC2 Instance SSH Port 22 Open to Internet</h4>
                <p className="text-xs text-gray-400 mt-1">Security Group `sg-0e99812df` allows connections from `0.0.0.0/0` on Port 22.</p>
              </div>
              <span className="text-xs font-mono text-gray-500">AWS EC2</span>
            </div>
          </div>
        </div>

        {/* Audit Details mockup */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 cyber-glass">
          <h3 className="text-base font-semibold text-white mb-4">Compliance Status</h3>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">CIS Foundations Benchmark:</span>
              <span className="text-yellow-400 font-semibold">68% Passed</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">AWS Best Practices Audit:</span>
              <span className="text-emerald-400 font-semibold">82% Passed</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Basic NIST framework:</span>
              <span className="text-yellow-400 font-semibold">75% Passed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Scan Job Scheduler:</span>
              <span className="text-emerald-400 font-semibold">Enabled (Daily)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
