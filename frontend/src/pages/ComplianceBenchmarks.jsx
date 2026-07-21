import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';

const ComplianceBenchmarks = () => {
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState(null);

  const loadData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

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
  const passedRate = Math.round((passedCount / cisControls.length) * 100);

  return (
    <div className="space-y-6 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.5px' }}>Compliance Benchmarks</h2>
          <p className="text-xs text-gray-500 mt-1">Audit status mapping configurations to standard CIS AWS Foundations benchmarks.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold active:scale-95 transition-all border border-[#e6e8eb] shadow-sm"
        >
          <HiOutlineRefresh className="h-4 w-4" />
          <span>Recalculate Audits</span>
        </button>
      </div>

      {/* Compliance Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-[#e6e8eb] rounded-[1.5rem] shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-black">CIS AWS Foundations Benchmark v1.4.0</h3>
            <p className="text-xs text-gray-500 max-w-md leading-relaxed">
              Industry standard regulatory checklist covering baseline account setups, virtual boundaries, auditing configuration standards, and firewalls.
            </p>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-2">
              Audited Controls: {passedCount} / {cisControls.length} Passed
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-black text-black font-mono">{passedRate}%</div>
            <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Compliance Rate</div>
          </div>
        </div>

        <div className="p-6 bg-white border border-[#e6e8eb] rounded-[1.5rem] shadow-sm flex flex-col justify-center">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compliance Status</h4>
          <p className="text-lg font-bold text-black mt-1.5 flex items-center space-x-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-black" />
            <span>{passedRate >= 80 ? 'Highly Secure' : passedRate >= 50 ? 'Warning' : 'Critical Exposure'}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Mapped against 8 critical policies</p>
        </div>
      </div>

      {/* Audit Checklist Table */}
      <div className="bg-white border border-[#e6e8eb] rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#f9fafb] text-[9px] uppercase font-bold tracking-wider text-gray-400">
                <th className="p-4 pl-6">Control ID</th>
                <th className="p-4">Section</th>
                <th className="p-4">Security Policy Rule</th>
                <th className="p-4">Severity</th>
                <th className="p-4 pr-6">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px]">
              {auditedControls.map((ctrl) => (
                <tr key={ctrl.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 pl-6 font-mono font-bold text-black">{ctrl.id}</td>
                  <td className="p-4 text-gray-500 font-medium">{ctrl.section}</td>
                  <td className="p-4 font-bold text-black">{ctrl.title}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border text-black ${
                      ctrl.severity === 'Critical' 
                        ? 'bg-[#ffe5e5] border-[#ffc0c0]' 
                        : ctrl.severity === 'High'
                        ? 'bg-[#fff3e0] border-[#fdd9a0]'
                        : 'bg-[#fff8e0] border-[#fce9a0]'
                    }`}>
                      {ctrl.severity}
                    </span>
                  </td>
                  <td className="p-4 pr-6">
                    {ctrl.passed ? (
                      <span className="inline-flex items-center space-x-1.5 text-[#2b6d34] font-bold">
                        <HiOutlineCheckCircle className="h-4 w-4" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 text-red-600 font-bold" title={`${ctrl.failuresCount} failures raised`}>
                        <HiOutlineXCircle className="h-4 w-4" />
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
  );
};

export default ComplianceBenchmarks;
