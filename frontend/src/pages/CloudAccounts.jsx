import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineKey, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineCloud } from 'react-icons/hi';

const CloudAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get('/api/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (error) {
        console.error('[Accounts API] Error:', error.message);
        toast.error('Failed to query account settings.');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // AWS Scanner mode check
  const isMockMode = !process.env.AWS_ACCESS_KEY_ID;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Cloud Accounts</h2>
        <p className="text-sm text-gray-400 mt-1">Manage connected AWS cloud boundaries and IAM scanning credentials.</p>
      </div>

      {/* Account Settings Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 border border-gray-800 rounded-xl cyber-glass glow-blue space-y-6">
          <div className="flex items-start justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                <HiOutlineCloud size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">AWS Integration Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">Primary Scan scope credentials setup</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
              isMockMode 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {isMockMode ? 'Mock Fallback Mode' : 'Connected'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Account Status</span>
              <div className="flex items-center space-x-1.5 text-gray-300">
                <HiOutlineCheckCircle className="h-4 w-4 text-emerald-400" />
                <span>Inventory Ingestion Enabled</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Scanning Scope</span>
              <div className="text-gray-300">S3, EC2, IAM, SGs, CloudTrail</div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">Default Region</span>
              <div className="text-gray-300">us-east-1 (Global default)</div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-sans tracking-wider font-semibold">AWS Access Key</span>
              <div className="text-gray-300">AKIA************ (Masked Environment Key)</div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <HiOutlineExclamation className="text-blue-400 h-4 w-4" />
            <span>AWS Setup Guidelines</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            To configure a live scanning boundary, update your backend environment configuration file (<code>.env</code>) with programmatic IAM read-only access keys:
          </p>
          <pre className="p-3 bg-black border border-gray-800 text-[10px] text-emerald-400 rounded-lg font-mono leading-normal overflow-x-auto">
            AWS_ACCESS_KEY_ID=AKIA...<br />
            AWS_SECRET_ACCESS_KEY=...<br />
            AWS_REGION=us-east-1
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CloudAccounts;
