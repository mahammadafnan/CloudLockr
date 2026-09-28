import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCloud } from '../context/CloudContext';
import { 
  HiOutlineSearch, 
  HiOutlineShieldExclamation, 
  HiOutlineRefresh, 
  HiOutlineSparkles,
  HiX,
  HiLightningBolt
} from 'react-icons/hi';
import ExecuteFixModal from '../components/ExecuteFixModal';

const SecurityFindings = () => {
  const { user } = useAuth();
  const isViewer = user?.role?.toLowerCase() === 'viewer';
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  // AI Drawer states
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [codeTab, setCodeTab] = useState('cli'); // 'cli' or 'terraform'
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Both Admin and Security Analyst have Execute Fix permission
  const canExecuteFix = !isViewer;
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerifyScan = async (finding) => {
    setVerifyingId(finding._id);
    const arnStr = finding.resourceArn || '';
    const provider = finding.resourceId?.cloudProvider || (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') || arnStr.includes('/subscriptions/') ? 'AZURE' : 'AWS');
    try {
      toast.loading(`Triggering ${provider} verification scan...`, { id: 'verify-scan' });
      await axios.post('/api/scan', { provider });
      await fetchFindings();
      toast.success('Verification scan finished. Status re-evaluated!', { id: 'verify-scan' });
    } catch (err) {
      toast.error('Scan failed: ' + (err.response?.data?.message || err.message), { id: 'verify-scan' });
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/findings');
      if (res.data.success) {
        setFindings(res.data.findings || []);
      }
    } catch (error) {
      console.error('[Findings API] Error:', error.message);
      toast.error('Failed to load vulnerabilities index.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const handleFindingSelect = async (finding) => {
    setSelectedFinding(finding);
    setLoadingAi(true);
    setAiResponse('');
    try {
      const res = await axios.post('/api/ai/remediate', { findingId: finding._id });
      if (res.data.success) {
        setAiResponse(res.data.remediation);
        setIsFallback(res.data.isFallback);
      }
    } catch (error) {
      console.error('[AI Assistant API] Error:', error.message);
      toast.error('Failed to query AI Assistant.');
    } finally {
      setLoadingAi(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;

    const arnStr = selectedFinding?.resourceArn || '';
    const currentProvider = (
      selectedFinding?.resourceId?.cloudProvider ||
      (arnStr.includes('gcp') ? 'GCP' : arnStr.includes('azure') || arnStr.includes('/subscriptions/') ? 'AZURE' : 'AWS')
    ).toUpperCase();

    const resourceName = selectedFinding?.resourceArn?.split('/')?.pop() || 'resource';

    const segments = text.split(/(```[\s\S]*?```)/g);

    return segments.map((seg, idx) => {
      if (seg.startsWith('```')) {
        const rawCode = seg.replace(/```[a-zA-Z]*/, '').replace(/```$/, '').trim();
        
        // Multi-Cloud Dynamic Terraform code snippet
        let terraformCode = `resource "aws_s3_bucket_public_access_block" "remediation" {\n  bucket = "${resourceName}"\n\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}`;

        if (currentProvider === 'GCP') {
          terraformCode = `resource "google_storage_bucket" "remediation" {\n  name                        = "${resourceName}"\n  location                    = "US"\n  uniform_bucket_level_access = true\n}`;
        } else if (currentProvider === 'AZURE') {
          terraformCode = `resource "azurerm_storage_account" "remediation" {\n  name                            = "${resourceName}"\n  resource_group_name             = "CloudLockr-RG"\n  location                        = "Central India"\n  allow_nested_items_to_be_public = false\n}`;
        }

        const activeCode = codeTab === 'cli' ? rawCode : terraformCode;
        const cliTabTitle = currentProvider === 'GCP' ? 'GCP gcloud CLI' : currentProvider === 'AZURE' ? 'Azure CLI (az)' : 'AWS CLI Patch';

        return (
          <div key={idx} className="my-4 bg-[#0c0e0c] border border-[#1b241c] rounded-xl overflow-hidden font-mono text-xs text-white">
            
            {/* Code Tabs Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#121612] border-b border-[#1b241c]">
              <div className="flex gap-4">
                <button
                  onClick={() => setCodeTab('cli')}
                  className={`text-[9px] uppercase tracking-wider font-sans font-bold transition ${
                    codeTab === 'cli' ? 'text-[#39ff14]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cliTabTitle}
                </button>
                <button
                  onClick={() => setCodeTab('terraform')}
                  className={`text-[9px] uppercase tracking-wider font-sans font-bold transition ${
                    codeTab === 'terraform' ? 'text-[#39ff14]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Terraform ({currentProvider})
                </button>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeCode);
                  toast.success('Remediation code copied to clipboard!');
                }}
                className="text-[#39ff14] hover:text-[#32e612] text-[9px] uppercase font-bold active:scale-95 transition"
              >
                copy code
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[#39ff14] select-all leading-relaxed whitespace-pre-wrap">{activeCode}</pre>
          </div>
        );
      }

      return seg.split('\n').map((line, lIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={`${idx}-${lIdx}`} className="text-xs font-bold text-black mt-6 mb-2 tracking-wider uppercase border-b border-gray-100 pb-1 flex items-center space-x-1.5">
              <span>{trimmed.replace(/^###\s*/, '')}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('-')) {
          return (
            <div key={`${idx}-${lIdx}`} className="flex items-start space-x-2 my-2.5 text-xs text-gray-600 pl-1">
              <span className="text-[#39ff14] font-extrabold mt-0.5">•</span>
              <span>{trimmed.replace(/^-\s*/, '')}</span>
            </div>
          );
        }
        return trimmed ? (
          <p key={`${idx}-${lIdx}`} className="text-xs text-gray-600 my-2.5 leading-relaxed">
            {trimmed}
          </p>
        ) : null;
      });
    });
  };

  const { selectedCloud } = useCloud();

  // Filter findings by cloud provider first
  const cloudFilteredFindings = findings.filter(f => {
    if (selectedCloud === 'ALL') return true;
    const provider = f.resourceId?.cloudProvider || (f.resourceArn.includes('gcp') ? 'GCP' : f.resourceArn.includes('azure') || f.resourceArn.includes('/subscriptions/') ? 'AZURE' : 'AWS');
    return provider.toUpperCase() === selectedCloud.toUpperCase();
  });

  // Correction check to avoid reference error
  const filteredFindingsChecked = cloudFilteredFindings.filter((f) => {
    const matchesSearch = 
      f.title.toLowerCase().includes(search.toLowerCase()) || 
      f.resourceArn.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  // Counts for top overview panel
  const criticalCount = cloudFilteredFindings.filter(f => f.severity === 'Critical').length;
  const highCount = cloudFilteredFindings.filter(f => f.severity === 'High').length;
  const mediumCount = cloudFilteredFindings.filter(f => f.severity === 'Medium').length;
  const lowCount = cloudFilteredFindings.filter(f => f.severity === 'Low').length;

  // Dynamic border outline logic matching Apple style card specs
  const getOutlineColor = (count) => {
    if (count === 1) return 'border-[#ffcc00]';
    if (count >= 2) return 'border-[#ba1a1a]';
    return 'border-[#c3f4b0]'; // default soft green outline
  };

  const getCriticalOutlineColor = (count) => {
    if (count >= 1) return 'border-[#ba1a1a]';
    return 'border-[#c3f4b0]'; // default soft green outline
  };

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Security Findings</h2>
          <p className="text-sm text-gray-500 mt-1">Audit trail listing all configuration misconfigurations raised by scanners.</p>
        </div>
        <button
          onClick={fetchFindings}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold active:scale-95 transition-all border border-[#e6e8eb] shadow-sm"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Findings</span>
        </button>
      </div>

      {/* Severity Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Card 1: Critical Findings with dynamic border outline */}
        <div className={`bg-white border-2 ${getCriticalOutlineColor(criticalCount)} rounded-[1.5rem] p-5 shadow-sm text-black flex flex-col justify-between h-[115px] transition-all duration-200`}>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Critical Findings</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5">
            {loading ? '-' : criticalCount}
          </h3>
        </div>

        {/* Card 2: High Findings with dynamic border outline */}
        <div className={`bg-white border-2 ${getOutlineColor(highCount)} rounded-[1.5rem] p-5 shadow-sm text-black flex flex-col justify-between h-[115px] transition-all duration-200`}>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">High Findings</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5">
            {loading ? '-' : highCount}
          </h3>
        </div>

        {/* Card 3: Medium Findings with dynamic border outline */}
        <div className={`bg-white border-2 ${getOutlineColor(mediumCount)} rounded-[1.5rem] p-5 shadow-sm text-black flex flex-col justify-between h-[115px] transition-all duration-200`}>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Medium Findings</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5">
            {loading ? '-' : mediumCount}
          </h3>
        </div>

        {/* Card 4: Low Findings with dynamic border outline */}
        <div className={`bg-white border-2 ${getOutlineColor(lowCount)} rounded-[1.5rem] p-5 shadow-sm text-black flex flex-col justify-between h-[115px] transition-all duration-200`}>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Low Findings</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5">
            {loading ? '-' : lowCount}
          </h3>
        </div>
      </div>

      {/* Interactive Tabs & Search Bar Card */}
      <div className="bg-white border border-[#e6e8eb] rounded-[2rem] p-6 shadow-sm space-y-6">
        
        {/* Navigation Severity Filter tabs */}
        <div className="flex border-b border-gray-100 gap-6">
          {severities.map((sev) => {
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`pb-3 text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                  isActive ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'
                }`}
              >
                <span>{sev}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <HiOutlineSearch className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search findings by title, resource name, or ARN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black placeholder-gray-400 outline-none focus:bg-white focus:border-black transition"
          />
        </div>
      </div>

      {/* Findings inventory list */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : filteredFindingsChecked.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-[#e6e8eb] rounded-[2rem] bg-white">
          <HiOutlineShieldExclamation className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-black">No active findings found</p>
          <p className="text-xs text-gray-500 mt-1">Your cloud systems are secure, or a scan needs to be executed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindingsChecked.map((finding) => {
            let leftBorder = 'border-l-4 border-l-[#ffcc00]';
            let badgeStyle = 'bg-[#fff8e0] border-[#fce9a0] text-yellow-800';

            if (finding.severity === 'Critical') {
              leftBorder = 'border-l-4 border-l-[#ba1a1a]';
              badgeStyle = 'bg-[#ffe5e5] border-[#ffc0c0] text-[#ba1a1a]';
            } else if (finding.severity === 'High') {
              leftBorder = 'border-l-4 border-l-[#ff9500]';
              badgeStyle = 'bg-[#fff3e0] border-[#fdd9a0] text-[#ff9500]';
            } else if (finding.severity === 'Medium') {
              leftBorder = 'border-l-4 border-l-[#ffcc00]';
              badgeStyle = 'bg-[#fff8e0] border-[#fce9a0] text-yellow-800';
            } else if (finding.severity === 'Low') {
              leftBorder = 'border-l-4 border-l-[#e6e8eb]';
              badgeStyle = 'bg-gray-100 border-gray-200 text-gray-600';
            }

            const providerLabel = finding.resourceId?.cloudProvider || (finding.resourceArn?.includes('gcp') ? 'GCP' : finding.resourceArn?.includes('azure') ? 'AZURE' : 'AWS');

            return (
              <div
                key={finding._id}
                onClick={() => {
                  if (!isViewer) handleFindingSelect(finding);
                }}
                className={`p-6 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 ${
                  isViewer ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                } transition-all duration-200 ${leftBorder}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border text-black ${badgeStyle}`}>
                      {finding.severity}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-black text-[#39ff14] font-mono">
                      {providerLabel}
                    </span>
                    {finding.status === 'Pending Verification' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fffbeb] border border-[#fde68a] text-amber-800 animate-pulse">
                        ⏳ Verification Pending
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-gray-500 font-bold">
                      CIS: {finding.complianceMapping?.cisAWS || finding.complianceMapping?.cisGCP || finding.complianceMapping?.cisAzure || '5.1'} • NIST: {finding.complianceMapping?.nist || 'PR.AC-3'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-black" style={{ letterSpacing: '-0.2px' }}>{finding.title}</h4>
                  <p className="text-xs text-gray-400 select-all font-mono break-all leading-normal">{finding.resourceArn}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-2.5">{finding.description}</p>
                </div>
                <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center sm:gap-2.5 pt-2 sm:pt-0 shrink-0">
                  <span className="text-[10px] font-mono text-gray-500 uppercase px-2.5 py-0.5 bg-[#f6f8f6] border border-[#e6e8eb] rounded-lg font-bold">
                    {finding.resourceId?.service || 'Cloud Asset'}
                  </span>
                  {!isViewer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFindingSelect(finding);
                      }}
                      className="text-xs font-bold text-black underline underline-offset-2 flex items-center space-x-1.5 hover:text-gray-700 transition active:scale-95 cursor-pointer"
                    >
                      <HiOutlineSparkles className="h-4 w-4 text-[#39ff14]" />
                      <span>Explain Fix</span>
                    </button>
                  )}
                  {!isViewer && (
                    finding.status === 'Pending Verification' ? (
                      <div className="flex flex-col sm:items-end gap-1.5 mt-1">
                        <button
                          type="button"
                          disabled={verifyingId === finding._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyScan(finding);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#121c13] hover:bg-black text-[#39ff14] text-xs font-bold rounded-xl transition shadow-sm hover:shadow-md active:scale-95 cursor-pointer border border-[#2b6d34] disabled:opacity-50"
                          title="Trigger scanner to audit environment and confirm resolution"
                        >
                          <HiOutlineRefresh size={13} className={`text-[#39ff14] ${verifyingId === finding._id ? 'animate-spin' : ''}`} />
                          <span>{verifyingId === finding._id ? 'Auditing...' : 'Verify Scan'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFinding(finding);
                            setShowExecuteModal(true);
                          }}
                          className="text-[10px] text-gray-500 hover:text-black font-semibold underline cursor-pointer"
                          title="Adjust parameters and re-execute fix"
                        >
                          Re-run Fix
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFinding(finding);
                          setShowExecuteModal(true);
                        }}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#39ff14] hover:bg-[#32e612] text-black text-xs font-bold rounded-xl transition shadow-sm hover:shadow-md active:scale-95 cursor-pointer mt-1"
                        title="Directly execute automated remediation"
                      >
                        <HiLightningBolt size={14} className="text-black" />
                        <span>Execute Fix</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDING DRAWER AI ASSISTANT PANEL (Admin & Security Analyst only) */}
      {selectedFinding && !isViewer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/10 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md border-l border-[#e6e8eb] bg-white p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Drawer Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-black">
                      <HiOutlineSparkles className="h-5 w-5 animate-pulse text-black" />
                      <h3 className="text-base font-bold tracking-tight uppercase">AI Remediation</h3>
                    </div>
                    <button
                      onClick={() => setSelectedFinding(null)}
                      className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-black bg-gray-50 hover:bg-gray-100 active:scale-95 transition"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Vulnerability Metadata Header Card */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border text-black ${
                        selectedFinding.severity === 'Critical' 
                          ? 'bg-[#ffe5e5] border-[#ffc0c0]' 
                          : selectedFinding.severity === 'High'
                          ? 'bg-[#fff3e0] border-[#fdd9a0]'
                          : 'bg-[#fff8e0] border-[#fce9a0]'
                      }`}>
                        {selectedFinding.severity}
                      </span>
                      {selectedFinding.status === 'Pending Verification' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fffbeb] border border-[#fde68a] text-amber-800">
                          ⏳ Pending Verification
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-gray-500 font-bold">
                        {selectedFinding.resourceId?.cloudProvider || (selectedFinding.resourceArn?.includes('gcp') ? 'GCP' : selectedFinding.resourceArn?.includes('azure') ? 'AZURE' : 'AWS')} • {selectedFinding.resourceId?.service}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-black mt-2">{selectedFinding.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{selectedFinding.description}</p>
                    <div className="border-t border-gray-200 pt-2.5 mt-2.5 text-[10px] text-gray-500 font-mono flex items-center justify-between">
                      <span>CIS: {selectedFinding.complianceMapping?.cisAWS || selectedFinding.complianceMapping?.cisGCP || selectedFinding.complianceMapping?.cisAzure || '5.1'}</span>
                      <span>NIST: {selectedFinding.complianceMapping?.nist || 'PR.AC-3'}</span>
                    </div>
                  </div>
                </div>

                {/* AI Content Body */}
                <div className="flex-1 my-6 overflow-y-auto pr-1">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                      <p className="text-xs text-gray-500 font-semibold">Google Gemini compiling audit recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 leading-relaxed">
                      {renderMarkdown(aiResponse)}
                    </div>
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="border-t border-gray-200 pt-4 flex flex-col space-y-3 shrink-0">
                  {canExecuteFix && (
                    selectedFinding.status === 'Pending Verification' ? (
                      <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span>⏳ Awaiting Environment Scan</span>
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            Pending Verification
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-tight">
                          Remediation was dispatched. CloudLockr will mark this resolved once confirmed by a cloud scan.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleVerifyScan(selectedFinding)}
                            disabled={verifyingId === selectedFinding._id}
                            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#121c13] hover:bg-black text-[#39ff14] text-xs font-bold rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            <HiOutlineRefresh size={13} className={verifyingId === selectedFinding._id ? 'animate-spin' : ''} />
                            <span>{verifyingId === selectedFinding._id ? 'Auditing...' : 'Run Verification Scan'}</span>
                          </button>
                          <button
                            onClick={() => setShowExecuteModal(true)}
                            className="px-3 py-2 bg-white hover:bg-gray-100 text-black border border-gray-300 text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                          >
                            Re-execute
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-[#f0fbf0] border border-[#c3f4b0] rounded-xl shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center text-[#39ff14]">
                            <HiLightningBolt size={14} />
                          </div>
                          <span className="text-xs font-bold text-black">Ready to remediate?</span>
                        </div>
                        <button
                          onClick={() => setShowExecuteModal(true)}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#39ff14] hover:bg-[#32e612] text-black text-xs font-bold rounded-xl transition shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                        >
                          <HiLightningBolt size={13} />
                          <span>Execute Fix</span>
                        </button>
                      </div>
                    )
                  )}

                  {isFallback && (
                    <div className="text-[10px] text-gray-500 font-medium">
                      <span className="text-gray-700 font-bold mr-1">Note:</span>
                      Displaying verified hardcoded remediation instructions.
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500 leading-normal">
                    <span className="font-bold text-amber-600 uppercase mr-1">Remediation Disclaimer:</span>
                    AI suggestions are for guidance purposes. Always audit generated CLI command blocks inside isolated staging environments before deploying to live production infrastructures.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Execute Fix Modal with Smart Parameters */}
      <ExecuteFixModal
        finding={selectedFinding}
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onSuccess={() => {
          fetchFindings();
          setShowExecuteModal(false);
          setSelectedFinding(null);
        }}
      />
    </div>
  );
};

export default SecurityFindings;
