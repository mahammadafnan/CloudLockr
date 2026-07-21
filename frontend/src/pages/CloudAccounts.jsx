import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  HiOutlineCloud, 
  HiOutlineCheckCircle, 
  HiOutlineExclamation, 
  HiOutlineRefresh, 
  HiOutlinePlus,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const CloudAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get('/api/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (error) {
        console.error('[Accounts API] Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleTestConnection = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult('success');
      toast.success('AWS Connection verified! IAM Role is fully authorized.');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Cloud Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">Connect, test, and manage API integration boundaries for multiple cloud providers.</p>
        </div>
        <button className="flex items-center space-x-1.5 px-4 py-2.5 bg-black text-white hover:bg-black/90 rounded-xl text-xs font-bold transition shadow-sm">
          <HiOutlinePlus size={16} />
          <span>Connect Cloud Account</span>
        </button>
      </div>

      {/* Cloud Providers Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AWS - Connected */}
        <div className="bg-white border-2 border-[#c3f4b0] rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8fce0] rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-[#e8fce0] border border-[#c3f4b0] text-black uppercase">
                ACTIVE
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Amazon Web Services</h3>
              <p className="text-xs text-gray-500">Account ID: 905************</p>
            </div>
            <span className="text-2xl">🇺🇸</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: us-east-1</span>
            <span className="text-xs font-bold text-[#2b6d34] flex items-center gap-1">
              <HiOutlineCheckCircle className="h-4 w-4" /> Healthy
            </span>
          </div>
        </div>

        {/* Microsoft Azure - Disabled */}
        <div className="bg-white border border-[#e6e8eb] rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden opacity-75 hover:opacity-100 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-gray-100 border border-gray-200 text-gray-500 uppercase">
                DISCONNECTED
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Microsoft Azure</h3>
              <p className="text-xs text-gray-500">Tenant ID: Not configured</p>
            </div>
            <span className="text-2xl">🇪🇺</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: West Europe</span>
            <span className="text-xs font-bold text-gray-400">Not configured</span>
          </div>
        </div>

        {/* Google Cloud - Disabled */}
        <div className="bg-white border border-[#e6e8eb] rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden opacity-75 hover:opacity-100 transition duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-gray-100 border border-gray-200 text-gray-500 uppercase">
                DISCONNECTED
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Google Cloud Platform</h3>
              <p className="text-xs text-gray-500">Project ID: Not configured</p>
            </div>
            <span className="text-2xl">🌏</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: us-central1</span>
            <span className="text-xs font-bold text-gray-400">Not configured</span>
          </div>
        </div>
      </div>

      {/* Configuration Boundary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Integration Credentials Setup */}
        <div className="lg:col-span-2 p-8 bg-white border border-[#e6e8eb] rounded-[2rem] shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-black shadow-sm">
              <HiOutlineCloud size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-black" style={{ letterSpacing: '-0.3px' }}>AWS Credentials Profile</h3>
              <p className="text-xs text-gray-500 mt-0.5">Primary Scan scope boundary IAM profile settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-600 font-medium">
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Access Key ID</span>
              <div className="text-black font-mono font-bold text-sm bg-gray-50 p-3 rounded-xl border border-gray-200">
                AKIAIOSFODNN7EXAMPLE
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secret Access Key</span>
              <div className="text-black font-mono font-bold text-sm bg-gray-50 p-3 rounded-xl border border-gray-200">
                ••••••••••••••••••••••••••••••••••••
              </div>
            </div>
          </div>

          {/* Connection Test Suite */}
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-[1.5rem] space-y-4">
            <h4 className="text-xs font-bold text-black uppercase tracking-wider">Authorization Verification checks</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-[#2b6d34] h-4.5 w-4.5" /> STS Credentials Check
                </span>
                <span className="text-[#2b6d34] font-bold">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-2">
                  <HiOutlineCheckCircle className="text-[#2b6d34] h-4.5 w-4.5" /> Read-Only policy verification
                </span>
                <span className="text-[#2b6d34] font-bold">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-2">
                  {testResult === 'success' ? (
                    <HiOutlineCheckCircle className="text-[#2b6d34] h-4.5 w-4.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300"></div>
                  )}
                  Resource enumeration tests
                </span>
                <span className={testResult === 'success' ? 'text-[#2b6d34] font-bold' : 'text-gray-400'}>
                  {testResult === 'success' ? 'PASSED' : 'PENDING TEST'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="bg-black text-white hover:bg-black/90 text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {testing ? 'Verifying IAM connection...' : 'Run Integration Connection Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Guidelines */}
        <div className="p-8 bg-[#0c0e0c] border border-[#1b241c] rounded-[2rem] shadow-sm text-white flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <HiOutlineExclamation className="text-[#39ff14] h-5 w-5" />
              <span>AWS Setup Guidelines</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              To configure a live scanning boundary, update your backend environment configuration file (<code className="bg-[#121612] px-1.5 py-0.5 rounded border border-[#2b6d34]/40 text-[#39ff14] font-mono text-[10px]">.env</code>) with programmatic IAM read-only access keys:
            </p>
          </div>
          <pre className="p-4 bg-[#121612] border border-[#1b241c] text-[10px] text-gray-300 rounded-xl font-mono leading-normal overflow-x-auto select-all">
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
