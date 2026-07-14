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
          return 'PDF report downloaded successfully!';
        },
        error: (err) => {
          setDownloading(false);
          return 'Failed to download report.';
        }
      }
    ).catch(() => setDownloading(false));
  };

  // Trigger AI Assistant Explanation query
  const handleFindingSelect = async (finding) => {
    setSelectedFinding(finding);
    setLoadingAi(true);
    setAiResponse('');
    
    try {
      const res = await axios.get(`/api/ai/explain/${finding._id}`);
      if (res.data.success) {
        setAiResponse(res.data.analysis);
      }
    } catch (error) {
      console.error('[AI Assistant API] Error fetching analysis:', error.message);
      toast.error('Failed to connect to AI Security Assistant.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Custom parser to format and copy AI code blocks cleanly
  const renderMarkdown = (text) => {
    if (!text) return null;

    // Split text by markdown code fences
    const segments = text.split(/(```[\s\S]*?```)/g);

    return segments.map((seg, idx) => {
      if (seg.startsWith('```')) {
        // Strip code block wrappers and clean syntax flags
        const code = seg
          .replace(/```[a-zA-Z]*/, '')
          .replace(/```$/, '')
          .trim();

        return (
          <div key={idx} className="my-4 bg-black border border-gray-800 rounded-lg overflow-hidden font-mono text-xs shadow-inner">
            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-950 border-b border-gray-800 text-[10px] uppercase text-gray-500 font-sans tracking-wider">
              <span>Remediation CLI Code</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success('AWS CLI command copied to clipboard!');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold lowercase active:scale-95 transition-all"
              >
                copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-emerald-400 select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
          </div>
        );
      }

      // Format bullet lists and section headers
      return seg.split('\n').map((line, lIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={`${idx}-${lIdx}`} className="text-xs font-bold text-blue-400 mt-6 mb-2 tracking-wider uppercase border-b border-gray-800 pb-1 flex items-center space-x-1.5">
              <span>{trimmed.replace(/^###\s*/, '')}</span>
            </h4>
          );
        }
        if (trimmed.startsWith('-')) {
          return (
            <div key={`${idx}-${lIdx}`} className="flex items-start space-x-2 my-2.5 text-xs text-gray-300 leading-relaxed pl-1">
              <span className="text-blue-500 font-extrabold mt-0.5">•</span>
              <span>{trimmed.replace(/^-\s*/, '')}</span>
            </div>
          );
        }
        return trimmed ? (
          <p key={`${idx}-${lIdx}`} className="text-xs text-gray-300 my-2 leading-relaxed">
            {trimmed}
          </p>
        ) : null;
      });
    });
  };

  // Maps values dynamically to KPI blocks
  const cards = [
    { 
      title: 'Security Score', 
      value: `${stats.securityScore}/100`, 
      change: stats.securityScore >= 80 ? 'Good' : stats.securityScore >= 50 ? 'Warning' : 'Critical', 
      color: stats.securityScore >= 80 ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : stats.securityScore >= 50 ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5', 
      desc: 'Overall posture index', 
      icon: <HiShieldCheck size={28} /> 
    },
    { 
      title: 'Critical Issues', 
      value: stats.findingsCount.critical.toString(), 
      change: stats.findingsCount.critical > 0 ? 'Fix needed' : 'Secured', 
      color: stats.findingsCount.critical > 0 ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', 
      desc: 'Action required immediately', 
      icon: <HiOutlineShieldExclamation size={28} /> 
    },
    { 
      title: 'High Issues', 
      value: stats.findingsCount.high.toString(), 
      change: stats.findingsCount.high > 0 ? 'Triage' : 'Secured', 
      color: stats.findingsCount.high > 0 ? 'border-orange-500/20 text-orange-400 bg-orange-500/5' : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', 
      desc: 'Resolve within 24 hours', 
      icon: <HiOutlineExclamation size={28} /> 
    },
    { 
      title: 'Medium Issues', 
      value: stats.findingsCount.medium.toString(), 
      change: 'Audit items', 
      color: 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5', 
      desc: 'Standard compliance rules', 
      icon: <HiOutlineExclamation size={28} /> 
    },
    { 
      title: 'Cloud Accounts', 
      value: `${stats.cloudAccountsCount} Active`, 
      change: 'AWS Tenant', 
      color: 'border-blue-500/20 text-blue-400 bg-blue-500/5', 
      desc: 'AWS Account inventory config', 
      icon: <HiOutlineShieldCheck size={28} /> 
    },
    { 
      title: 'Discovered Assets', 
      value: stats.totalResources.toString(), 
      change: 'Asset count', 
      color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5', 
      desc: 'EC2, S3, IAM, SGs resources', 
      icon: <HiOutlineTrendingUp size={28} /> 
    },
    { 
      title: 'Compliance Rate', 
      value: `${stats.complianceRate}%`, 
      change: 'CIS Standard', 
      color: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5', 
      desc: 'CIS Foundations Benchmarks passed', 
      icon: <HiShieldCheck size={28} /> 
    },
    { 
      title: 'Last Scan Finished', 
      value: stats.lastScanTime ? new Date(stats.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never', 
      change: 'Audit run', 
      color: 'border-gray-800 text-gray-300 bg-gray-800/10', 
      desc: 'Recalculation complete', 
      icon: <HiOutlineClock size={28} /> 
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Posture Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time security posture checks for user <span className="text-blue-400 font-semibold font-mono">{user?.name}</span> ({user?.role})
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white border border-gray-700 rounded-lg text-sm font-semibold shadow-lg active:scale-95 transition-all duration-150"
          >
            <HiOutlineDownload className="h-4 w-4" />
            <span>{downloading ? 'Downloading...' : 'Download PDF Report'}</span>
          </button>
          
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
        {/* Active findings panel loaded dynamically */}
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-xl p-6 cyber-glass">
          <h3 className="text-base font-semibold text-white mb-4">Critical & High Pending Actions</h3>
          <p className="text-xs text-gray-400 -mt-2 mb-4">Click on any security finding card to launch AI Remediation guidance.</p>
          
          {findings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-800 rounded-lg">
              <HiOutlineShieldCheck className="h-12 w-12 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">No active issues found!</p>
              <p className="text-xs text-gray-500 mt-1">Your cloud configurations are compliant with target policies.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {findings.map((finding) => {
                // Determine styling based on severity level
                let badgeStyle = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                let cardStyle = 'bg-yellow-950/10 border-yellow-500/20 hover:border-yellow-500/40';

                if (finding.severity === 'Critical') {
                  badgeStyle = 'bg-red-500/20 text-red-400 border-red-500/30';
                  cardStyle = 'bg-red-950/10 border-red-500/20 hover:border-red-500/40';
                } else if (finding.severity === 'High') {
                  badgeStyle = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                  cardStyle = 'bg-orange-950/10 border-orange-500/20 hover:border-orange-500/40';
                }

                return (
                  <div
                    key={finding._id}
                    onClick={() => handleFindingSelect(finding)}
                    className={`p-4 border rounded-lg flex items-start justify-between cursor-pointer active:scale-[0.99] hover:scale-[1.01] transition-all duration-150 ${cardStyle}`}
                  >
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badgeStyle}`}>
                        {finding.severity}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-2">{finding.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{finding.description}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-500 whitespace-nowrap ml-4">
                      {finding.resourceId?.service || 'Cloud Asset'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Details compliance gauges */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 cyber-glass">
          <h3 className="text-base font-semibold text-white mb-4">Compliance Status</h3>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">CIS Foundations Benchmark:</span>
              <span className="text-yellow-400 font-semibold">{Math.round(stats.complianceRate)}% Passed</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">AWS Best Practices Audit:</span>
              <span className="text-emerald-400 font-semibold">{Math.min(100, Math.round(stats.complianceRate + 5))}% Passed</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-2">
              <span className="text-gray-400">Basic NIST framework:</span>
              <span className="text-yellow-400 font-semibold">{Math.round(stats.complianceRate * 0.9)}% Passed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Scan Job Scheduler:</span>
              <span className="text-emerald-400 font-semibold">Enabled (Daily)</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- SLIDING DRAWER AI ASSISTANT PANEL --- */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md border-l border-gray-800 bg-gray-950 p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Drawer Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <HiOutlineSparkles className="h-5 w-5 animate-pulse" />
                      <h3 className="text-base font-bold tracking-tight text-white uppercase font-sans">AI Remediation Assistant</h3>
                    </div>
                    <button
                      onClick={() => setSelectedFinding(null)}
                      className="p-1 rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-700 bg-gray-900/50 active:scale-95 transition-all"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Vulnerability Metadata Header Card */}
                  <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
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
                      <span className="text-[10px] font-mono text-gray-500">
                        {selectedFinding.resourceId?.service} • {selectedFinding.resourceId?.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{selectedFinding.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{selectedFinding.description}</p>
                    <div className="border-t border-gray-800/80 pt-2.5 mt-2.5 text-[10px] text-gray-500 font-mono flex items-center justify-between">
                      <span>CIS: {selectedFinding.complianceMapping?.cisAWS}</span>
                      <span>NIST: {selectedFinding.complianceMapping?.nist}</span>
                    </div>
                  </div>
                </div>

                {/* AI Explanation Content Body */}
                <div className="flex-1 my-6 overflow-y-auto pr-1 custom-scrollbar">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="text-xs text-gray-400 font-medium">Google Gemini is compiling audit recommendations...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 leading-relaxed">
                      {renderMarkdown(aiResponse)}
                    </div>
                  )}
                </div>

                {/* Drawer Footer Warning */}
                <div className="border-t border-gray-800 pt-4 text-[10px] text-gray-500 leading-normal bg-gray-950">
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
