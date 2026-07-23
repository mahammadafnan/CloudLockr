import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineRefresh
} from 'react-icons/hi';

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('diagnostics'); // 'diagnostics' or 'compliance'
  const [loading, setLoading] = useState(true);
  
  // Diagnostics data
  const [health, setHealth] = useState(null);

  // Compliance data
  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState(null);

  const fetchDiagnostics = async () => {
    try {
      const res = await axios.get('/api/health');
      setHealth(res.data);
    } catch (error) {
      console.error('[Health API] Error:', error.message);
      toast.error('Failed to query backend system diagnostics.');
    }
  };

  const fetchComplianceData = async () => {
    try {
      const resStats = await axios.get('/api/dashboard');
      if (resStats.data.success) {
        setStats(resStats.data.stats);
      }
      const resFindings = await axios.get('/api/dashboard/findings');
      if (resFindings.data.success) {
        setFindings(resFindings.data.findings || []);
      }
    } catch (error) {
      console.error('[Compliance API] Error:', error.message);
      toast.error('Failed to load compliance audit states.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'diagnostics') {
      await fetchDiagnostics();
    } else {
      await fetchComplianceData();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const cisControls = [
    { id: '1.1', section: 'IAM/Identity', title: 'Ensure CloudTrail is enabled in all regions', ruleRef: 'cloudtrail-logging-enabled', severity: 'High' },
    { id: '1.2', section: 'IAM/Identity', title: 'Ensure Multi-Factor Authentication (MFA) is enabled for all IAM users with console passwords', ruleRef: 'iam-mfa-console', severity: 'Medium' },
    { id: '1.4', section: 'IAM/Identity', title: 'Ensure AWS access keys are rotated every 90 days or less', ruleRef: 'iam-key-age-90-days', severity: 'Low' },
    { id: '2.1.1', section: 'S3 Storage', title: 'Ensure S3 Buckets do not allow public read or write access configurations', ruleRef: 's3-public-block', severity: 'Critical' },
    { id: '2.1.2', section: 'S3 Storage', title: 'Ensure default server-side encryption is enabled for S3 buckets', ruleRef: 's3-encryption', severity: 'High' },
    { id: '2.2.1', section: 'EBS Storage', title: 'Ensure EBS volume encryption is enabled by default', ruleRef: 'ebs-volume-encryption', severity: 'High' },
    { id: '4.1', section: 'Security Groups', title: 'Ensure no Security Groups allow ingress from 0.0.0.0/0 to Port 22 (SSH)', ruleRef: 'ec2-port22-ingress', severity: 'Critical' },
    { id: '4.2', section: 'Security Groups', title: 'Ensure no Security Groups allow ingress from 0.0.0.0/0 to Port 3389 (RDP)', ruleRef: 'ec2-port3389-ingress', severity: 'Critical' }
  ];

  const auditedControls = cisControls.map((ctrl) => {
    const failures = findings.filter((f) => f.complianceMapping?.cisAWS === ctrl.id);
    const passed = failures.length === 0;
    return { ...ctrl, passed, failuresCount: failures.length };
  });

  const passedCount = auditedControls.filter((c) => c.passed).length;
  const passedRate = stats ? Math.round((passedCount / cisControls.length) * 100) : 0;

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure scanning job schedulers, view system health, and inspect compliance audits.</p>
        </div>
        
        {/* Reload button based on active tab */}
        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold active:scale-95 transition-all border border-[#e6e8eb] shadow-sm"
        >
          <HiOutlineRefresh className="h-4 w-4" />
          <span>{activeTab === 'diagnostics' ? 'Refresh Diagnostics' : 'Recalculate Audits'}</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'diagnostics'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          System Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'compliance'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-400 hover:text-black'
          }`}
        >
          Compliance Benchmarks
        </button>
      </div>

      {/* Main Settings Body */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : activeTab === 'diagnostics' ? (
        
        /* DIAGNOSTICS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* System Diagnostics Details */}
          <div className="p-8 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm lg:col-span-2 space-y-6 relative overflow-hidden">
            <div className="flex items-center space-x-3 border-b border-[#c3f4b0]/40 pb-6">
              <div className="p-3 bg-white border border-[#c3f4b0]/40 rounded-xl text-black shadow-sm">
                <HiOutlineServer size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black" style={{ letterSpacing: '-0.3px' }}>Diagnostics &amp; Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Core Express Node.js &amp; Database indicators</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest block">Backend Status</span>
                <div className="flex items-center space-x-1.5 text-black font-semibold text-sm">
                  <HiOutlineCheckCircle className="h-5 w-5 text-[#2b6d34]" />
                  <span>{health?.status === 'healthy' ? 'HEALTHY (ACTIVE)' : 'OFFLINE'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest block">Database Link</span>
                <div className="flex items-center space-x-1.5 text-black font-semibold text-sm">
                  <HiOutlineCheckCircle className="h-5 w-5 text-[#2b6d34]" />
                  <span>{health?.database === 'connected' ? 'MONGODB CONNECTED' : 'DISCONNECTED'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest block">System Uptime</span>
                <div className="text-black font-mono font-bold text-sm">{Math.round(health?.uptime || 0)} seconds</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest block">Server Local Time</span>
                <div className="text-black font-mono font-semibold text-sm">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Performance charts mockup block */}
            <div className="p-5 bg-white border border-[#c3f4b0]/40 rounded-[1.5rem] mt-6 flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-black">Database Connection Latency</h4>
                <p className="text-[10px] text-gray-400">Response latency in milliseconds</p>
              </div>
              <div className="flex items-end gap-1.5 h-12">
                <div className="w-1.5 h-4 bg-[#c3f4b0] rounded-full"></div>
                <div className="w-1.5 h-6 bg-[#39ff14] rounded-full"></div>
                <div className="w-1.5 h-8 bg-[#2b6d34] rounded-full"></div>
                <div className="w-1.5 h-3 bg-[#c3f4b0] rounded-full"></div>
                <div className="w-1.5 h-5 bg-[#39ff14] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Scanning scheduler config */}
          <div className="p-8 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm space-y-6 flex flex-col justify-between h-full min-h-[250px]">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-black flex items-center space-x-2">
                <HiOutlineClock className="text-black h-5 w-5" />
                <span>Scanning Jobs Scheduler</span>
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Automated scanning jobs are scheduled via node-cron server schedulers to execute every midnight (00:00 UTC) dynamically.
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#c3f4b0]/40">
              <span className="text-xs text-gray-500 font-bold">Daily Cron Audit:</span>
              <span className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-[#e8fce0] border border-[#c3f4b0] text-[#2b6d34]">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      ) : (
        
        /* COMPLIANCE VIEW */
        <div className="space-y-8">
          
          {/* Compliance Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-black" style={{ letterSpacing: '-0.3px' }}>CIS AWS Foundations Benchmark v1.4.0</h3>
                <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                  Industry standard regulatory checklist covering baseline account setups, virtual boundaries, auditing configuration standards, and firewalls.
                </p>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-2">
                  Audited Controls: {passedCount} / {cisControls.length} Passed
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-5xl font-black text-black font-mono">{passedRate}%</div>
                <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Compliance Rate</div>
              </div>
            </div>

            <div className="p-8 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compliance Status</h4>
              <p className="text-xl font-bold text-black mt-2 flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-5 w-5 text-black" />
                <span>{passedRate >= 80 ? 'Highly Secure' : passedRate >= 50 ? 'Warning' : 'Critical Exposure'}</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-2 font-mono">Mapped against 8 critical policies</p>
            </div>
          </div>

          {/* Audit Checklist Table */}
          <div className="bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c3f4b0]/40 bg-[#f0fcf1]/80 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    <th className="p-5 pl-8">Control ID</th>
                    <th className="p-5">Section</th>
                    <th className="p-5">Security Policy Rule</th>
                    <th className="p-5">Severity</th>
                    <th className="p-5 pr-8">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c3f4b0]/30 text-xs">
                  {auditedControls.map((ctrl) => (
                    <tr key={ctrl.id} className="hover:bg-[#d8fad1]/30 transition">
                      <td className="p-5 pl-8 font-mono font-bold text-black">{ctrl.id}</td>
                      <td className="p-5 text-gray-500 font-bold">{ctrl.section}</td>
                      <td className="p-5 font-bold text-black text-sm">{ctrl.title}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold border text-black ${
                          ctrl.severity === 'Critical' 
                            ? 'bg-[#ffe5e5] border-[#ffc0c0] text-[#ba1a1a]' 
                            : ctrl.severity === 'High'
                            ? 'bg-[#fff3e0] border-[#fdd9a0] text-[#ff9500]'
                            : 'bg-[#fff8e0] border-[#fce9a0] text-yellow-800'
                        }`}>
                          {ctrl.severity}
                        </span>
                      </td>
                      <td className="p-5 pr-8">
                        {ctrl.passed ? (
                          <span className="inline-flex items-center space-x-1.5 text-[#2b6d34] font-bold text-sm">
                            <HiOutlineCheckCircle className="h-5 w-5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 text-red-600 font-bold text-sm" title={`${ctrl.failuresCount} failures raised`}>
                            <HiOutlineXCircle className="h-5 w-5" />
                            <span>Failed ({ctrl.failuresCount})</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
