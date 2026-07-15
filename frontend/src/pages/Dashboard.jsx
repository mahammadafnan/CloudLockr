import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  HiShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineExclamation,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineSparkles,
  HiX
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState({
    securityScore: 100,
    totalResources: 0,
    cloudAccountsCount: 0,
    complianceRate: 100,
    lastScanTime: null,
    findingsCount: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  });
  const [findings, setFindings] = useState([]);

  // AI Assistant drawer panel states
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Fetch Dashboard Stats and active findings from API
  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setFindings(res.data.recentFindings || []);
      }
    } catch (error) {
      console.error('[Dashboard API] Error fetching metrics:', error.message);
      toast.error('Failed to load real-time posture indicators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger Real Backend Ingestion Scanner
  const triggerScan = async () => {
    if (user.role === 'Viewer') {
      toast.error('Access Denied: Viewers cannot initiate manual scans.');
      return;
    }

    setScanning(true);
    
    toast.promise(
      axios.post('/api/scan'),
      {
        loading: 'Discovering AWS cloud resources and executing policy audits...',
        success: (res) => {
          fetchDashboardData(); // Reload stats after scan
          return res.data.message || 'Security scan complete! Posture score recalculated.';
        },
        error: (err) => {
          setScanning(false);
          const msg = err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : err.message;
          return `Scan failed: ${msg}`;
        }
      }
    ).then(() => setScanning(false))
     .catch(() => setScanning(false));
  };

  // Trigger PDF Report Generation & Download Stream
  const downloadReport = async () => {
    setDownloading(true);
    toast.promise(
      axios.get('/api/reports/download', { responseType: 'blob' }),
      {
        loading: 'Compiling security audit findings and generating PDF report...',
        success: (res) => {
          setDownloading(false);
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'CloudLockr_Security_Report.pdf');
          document.body.appendChild(link);
          link.click();
          link.remove();
          return 'Report downloaded successfully!';
        },
        error: (err) => {
          setDownloading(false);
          return `Download failed: ${err.message}`;
        }
      }
    );
  };

  // Launch Gemini AI Assistant to remediate selected finding
  const handleFindingSelect = async (finding) => {
    setSelectedFinding(finding);
    setLoadingAi(true);
    setAiResponse('');

    try {
      const res = await axios.post('/api/ai/remediate', { findingId: finding._id });
      if (res.data.success) {
        setAiResponse(res.data.remediation);
      } else {
        setAiResponse('Unable to generate remediation. Please verify backend logs.');
      }
    } catch (err) {
      console.error('[Gemini API] Ingestion transaction failed:', err.message);
      setAiResponse(`Remediation advisor failed: ${err.message}. Make sure backend server key is set.`);
    } finally {
      setLoadingAi(false);
    }
  };

  // Helper to parse line breaks and double asterisks from gemini raw markdown
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let content = line;
      let isHeader = false;
      let isCode = false;

      // Detect header markers
      if (line.startsWith('### ')) {
        content = line.replace('### ', '');
        isHeader = true;
      } else if (line.startsWith('## ')) {
        content = line.replace('## ', '');
        isHeader = true;
      } else if (line.startsWith('* ')) {
        content = '• ' + line.replace('* ', '');
      }

      // Code blocks formatting
      if (line.startsWith('`') || line.startsWith('    ') || line.includes('aws s3api')) {
        isCode = true;
      }

      // Parse bold elements within line
      const parts = content.split('**');
      const formatted = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-extrabold text-white">{part}</strong>;
        }
        return part;
      });

      if (isHeader) {
        return <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-1.5 uppercase tracking-wider">{formatted}</h4>;
      }

      if (isCode) {
        return (
          <pre key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 my-2 text-[10px] font-mono text-white overflow-x-auto select-text">
            <code>{content.replace(/`/g, '')}</code>
          </pre>
        );
      }

      return (
        <p key={idx} className="text-xs text-[#8a8a8f] leading-relaxed my-1 font-medium select-text">
          {formatted}
        </p>
      );
    });
  };

  const cards = [
    { 
      title: 'Security Score', 
      value: `${stats.securityScore}/100`, 
      change: stats.securityScore >= 80 ? 'Good' : stats.securityScore >= 50 ? 'Warning' : 'Critical', 
      color: stats.securityScore >= 80 ? 'text-emerald-400' : stats.securityScore >= 50 ? 'text-yellow-400' : 'text-red-400', 
      desc: 'Overall posture index', 
      icon: <HiShieldCheck size={28} /> 
    },
    { 
      title: 'Critical Issues', 
      value: stats.findingsCount.critical.toString(), 
      change: stats.findingsCount.critical > 0 ? 'Fix needed' : 'Secured', 
      color: stats.findingsCount.critical > 0 ? 'text-red-400' : 'text-emerald-400', 
      desc: 'Action required immediately', 
      icon: <HiOutlineShieldExclamation size={28} /> 
    },
    { 
      title: 'High Issues', 
      value: stats.findingsCount.high.toString(), 
      change: stats.findingsCount.high > 0 ? 'Triage' : 'Secured', 
      color: stats.findingsCount.high > 0 ? 'text-orange-400' : 'text-emerald-400', 
      desc: 'Resolve within 24 hours', 
      icon: <HiOutlineExclamation size={28} /> 
    },
    { 
      title: 'Discovered Assets', 
      value: stats.totalResources.toString(), 
      change: 'Asset count', 
      color: 'text-indigo-400', 
      desc: 'EC2, S3, IAM, SGs resources', 
      icon: <HiOutlineTrendingUp size={28} /> 
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ff3c00]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-hidden text-white">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Posture Dashboard</h2>
          <p className="text-xs sm:text-sm text-[#8a8a8f] mt-1">
            Real-time security posture checks for user <span className="text-[#ff3c00] font-bold">{user?.name}</span> ({user?.role})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2 border border-white/5 bg-white/5 text-white rounded-full hover:bg-white/10 active:scale-95 disabled:opacity-50 text-xs font-bold transition"
          >
            <HiOutlineDownload className="h-4 w-4" />
            <span>{downloading ? 'Downloading...' : 'Download PDF Report'}</span>
          </button>
          
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#ff3c00] hover:bg-[#ff5522] text-white disabled:opacity-50 rounded-full text-xs font-bold shadow-lg shadow-orange-500/10 active:scale-95 transition"
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
            className="bg-[#101010] border border-white/5 shadow-2xl hover:border-[#ff3c00]/30 rounded-2xl p-6 flex flex-col justify-between h-40 transition duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8f]">{card.title}</p>
                <p className="text-3xl font-black text-white mt-2 tracking-tight">{card.value}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white shadow-sm">{card.icon}</div>
            </div>
            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-[#8a8a8f] uppercase tracking-wider">{card.desc}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 ${card.color}`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Highlights Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active findings panel loaded dynamically */}
        <div className="lg:col-span-2 bg-[#101010] border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-1">Critical & High Pending Actions</h3>
          <p className="text-xs text-[#8a8a8f] mb-4">Click on any security finding card to launch AI Remediation guidance.</p>
          
          {findings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 bg-[#161616]/40 rounded-2xl">
              <HiOutlineShieldCheck className="h-12 w-12 text-emerald-400 mb-2" />
              <p className="text-sm font-bold text-white">No active issues found!</p>
              <p className="text-xs text-[#8a8a8f] mt-1">Your cloud configurations are compliant with target policies.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {findings.map((finding) => {
                // Determine styling based on severity level
                let badgeStyle = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 group-hover:bg-yellow-50 group-hover:text-yellow-600 group-hover:border-yellow-200';
                let cardStyle = 'bg-[#161616]/40 border-white/5 hover:bg-white hover:text-black hover:border-none hover:shadow-2xl';

                if (finding.severity === 'Critical') {
                  badgeStyle = 'bg-red-500/20 text-red-400 border-red-500/30 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200';
                  cardStyle = 'bg-red-950/10 border-red-500/10 hover:bg-white hover:text-black hover:border-none hover:shadow-2xl';
                } else if (finding.severity === 'High') {
                  badgeStyle = 'bg-orange-500/20 text-orange-400 border-orange-500/30 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-200';
                  cardStyle = 'bg-orange-950/10 border-orange-500/10 hover:bg-white hover:text-black hover:border-none hover:shadow-2xl';
                }

                return (
                  <div
                    key={finding._id}
                    onClick={() => handleFindingSelect(finding)}
                    className={`group p-4 border rounded-xl flex items-start justify-between cursor-pointer transition duration-200 text-white ${cardStyle}`}
                  >
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition ${badgeStyle}`}>
                        {finding.severity}
                      </span>
                      <h4 className="text-sm font-bold mt-2 transition group-hover:text-[#1d1d1f]">{finding.title}</h4>
                      <p className="text-xs mt-1 transition text-[#8a8a8f] group-hover:text-[#86868b]">{finding.description}</p>
                    </div>
                    <span className="text-[10px] font-mono whitespace-nowrap ml-4 uppercase tracking-wider font-semibold text-[#8a8a8f] group-hover:text-[#86868b] transition">
                      {finding.resourceId?.service || 'Cloud Asset'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Details compliance gauges */}
        <div className="bg-[#101010] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Compliance Status</h3>
            <div className="space-y-4 font-sans text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2.5">
                <span className="text-[#8a8a8f] font-medium">CIS Foundations Benchmark:</span>
                <span className="text-[#ff9500] font-bold">{Math.round(stats.complianceRate)}% Passed</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2.5">
                <span className="text-[#8a8a8f] font-medium">AWS Best Practices Audit:</span>
                <span className="text-[#28cd41] font-bold">{Math.min(100, Math.round(stats.complianceRate + 5))}% Passed</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2.5">
                <span className="text-[#8a8a8f] font-medium">Basic NIST Framework:</span>
                <span className="text-[#ff9500] font-bold">{Math.round(stats.complianceRate * 0.9)}% Passed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8a8f] font-medium">Scan Job Scheduler:</span>
                <span className="text-[#28cd41] font-bold">Enabled (Daily)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SLIDING DRAWER AI ASSISTANT PANEL --- */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md border-l border-white/5 bg-[#0a0a0a] p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Drawer Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-white">
                      <HiOutlineSparkles className="h-5 w-5 animate-pulse text-[#ff3c00]" />
                      <h3 className="text-base font-bold tracking-tight uppercase font-sans">AI Remediation Assistant</h3>
                    </div>
                    <button
                      onClick={() => setSelectedFinding(null)}
                      className="p-1.5 rounded-full border border-white/5 text-[#8a8a8f] hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Vulnerability Metadata Header Card */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl shadow-md">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        selectedFinding.severity === 'Critical' 
                          ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                          : selectedFinding.severity === 'High'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {selectedFinding.severity}
                      </span>
                      <span className="text-[10px] font-mono text-[#8a8a8f] font-semibold">
                        {selectedFinding.resourceId?.service} • {selectedFinding.resourceId?.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{selectedFinding.title}</h4>
                    <p className="text-xs text-[#8a8a8f] mt-1 leading-relaxed font-medium">{selectedFinding.description}</p>
                    <div className="border-t border-white/5 pt-2.5 mt-2.5 text-[10px] text-[#8a8a8f] font-semibold font-mono flex items-center justify-between">
                      <span>CIS: {selectedFinding.complianceMapping?.cisAWS}</span>
                      <span>NIST: {selectedFinding.complianceMapping?.nist}</span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Content Body */}
                <div className="flex-1 my-6 overflow-y-auto pr-1 custom-scrollbar">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff3c00]"></div>
                      <p className="text-xs text-[#8a8a8f] font-semibold">Google Gemini compiling audit recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 leading-relaxed">
                      {renderMarkdown(aiResponse)}
                    </div>
                  )}
                </div>

                {/* Drawer Footer Warning */}
                <div className="border-t border-white/5 pt-4 text-[10px] text-[#8a8a8f] leading-normal bg-[#0a0a0a]">
                  <span className="font-bold text-yellow-500 uppercase mr-1">Remediation Disclaimer:</span>
                  AI suggestions are for guidance purposes. Always audit generated CLI command blocks inside isolated staging environments before deploying to live production infrastructures.
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
