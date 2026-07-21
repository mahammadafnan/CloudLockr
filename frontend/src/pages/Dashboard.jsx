import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineSparkles,
  HiX,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState({
    securityScore: 92.5,
    totalResources: 253,
    cloudAccountsCount: 1,
    complianceRate: 75.5,
    lastScanTime: null,
    findingsCount: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  });
  const [findings, setFindings] = useState([]);

  // Timeframe, periodIndex and hover index states for Security Posture index chart
  const [timeframe, setTimeframe] = useState('Week');
  const [periodIndex, setPeriodIndex] = useState(0); // 0 = current, 1 = previous, 2 = historical
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

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

  // Trigger Scanner Ingestion
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
          fetchDashboardData();
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

  // Trigger PDF Download
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

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let content = line;
      let isHeader = false;
      let isCode = false;

      if (line.startsWith('### ')) {
        content = line.replace('### ', '');
        isHeader = true;
      } else if (line.startsWith('## ')) {
        content = line.replace('## ', '');
        isHeader = true;
      } else if (line.startsWith('* ')) {
        content = '• ' + line.replace('* ', '');
      }

      if (line.startsWith('`') || line.startsWith('    ') || line.includes('aws s3api')) {
        isCode = true;
      }

      const parts = content.split('**');
      const formatted = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-extrabold text-black">{part}</strong>;
        }
        return part;
      });

      if (isHeader) {
        return <h4 key={idx} className="text-sm font-bold text-black mt-4 mb-1.5 uppercase tracking-wider">{formatted}</h4>;
      }

      if (isCode) {
        return (
          <pre key={idx} className="bg-gray-100 border border-gray-200 rounded-lg p-3 my-2 text-[10px] font-mono text-black overflow-x-auto select-text">
            <code>{content.replace(/`/g, '')}</code>
          </pre>
        );
      }

      return (
        <p key={idx} className="text-xs text-gray-600 leading-relaxed my-1 font-medium select-text">
          {formatted}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  const lastScanDate = stats.lastScanTime ? new Date(stats.lastScanTime) : new Date();
  const lastScanFormatted = lastScanDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const nextScanDate = new Date();
  nextScanDate.setUTCHours(24, 0, 0, 0); // Sets to next midnight UTC
  const nextScanFormatted = nextScanDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const chartData = {
    Day: {
      current: {
        average: 85.4,
        trend: '▲ +1.2% from yesterday',
        label: 'This Day',
        bars: [
          { label: '12am', score: 82 },
          { label: '2am', score: 82 },
          { label: '4am', score: 85 },
          { label: '6am', score: 85 },
          { label: '8am', score: 88 },
          { label: '10am', score: 90 },
          { label: '12pm', score: 85 },
          { label: '2pm', score: 87 },
          { label: '4pm', score: 87 },
          { label: '6pm', score: stats.securityScore }
        ]
      },
      previous: {
        average: 84.1,
        trend: '▲ +0.5% from Jul 19',
        label: 'Last Day',
        bars: [
          { label: '12am', score: 80 },
          { label: '2am', score: 80 },
          { label: '4am', score: 82 },
          { label: '6am', score: 82 },
          { label: '8am', score: 85 },
          { label: '10am', score: 86 },
          { label: '12pm', score: 85 },
          { label: '2pm', score: 85 },
          { label: '4pm', score: 86 },
          { label: '6pm', score: 85 }
        ]
      },
      historical: {
        average: 82.5,
        trend: '▲ +2.0% from Jul 18',
        label: '20 Jul',
        bars: [
          { label: '12am', score: 78 },
          { label: '2am', score: 78 },
          { label: '4am', score: 80 },
          { label: '6am', score: 80 },
          { label: '8am', score: 83 },
          { label: '10am', score: 85 },
          { label: '12pm', score: 85 },
          { label: '2pm', score: 85 },
          { label: '4pm', score: 84 },
          { label: '6pm', score: 84 }
        ]
      }
    },
    Week: {
      current: {
        average: 82.6,
        trend: '▲ +2.3% from last week',
        label: 'This Week',
        bars: [
          { label: 'Mon', score: 78 },
          { label: 'Tue', score: 80 },
          { label: 'Wed', score: 80 },
          { label: 'Thu', score: 82 },
          { label: 'Fri', score: 85 },
          { label: 'Sat', score: 86 },
          { label: 'Sun', score: stats.securityScore }
        ]
      },
      previous: {
        average: 78.4,
        trend: '▲ +4.1% from Jul 5-12',
        label: 'Last Week',
        bars: [
          { label: 'Mon', score: 72 },
          { label: 'Tue', score: 75 },
          { label: 'Wed', score: 76 },
          { label: 'Thu', score: 78 },
          { label: 'Fri', score: 80 },
          { label: 'Sat', score: 82 },
          { label: 'Sun', score: 82 }
        ]
      },
      historical: {
        average: 74.2,
        trend: '▲ +1.5% from Jun 28',
        label: '5-12 Jul',
        bars: [
          { label: 'Mon', score: 70 },
          { label: 'Tue', score: 72 },
          { label: 'Wed', score: 72 },
          { label: 'Thu', score: 74 },
          { label: 'Fri', score: 75 },
          { label: 'Sat', score: 78 },
          { label: 'Sun', score: 78 }
        ]
      }
    },
    Month: {
      current: {
        average: 78.2,
        trend: '▲ +3.2% from last month',
        label: 'This Month',
        bars: [
          { label: 'W1', score: 72 },
          { label: 'W2', score: 75 },
          { label: 'W3', score: 78 },
          { label: 'W4', score: stats.securityScore }
        ]
      },
      previous: {
        average: 75.0,
        trend: '▲ +2.1% from Jan',
        label: 'Last Month',
        bars: [
          { label: 'W1', score: 70 },
          { label: 'W2', score: 72 },
          { label: 'W3', score: 75 },
          { label: 'W4', score: 78 }
        ]
      },
      historical: {
        average: 72.8,
        trend: '▲ +1.0% from Dec',
        label: 'Jan',
        bars: [
          { label: 'W1', score: 68 },
          { label: 'W2', score: 70 },
          { label: 'W3', score: 72 },
          { label: 'W4', score: 75 }
        ]
      }
    }
  };
  const periodsList = ['current', 'previous', 'historical'];
  const activePeriodKey = periodsList[periodIndex];
  const selectedPeriodData = chartData[timeframe][activePeriodKey];
  const currentData = selectedPeriodData.bars;

  return (
    <div className="space-y-6 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Scan Schedule & Time Indicators Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#e6e8eb] rounded-[1.5rem] p-5 shadow-sm">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Audit Schedule Indicators</span>
          <div className="flex flex-wrap items-center gap-6 mt-1.5 text-xs font-semibold text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2b6d34]"></span>
              <span>Last Scan: {lastScanFormatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14]"></span>
              <span>Next Scan: {nextScanFormatted}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#121612] hover:bg-[#1b241c] text-white rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50"
          >
            <HiOutlineDownload className="h-3.5 w-3.5 text-[#39ff14]" />
            <span>PDF Export</span>
          </button>
          
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#39ff14] hover:bg-[#32e612] text-black rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <HiOutlineRefresh className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Scan Environment</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Dark green/black card (like "Air Pollution Level") */}
        <div className="bg-[#0c0e0c] rounded-[1.5rem] p-6 border border-[#1b241c] text-white flex flex-col justify-between h-[130px] relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-[#39ff14] font-bold uppercase tracking-widest">Security Posture</span>
              <div className="text-2xl font-bold tracking-tight text-white mt-1">
                {stats.securityScore.toFixed(2)}/100%
              </div>
            </div>
            <div className="flex items-end gap-1 h-12">
              <div className="w-1.5 h-6 bg-[#1a4a22] rounded-full"></div>
              <div className="w-1.5 h-9 bg-[#2b6d34] rounded-full"></div>
              <div className="w-1.5 h-12 bg-[#39ff14] rounded-full"></div>
              <div className="w-1.5 h-8 bg-[#39ff14] rounded-full"></div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 mt-2">
            <span className="text-[#39ff14]">▲ +2.3%</span> than last scan
          </div>
        </div>

        {/* Card 2: Light card (like "Environmental Quality Index") */}
        <div className="bg-white rounded-[1.5rem] p-6 border border-[#e6e8eb] text-black flex flex-col justify-between h-[130px] relative shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Compliance Rate</span>
              <h3 className="text-2xl font-bold tracking-tight text-black mt-1">
                {stats.complianceRate.toFixed(2)}/100%
              </h3>
            </div>
            <div className="flex items-end gap-1 h-12">
              <div className="w-1.5 h-9 bg-gray-200 rounded-full"></div>
              <div className="w-1.5 h-12 bg-[#ff4d4d] rounded-full"></div>
              <div className="w-1.5 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 mt-2">
            <span className="text-[#ff4d4d]">▼ -1.4%</span> than last scan
          </div>
        </div>

        {/* Card 3: Light card (like "Investments in Clean Technologies") */}
        <div className="bg-white rounded-[1.5rem] p-6 border border-[#e6e8eb] text-black flex flex-col justify-between h-[130px] relative shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Audited Resources</span>
              <h3 className="text-2xl font-bold tracking-tight text-black mt-1">
                {stats.totalResources.toLocaleString()} Assets
              </h3>
            </div>
            <div className="flex items-end gap-1 h-12">
              <div className="w-1.5 h-7 bg-gray-200 rounded-full"></div>
              <div className="w-1.5 h-10 bg-gray-200 rounded-full"></div>
              <div className="w-1.5 h-12 bg-[#39ff14] rounded-full"></div>
              <div className="w-1.5 h-5 bg-[#39ff14] rounded-full"></div>
            </div>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 mt-2">
            <span className="text-[#39ff14]">▲ +51</span> than last month
          </div>
        </div>
      </div>

      {/* Middle row: Large chart and Right panel card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Apple Screen Time Inspired Security Posture Index Card */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 border border-[#e6e8eb] relative shadow-sm flex flex-col justify-between space-y-6">
          
          {/* Header Area with dynamic average and controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Dynamic average metrics display */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">
                {timeframe === 'Day' ? 'Hourly Average Posture' : timeframe === 'Week' ? 'Daily Average Posture' : 'Weekly Average Posture'}
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-black tracking-tight leading-none">
                  {selectedPeriodData.average.toFixed(1)}%
                </h3>
                <span className={`text-[10px] font-bold ${selectedPeriodData.trend.includes('▲') ? 'text-[#2b6d34]' : 'text-red-600'}`}>
                  {selectedPeriodData.trend}
                </span>
              </div>
            </div>

            {/* Apple style Segment Timeframe and Period Selectors */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              
              {/* Day / Week / Month tab selector */}
              <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-200">
                {['Day', 'Week', 'Month'].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeframe(t);
                      setPeriodIndex(0);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-150 ${
                      timeframe === t 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-gray-400 hover:text-black'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Apple-style back/forward swiper stepper */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200 shadow-sm select-none">
                <button 
                  disabled={periodIndex === 2}
                  onClick={() => setPeriodIndex(prev => Math.min(prev + 1, 2))}
                  className="text-gray-400 hover:text-black disabled:opacity-35 transition font-extrabold text-xs px-1.5"
                >
                  ←
                </button>
                <span className="text-[9px] font-extrabold text-black uppercase tracking-wider min-w-[70px] text-center">
                  {selectedPeriodData.label}
                </span>
                <button 
                  disabled={periodIndex === 0}
                  onClick={() => setPeriodIndex(prev => Math.max(prev - 1, 0))}
                  className="text-gray-400 hover:text-black disabled:opacity-35 transition font-extrabold text-xs px-1.5"
                >
                  →
                </button>
              </div>

            </div>

          </div>

          {/* Dotted lines/bar charts layout */}
          <div className="relative h-44 flex items-end justify-between px-2 pt-8 border-b border-gray-100 pb-1">
            
            {/* Dotted threshold line */}
            <div className="absolute top-1/3 left-0 w-full border-t border-dashed border-gray-200 z-0"></div>
            
            {/* Custom Dynamic Bar Graphs */}
            {currentData.map((item, idx) => {
              const latestIndex = currentData.length - 1;
              const isActive = idx === latestIndex && periodIndex === 0; // Highlight latest active point in current period
              const isHovered = hoveredBarIndex === idx;

              // Proportional width based on quantity of days/hours/weeks
              const barWidth = timeframe === 'Day' ? 'w-5 sm:w-6' : timeframe === 'Week' ? 'w-7 sm:w-8' : 'w-10 sm:w-12';

              return (
                <div 
                  className="flex flex-col items-center gap-2.5 z-10 relative cursor-pointer group"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  key={idx}
                >
                  {/* Floating tooltip above hovered bar */}
                  {isHovered && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0c0e0c] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-md z-20 flex items-center gap-1.5 whitespace-nowrap animate-fade-up">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14]"></span>
                      <span>{item.score.toFixed(1)}% Posture</span>
                    </div>
                  )}

                  <div 
                    className={`rounded-t-lg transition-all duration-200 ${barWidth} ${
                      isActive 
                        ? 'bg-gradient-to-t from-[#14471d] to-[#39ff14] border border-[#2b6d34]' 
                        : isHovered
                        ? 'bg-gradient-to-t from-[#1b2f1f] to-[#2ecc71]/80'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}
                    style={{ height: `${(item.score / 100) * 110}px` }}
                  ></div>
                  <span className={`text-[9px] font-bold tracking-tight ${isActive ? 'text-black font-extrabold' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side item list - Security Control Shield */}
        <div className="bg-[#e8fce0] rounded-[1.5rem] p-6 border border-[#c3f4b0] relative shadow-sm flex flex-col justify-between h-full">
          <div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Security Control Shield</span>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-black tracking-tighter">8 CIS Rules</h3>
              <p className="text-[10px] font-bold text-[#2b6d34]">★ Active automated policy checks</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-[#c3f4b0]/40 mt-4">
            
            {/* Storage buckets sub-stat */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#1b4a22] flex items-center justify-center text-[10px] text-[#39ff14]">S3</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black">Storage buckets</span>
                  <span className="text-[9px] text-gray-500">Security groups compliant</span>
                </div>
              </div>
              <span className="text-xs font-sans font-bold text-black">92% compliance</span>
            </div>

            {/* Compute instances sub-stat */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-[#1b4a22] flex items-center justify-center text-[10px] text-[#39ff14]">VM</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black">Compute instances</span>
                  <span className="text-[9px] text-gray-500">Access key age rotated</span>
                </div>
              </div>
              <span className="text-xs font-sans font-bold text-black">88% compliance</span>
            </div>
          </div>
        </div>
      </div>



      {/* AI Assistant findings list drawer panel - Triggered when user selects a finding */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md border-l border-gray-200 bg-white p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Drawer Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-black">
                      <HiOutlineShieldCheck className="h-5 w-5 text-[#39ff14]" />
                      <h3 className="text-base font-bold tracking-tight uppercase font-sans">AI Remediation Assistant</h3>
                    </div>
                    <button
                      onClick={() => setSelectedFinding(null)}
                      className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-black bg-gray-50 hover:bg-gray-100 active:scale-95 transition"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Finding Metadata Header Card */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedFinding.severity === 'Critical' 
                          ? 'bg-[#ffe5e5] text-red-700 border-[#ffc0c0]' 
                          : selectedFinding.severity === 'High'
                          ? 'bg-[#fff3e0] text-amber-700 border-[#fdd9a0]'
                          : 'bg-[#fff8e0] text-yellow-700 border-[#fce9a0]'
                      }`}>
                        {selectedFinding.severity}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 font-semibold">
                        {selectedFinding.resourceId?.service} • {selectedFinding.resourceId?.type}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-black mt-2">{selectedFinding.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed font-medium">{selectedFinding.description}</p>
                    <div className="border-t border-gray-200 pt-2.5 mt-2.5 text-[10px] text-gray-500 font-semibold font-mono flex items-center justify-between">
                      <span>CIS: {selectedFinding.complianceMapping?.cisAWS}</span>
                      <span>NIST: {selectedFinding.complianceMapping?.nist}</span>
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
                <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-500 leading-normal">
                  <span className="font-bold text-amber-600 uppercase mr-1">Remediation Disclaimer:</span>
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
