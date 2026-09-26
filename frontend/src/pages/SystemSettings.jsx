import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineServer,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineSearch
} from 'react-icons/hi';
import { useCloud } from '../context/CloudContext';

const SystemSettings = () => {
  const { selectedCloud, setSelectedCloud } = useCloud();
  const [activeTab, setActiveTab] = useState('diagnostics'); // 'diagnostics' or 'compliance'
  const [ruleSearch, setRuleSearch] = useState('');
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

  const BENCHMARK_CONFIGS = {
    AWS: {
      title: 'CIS AWS Foundations Benchmark v1.4.0',
      description: 'Industry standard security checklist covering Amazon Web Services baseline configurations, IAM access governance, S3/EBS encryption, and Security Group network boundaries.',
      framework: 'CIS Amazon Web Services',
      controls: [
        { id: '1.1', cloud: 'AWS', section: 'Logging / Audit', title: 'CloudTrail Logging is Disabled', ruleRef: 'cloudtrail-logging-enabled', severity: 'High' },
        { id: '1.2', cloud: 'AWS', section: 'IAM / Identity', title: 'IAM User Console Login Lacks MFA Security', ruleRef: 'iam-mfa-console', severity: 'Medium' },
        { id: '1.4', cloud: 'AWS', section: 'IAM / Credentials', title: 'Programmatic Access Keys Older Than 90 Days', ruleRef: 'iam-key-age-90-days', severity: 'Low' },
        { id: '1.8', cloud: 'AWS', section: 'IAM / Password', title: 'IAM Password Policy Minimum Length Less Than 14', ruleRef: 'iam-password-policy', severity: 'Low' },
        { id: '1.16', cloud: 'AWS', section: 'IAM / Privileges', title: 'IAM User Has AdministratorAccess', ruleRef: 'iam-user-admin-access', severity: 'Critical' },
        { id: '2.1.1', cloud: 'AWS', section: 'S3 Storage', title: 'S3 Public Bucket Access Detected', ruleRef: 's3-public-block', severity: 'Critical' },
        { id: '2.1.2', cloud: 'AWS', section: 'S3 Storage', title: 'S3 Default Bucket Encryption Disabled', ruleRef: 's3-encryption', severity: 'High' },
        { id: '2.2.1', cloud: 'AWS', section: 'EBS Storage', title: 'EBS Volume Encryption Disabled', ruleRef: 'ebs-volume-encryption', severity: 'High' },
        { id: '4.1', cloud: 'AWS', section: 'Security Groups', title: 'Security Group SSH Port 22 Open to Public', ruleRef: 'ec2-port22-ingress', severity: 'Critical' },
        { id: '4.2', cloud: 'AWS', section: 'Security Groups', title: 'Security Group RDP Port 3389 Open to Public', ruleRef: 'ec2-port3389-ingress', severity: 'Critical' }
      ]
    },
    GCP: {
      title: 'CIS Google Cloud Platform Foundation Benchmark v2.0.0',
      description: 'Prescriptive regulatory consensus for hardening Google Cloud Platform projects, IAM policies, GCS bucket security, Cloud SQL isolation, and VPC ingress firewalls.',
      framework: 'CIS Google Cloud Platform',
      controls: [
        { id: '1.1', cloud: 'GCP', section: 'IAM / Identity', title: 'GCP User Account Missing 2-Step Verification / MFA Enforcement', ruleRef: 'gcp-user-mfa-console', severity: 'High' },
        { id: '1.4', cloud: 'GCP', section: 'IAM / Privileges', title: 'GCP Service Account Granted Overly Permissive Admin Privileges', ruleRef: 'gcp-iam-owner-role', severity: 'High' },
        { id: '1.5', cloud: 'GCP', section: 'IAM / Privileges', title: 'GCP Service Account Granted Service Account Admin Role', ruleRef: 'gcp-service-account-admin', severity: 'High' },
        { id: '1.7', cloud: 'GCP', section: 'IAM / Credentials', title: 'GCP Service Account Access Key Exceeds 90 Days Without Rotation', ruleRef: 'gcp-key-age-90-days', severity: 'Medium' },
        { id: '1.8', cloud: 'GCP', section: 'KMS / Encryption', title: 'GCP Cloud KMS Key Automatic Rotation Disabled', ruleRef: 'gcp-kms-key-rotation', severity: 'Medium' },
        { id: '1.13', cloud: 'GCP', section: 'IAM / Keys', title: 'User-Managed Service Account Key Created for GCP Service Account', ruleRef: 'gcp-service-account-user-key', severity: 'High' },
        { id: '2.1', cloud: 'GCP', section: 'Logging / Audit', title: 'GCP Cloud Audit Logging Disabled Across Services', ruleRef: 'gcp-audit-logging', severity: 'High' },
        { id: '3.6', cloud: 'GCP', section: 'VPC / Firewall', title: 'GCP VPC Firewall Ingress Allowed Open SSH (Port 22) from 0.0.0.0/0', ruleRef: 'gce-firewall-open-ssh', severity: 'Critical' },
        { id: '3.7', cloud: 'GCP', section: 'VPC / Firewall', title: 'GCP VPC Firewall Ingress Allowed Open RDP (Port 3389) from 0.0.0.0/0', ruleRef: 'gce-firewall-open-rdp', severity: 'Critical' },
        { id: '3.8', cloud: 'GCP', section: 'Compute / Network', title: 'GCE Compute Instance Configured with Direct Public IP Address', ruleRef: 'gce-instance-public-ip', severity: 'High' },
        { id: '4.2', cloud: 'GCP', section: 'Compute / Storage', title: 'GCE Persistent Disk Missing Customer-Managed Encryption Key (CMEK)', ruleRef: 'gce-disk-encryption', severity: 'Medium' },
        { id: '4.8', cloud: 'GCP', section: 'Compute / Security', title: 'GCE Compute Instance Shielded VM Features Disabled', ruleRef: 'gce-shielded-vm', severity: 'Medium' },
        { id: '5.1', cloud: 'GCP', section: 'Cloud Storage', title: 'Google Cloud Storage (GCS) Bucket Publicly Accessible', ruleRef: 'gcs-public-access', severity: 'Critical' },
        { id: '5.2', cloud: 'GCP', section: 'Cloud Storage', title: 'GCS Bucket Uniform Bucket-Level Access Disabled', ruleRef: 'gcs-uniform-bucket-level', severity: 'High' },
        { id: '5.3', cloud: 'GCP', section: 'Cloud Storage', title: 'GCS Bucket Missing Customer-Managed Encryption Key (CMEK)', ruleRef: 'gcs-encryption', severity: 'Medium' },
        { id: '6.1', cloud: 'GCP', section: 'Cloud SQL', title: 'GCP Cloud SQL Database Instance Exposed via Public IP', ruleRef: 'gcp-cloud-sql-public-ip', severity: 'Critical' },
        { id: '7.1', cloud: 'GCP', section: 'BigQuery', title: 'GCP BigQuery Dataset Accessible to Public (allUsers)', ruleRef: 'gcp-bigquery-public-access', severity: 'Critical' }
      ]
    },
    AZURE: {
      title: 'CIS Microsoft Azure Foundations Benchmark v2.1.0',
      description: 'Prescriptive guidance for establishing a secure baseline configuration for Microsoft Azure subscriptions, Microsoft Entra ID, Storage Accounts, NSG rules, and Azure SQL databases.',
      framework: 'CIS Microsoft Azure',
      controls: [
        { id: '1.1', cloud: 'AZURE', section: 'Identity / Entra ID', title: 'Azure Entra ID Administrator Lacks MFA Security', ruleRef: 'azure-entra-mfa', severity: 'Critical' },
        { id: '3.1', cloud: 'AZURE', section: 'Storage Accounts', title: 'Azure Storage Blob Container Public Access Allowed', ruleRef: 'azure-blob-public-access', severity: 'Critical' },
        { id: '3.2', cloud: 'AZURE', section: 'Storage Accounts', title: 'Azure Storage Account Secure Transfer (HTTPS) Disabled', ruleRef: 'azure-storage-https-only', severity: 'High' },
        { id: '3.6', cloud: 'AZURE', section: 'Storage Accounts', title: 'Azure Storage Account Public Network Access Enabled from All Networks', ruleRef: 'azure-storage-public-network', severity: 'High' },
        { id: '3.8', cloud: 'AZURE', section: 'Storage Accounts', title: 'Azure Storage Account Minimum TLS Version Less Than 1.2', ruleRef: 'azure-storage-min-tls', severity: 'Medium' },
        { id: '3.10', cloud: 'AZURE', section: 'Storage Accounts', title: 'Azure Storage Account Missing Customer-Managed Encryption Key (CMEK)', ruleRef: 'azure-storage-cmek', severity: 'Medium' },
        { id: '4.1', cloud: 'AZURE', section: 'Azure SQL', title: 'Azure SQL Database Server Public Network Access Enabled', ruleRef: 'azure-sql-public-network', severity: 'Critical' },
        { id: '4.2', cloud: 'AZURE', section: 'Azure SQL', title: 'Azure SQL Database Transparent Data Encryption (TDE) Disabled', ruleRef: 'azure-sql-tde-disabled', severity: 'High' },
        { id: '5.2', cloud: 'AZURE', section: 'Monitoring', title: 'Azure Monitor Activity Log Alert Missing for Security & NSG Changes', ruleRef: 'azure-activity-log-alert', severity: 'Medium' },
        { id: '6.1', cloud: 'AZURE', section: 'Network Security', title: 'Network Security Group (NSG) Inbound SSH Port 22 Open to Any (*)', ruleRef: 'azure-nsg-open-ssh', severity: 'Critical' },
        { id: '6.2', cloud: 'AZURE', section: 'Network Security', title: 'Network Security Group (NSG) Inbound RDP Port 3389 Open to Any (*)', ruleRef: 'azure-nsg-open-rdp', severity: 'Critical' },
        { id: '6.3', cloud: 'AZURE', section: 'Network Security', title: 'Network Security Group Inbound Traffic Fully Open on All Ports (*)', ruleRef: 'azure-nsg-all-open', severity: 'Critical' },
        { id: '6.4', cloud: 'AZURE', section: 'Virtual Machines', title: 'Azure Virtual Machine Configured with Direct Public IP Address', ruleRef: 'azure-vm-public-ip', severity: 'High' },
        { id: '7.1', cloud: 'AZURE', section: 'Managed Disks', title: 'Azure Managed Disk Missing Customer-Managed Key (CMEK) Encryption', ruleRef: 'azure-disk-cmek', severity: 'Medium' },
        { id: '8.4', cloud: 'AZURE', section: 'Key Vault', title: 'Azure Key Vault Soft-Delete or Purge Protection Disabled', ruleRef: 'azure-key-vault-purge-protection', severity: 'High' },
        { id: '8.7', cloud: 'AZURE', section: 'Key Vault', title: 'Azure Key Vault Public Network Access Enabled', ruleRef: 'azure-key-vault-public-network', severity: 'High' }
      ]
    }
  };

  const currentBenchmark = selectedCloud === 'ALL'
    ? {
        title: 'Multi-Cloud Unified Compliance Framework (CIS Benchmarks)',
        description: 'Unified cross-cloud regulatory checklist consolidating CIS controls across Amazon Web Services, Google Cloud Platform, and Microsoft Azure environments.',
        framework: 'Multi-Cloud CIS Unified',
        controls: [
          ...BENCHMARK_CONFIGS.AWS.controls,
          ...BENCHMARK_CONFIGS.GCP.controls,
          ...BENCHMARK_CONFIGS.AZURE.controls
        ]
      }
    : (BENCHMARK_CONFIGS[selectedCloud] || BENCHMARK_CONFIGS.AWS);

  const auditedControls = currentBenchmark.controls.map((ctrl) => {
    const failures = findings.filter((f) => {
      if (f.status && f.status !== 'Active') return false;
      const fProv = (
        f.resourceId?.cloudProvider ||
        (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') || f.resourceArn?.includes('/subscriptions/') ? 'AZURE' : 'AWS')
      ).toUpperCase();

      if (fProv !== ctrl.cloud) return false;

      const titleMatch = f.title && f.title.toLowerCase().trim() === ctrl.title.toLowerCase().trim();
      const cisMapMatch = (
        (ctrl.cloud === 'AWS' && f.complianceMapping?.cisAWS === ctrl.id) ||
        (ctrl.cloud === 'GCP' && f.complianceMapping?.cisGCP === ctrl.id) ||
        (ctrl.cloud === 'AZURE' && f.complianceMapping?.cisAzure === ctrl.id)
      );

      return titleMatch || cisMapMatch;
    });

    const passed = failures.length === 0;
    return { ...ctrl, passed, failuresCount: failures.length };
  });

  const filteredControls = auditedControls.filter((c) => {
    if (!ruleSearch.trim()) return true;
    const q = ruleSearch.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.section.toLowerCase().includes(q) ||
      c.severity.toLowerCase().includes(q) ||
      c.cloud.toLowerCase().includes(q)
    );
  });

  const passedCount = auditedControls.filter((c) => c.passed).length;
  const passedRate = currentBenchmark.controls.length > 0
    ? Math.round((passedCount / currentBenchmark.controls.length) * 100)
    : 100;

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
        <div className="space-y-6">
          {/* Cloud Provider Filter Pills Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#e8fce0]/30 border border-[#c3f4b0]/60 rounded-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Cloud Provider:</span>
              {[
                { id: 'ALL', label: 'All Clouds' },
                { id: 'AWS', label: 'AWS' },
                { id: 'GCP', label: 'GCP' },
                { id: 'AZURE', label: 'Azure' }
              ].map((prov) => {
                const isSelected = selectedCloud === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setSelectedCloud(prov.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#39ff14] text-black border-black/30 shadow-sm scale-105'
                        : 'bg-white hover:bg-[#e8fce0] text-gray-700 border-[#c3f4b0]/70'
                    }`}
                  >
                    {prov.label}
                  </button>
                );
              })}
            </div>

            {/* Rule Search input */}
            <div className="relative min-w-[220px]">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search rules, IDs..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c3f4b0]/80 rounded-xl text-xs text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#39ff14]"
              />
            </div>
          </div>
          
          {/* Compliance Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm flex items-center justify-between col-span-1 md:col-span-2">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    selectedCloud === 'AWS'
                      ? 'bg-[#fff3e0] text-[#ff9900] border-[#ffe0b2]'
                      : selectedCloud === 'GCP'
                      ? 'bg-[#e8fce0] text-[#2b6d34] border-[#c3f4b0]'
                      : selectedCloud === 'AZURE'
                      ? 'bg-[#e3f2fd] text-[#0078d4] border-[#bbdefb]'
                      : 'bg-[#f3f4f6] text-gray-700 border-gray-300'
                  }`}>
                    {selectedCloud === 'ALL' ? 'Unified Framework' : `${selectedCloud} Benchmark`}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-black" style={{ letterSpacing: '-0.3px' }}>
                  {currentBenchmark.title}
                </h3>
                <p className="text-xs text-gray-600 max-w-lg leading-relaxed">
                  {currentBenchmark.description}
                </p>
                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider pt-1">
                  Audited Controls: <span className="text-[#2b6d34] font-black">{passedCount}</span> / {currentBenchmark.controls.length} Passed
                </div>
              </div>
              <div className="text-right shrink-0 pl-4">
                <div className="text-5xl font-black text-black font-mono">{passedRate}%</div>
                <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">Compliance Rate</div>
              </div>
            </div>

            <div className="p-7 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compliance Status</h4>
              <p className="text-xl font-bold text-black mt-2 flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34]" />
                <span>{passedRate >= 80 ? 'Highly Secure' : passedRate >= 50 ? 'Warning' : 'Critical Exposure'}</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-2 font-mono">
                Mapped against {currentBenchmark.controls.length} standard policy controls
              </p>
            </div>
          </div>

          {/* Audit Checklist Table */}
          <div className="bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="p-4 px-8 border-b border-[#c3f4b0]/40 bg-[#f0fcf1]/80 flex items-center justify-between text-xs">
              <span className="font-bold text-black">
                {selectedCloud === 'ALL' ? 'Multi-Cloud Rules Checklist' : `${selectedCloud} Rules Checklist`}
              </span>
              <span className="text-gray-500">
                Showing {filteredControls.length} of {currentBenchmark.controls.length} rules
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c3f4b0]/40 bg-[#f0fcf1]/50 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                    <th className="p-4 pl-8">Control ID</th>
                    {selectedCloud === 'ALL' && <th className="p-4">Cloud</th>}
                    <th className="p-4">Section</th>
                    <th className="p-4">Security Policy Rule</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4 pr-8">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c3f4b0]/30 text-xs">
                  {filteredControls.length === 0 ? (
                    <tr>
                      <td colSpan={selectedCloud === 'ALL' ? 6 : 5} className="p-12 text-center text-gray-500">
                        No compliance rules match your search "{ruleSearch}".
                      </td>
                    </tr>
                  ) : (
                    filteredControls.map((ctrl) => (
                      <tr key={`${ctrl.cloud}-${ctrl.id}`} className="hover:bg-[#d8fad1]/30 transition">
                        <td className="p-4 pl-8 font-mono font-bold text-black">{ctrl.id}</td>
                        {selectedCloud === 'ALL' && (
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              ctrl.cloud === 'AWS'
                                ? 'bg-[#fff3e0] text-[#ff9900] border-[#ffe0b2]'
                                : ctrl.cloud === 'GCP'
                                ? 'bg-[#e8fce0] text-[#2b6d34] border-[#c3f4b0]'
                                : 'bg-[#e3f2fd] text-[#0078d4] border-[#bbdefb]'
                            }`}>
                              {ctrl.cloud}
                            </span>
                          </td>
                        )}
                        <td className="p-4 text-gray-600 font-bold">{ctrl.section}</td>
                        <td className="p-4 font-bold text-black text-sm">{ctrl.title}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold border text-black ${
                            ctrl.severity === 'Critical' 
                              ? 'bg-[#ffe5e5] border-[#ffc0c0] text-[#ba1a1a]' 
                              : ctrl.severity === 'High'
                              ? 'bg-[#fff3e0] border-[#fdd9a0] text-[#ff9500]'
                              : ctrl.severity === 'Medium'
                              ? 'bg-[#fff8e0] border-[#fce9a0] text-yellow-800'
                              : 'bg-gray-100 border-gray-300 text-gray-700'
                          }`}>
                            {ctrl.severity}
                          </span>
                        </td>
                        <td className="p-4 pr-8">
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
                    ))
                  )}
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
