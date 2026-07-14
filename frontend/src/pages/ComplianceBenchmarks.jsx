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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // CIS Benchmarks mapping checklist matching active findings
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

  // Audit checks map
  const auditedControls = cisControls.map((ctrl) => {
    // Check if any active finding has the mapped compliance code
    const failures = findings.filter((f) => f.complianceMapping?.cisAWS === ctrl.id);
    const passed = failures.length === 0;
    return { ...ctrl, passed, failuresCount: failures.length };
  });

  const passedCount = auditedControls.filter((c) => c.passed).length;
  const passedRate = Math.round((passedCount / cisControls.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Compliance Benchmarks</h2>
          <p className="text-sm text-gray-400 mt-1">Audit status mapping configurations to standard CIS AWS Foundations benchmarks.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all"
        >
          <HiOutlineRefresh className="h-4 w-4" />
          <span>Recalculate Audits</span>
        </button>
      </div>

      {/* Compliance Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass glow-blue flex items-center justify-between col-span-1 md:col-span-2">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">CIS AWS Foundations Benchmark v1.4.0</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Industry standard regulatory checklist covering baseline account setups, virtual boundaries, auditing configuration standards, and firewalls.
            </p>
            <div className="text-[10px] text-gray-500 font-mono pt-2">
              Audited Controls: {passedCount} / {cisControls.length} Passed
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-extrabold text-blue-400 font-mono">{passedRate}%</div>
            <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Compliance Rate</div>
          </div>
        </div>

        <div className="p-6 border border-gray-800 rounded-xl cyber-glass flex flex-col justify-center">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compliance Status</h4>
          <p className="text-lg font-bold text-white mt-1 flex items-center space-x-2">
            <HiOutlineShieldCheck className="h-5 w-5 text-emerald-400" />
            <span>{passedRate >= 80 ? 'Highly Secure' : passedRate >= 50 ? 'Warning' : 'Critical Exposure'}</span>
          </p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">Mapped against 8 critical policies</p>
        </div>
      </div>

      {/* Audit Checklist Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden cyber-glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-black/40 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                <th className="p-4">Control ID</th>
                <th className="p-4">Section</th>
                <th className="p-4">Security Policy Rule</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-xs">
              {auditedControls.map((ctrl) => (
                <tr key={ctrl.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-semibold text-blue-400">{ctrl.id}</td>
                  <td className="p-4 text-gray-400">{ctrl.section}</td>
                  <td className="p-4 font-medium text-white">{ctrl.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      ctrl.severity === 'Critical' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : ctrl.severity === 'High'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {ctrl.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    {ctrl.passed ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                        <HiOutlineCheckCircle className="h-4 w-4" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold" title={`${ctrl.failuresCount} failures raised`}>
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
