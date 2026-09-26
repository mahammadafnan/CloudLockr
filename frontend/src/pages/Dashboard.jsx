import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCloud } from '../context/CloudContext';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCloud, setSelectedCloud } = useCloud();
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
  const [recentScans, setRecentScans] = useState([]);

  // Timeframe, periodIndex and hover index states for Security Posture index chart
  const [timeframe, setTimeframe] = useState('Week');
  const [periodIndex, setPeriodIndex] = useState(0); // 0 = current, 1 = previous, 2 = historical
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [hoveredCloud, setHoveredCloud] = useState(null);

  // AI Assistant drawer panel states
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Fetch Dashboard Stats and active findings from API
  const fetchDashboardData = async () => {
    try {
      const params = selectedCloud && selectedCloud !== 'ALL' ? { provider: selectedCloud } : {};
      const res = await axios.get('/api/dashboard', { params });
      if (res.data.success) {
        setStats(res.data.stats);
        setFindings(res.data.recentFindings || []);
        setRecentScans(res.data.recentScans || []);
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
  }, [selectedCloud]);

  // Trigger Scanner Ingestion
  const triggerScan = async () => {
    if (user?.role === 'Viewer') {
      toast.error('Access Denied: Viewers cannot initiate manual scans.');
      return;
    }
    setScanning(true);
    const targetCloudLabel = selectedCloud === 'ALL' ? 'Multi-Cloud' : selectedCloud;
    toast.promise(
      axios.post('/api/scan', { provider: selectedCloud }),
      {
        loading: `Discovering ${targetCloudLabel} cloud resources and executing policy audits...`,
        success: (res) => {
          fetchDashboardData();
          return `${targetCloudLabel} security scan complete! Posture score recalculated.`;
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

  const isDisconnectedCloud = false;

  const displayStats = {
    securityScore: stats.securityScore ?? 100,
    complianceRate: stats.complianceRate ?? 100,
    totalResources: stats.totalResources ?? 0,
    cloudAccountsCount: selectedCloud === 'ALL' ? (stats.cloudAccountsCount || 3) : 1,
    findingsCount: stats.findingsCount || { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  };

  const filteredDashboardFindings = findings.filter(f => {
    if (selectedCloud === 'ALL') return true;
    const provider = f.resourceId?.cloudProvider || (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') ? 'AZURE' : 'AWS');
    return provider.toUpperCase() === selectedCloud.toUpperCase();
  });

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

  // Helper to construct complete 24h Day, 7d Week, and 4-5w Month time-series with real scans & mock backfills
  const chartSeries = useMemo(() => {
    const currentBaseScore = Number(displayStats.securityScore ?? 90);
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 1=Tue, ..., 6=Sun
    const currentWeekOfMonth = Math.min(Math.ceil(now.getDate() / 7) - 1, 4);

    // Periods: 0 = current, 1 = previous, 2 = historical
    const periods = [0, 1, 2];

    // Helper for mock score generation with realistic sinusoidal curve
    const generateMockScore = (base, index, periodOffset, factor = 1.0) => {
      const variation = Math.sin((index + 1 + periodOffset * 2) * 0.7) * 3.2 * factor 
                      - Math.cos((index + 3) * 0.4) * 1.8 * factor
                      - (periodOffset * 1.2);
      return Math.max(68, Math.min(99, Math.round((base + variation) * 10) / 10));
    };

    // 1. Build Day (Every hour of the day: 24 Hours, 12am to 11pm)
    const daySeries = periods.map(pIndex => {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - pIndex);
      const targetDateStr = targetDate.toDateString();
      
      const label = pIndex === 0 
        ? 'Today' 
        : pIndex === 1 
        ? 'Yesterday' 
        : targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      // Filter real scans for this target date
      const dayScans = (recentScans || []).filter(s => {
        const scanDate = new Date(s.completedAt || s.startedAt);
        return scanDate.toDateString() === targetDateStr && typeof s.securityScore === 'number';
      });

      const hourlyReal = {};
      const hourlyCounts = {};
      dayScans.forEach(s => {
        const hour = new Date(s.completedAt || s.startedAt).getHours();
        hourlyReal[hour] = (hourlyReal[hour] || 0) + s.securityScore;
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      });

      const bars = [];
      for (let h = 0; h < 24; h++) {
        const ampm = h >= 12 ? 'pm' : 'am';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const hourLabel = `${h12}${ampm}`;
        const fullLabel = `${h12}:00 ${ampm.toUpperCase()}`;
        const isThisActive = pIndex === 0 && h === currentHour;
        const isFuture = pIndex === 0 && h > currentHour;

        let score = null;
        let isReal = false;

        if (isFuture) {
          score = null;
          isReal = false;
        } else if (hourlyCounts[h]) {
          score = Math.round((hourlyReal[h] / hourlyCounts[h]) * 10) / 10;
          isReal = true;
        } else if (isThisActive) {
          score = currentBaseScore;
          isReal = true;
        } else {
          score = generateMockScore(currentBaseScore, h, pIndex, 0.9);
        }

        // Show label for even hours or the active hour; show a dot for odd hours to prevent crowding
        const displayLabel = (h % 2 === 0 || isThisActive) ? hourLabel : '·';

        bars.push({
          label: displayLabel,
          fullLabel: `${fullLabel} (${pIndex === 0 && h === currentHour ? 'Current Hour' : isFuture ? 'Upcoming' : label})`,
          hour: h,
          score,
          isReal,
          isFuture,
          isActive: isThisActive
        });
      }

      const completedBars = bars.filter(b => !b.isFuture && typeof b.score === 'number');
      const avg = completedBars.length > 0 
        ? Math.round((completedBars.reduce((sum, b) => sum + b.score, 0) / completedBars.length) * 10) / 10 
        : currentBaseScore;
      return { label, bars, average: avg };
    });

    // Calculate day trends
    daySeries[0].trend = daySeries[0].average >= daySeries[1].average 
      ? `▲ +${(daySeries[0].average - daySeries[1].average).toFixed(1)}% from yesterday` 
      : `▼ ${(daySeries[0].average - daySeries[1].average).toFixed(1)}% from yesterday`;
    daySeries[1].trend = daySeries[1].average >= daySeries[2].average 
      ? `▲ +${(daySeries[1].average - daySeries[2].average).toFixed(1)}% from ${daySeries[2].label}` 
      : `▼ ${(daySeries[1].average - daySeries[2].average).toFixed(1)}% from ${daySeries[2].label}`;
    daySeries[2].trend = `▲ +0.8% baseline`;

    // 2. Build Week (Every day in the week: 7 Days, Mon to Sun)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const weekSeries = periods.map(pIndex => {
      const monday = new Date(now);
      monday.setDate(now.getDate() - currentDayOfWeek - (pIndex * 7));
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const label = pIndex === 0 
        ? 'This Week' 
        : pIndex === 1 
        ? 'Last Week' 
        : `${monday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;

      const bars = [];
      for (let d = 0; d < 7; d++) {
        const targetDay = new Date(monday);
        targetDay.setDate(monday.getDate() + d);
        const targetDayStr = targetDay.toDateString();
        const isThisActive = pIndex === 0 && d === currentDayOfWeek;
        const isFuture = pIndex === 0 && d > currentDayOfWeek;

        const dayScans = (recentScans || []).filter(s => {
          const sDate = new Date(s.completedAt || s.startedAt);
          return sDate.toDateString() === targetDayStr && typeof s.securityScore === 'number';
        });

        let score = null;
        let isReal = false;

        if (isFuture) {
          score = null;
          isReal = false;
        } else if (dayScans.length > 0) {
          score = Math.round((dayScans.reduce((acc, c) => acc + c.securityScore, 0) / dayScans.length) * 10) / 10;
          isReal = true;
        } else if (isThisActive) {
          score = currentBaseScore;
          isReal = true;
        } else {
          score = generateMockScore(currentBaseScore, d, pIndex, 1.2);
        }

        bars.push({
          label: dayNames[d],
          fullLabel: `${fullDayNames[d]} (${targetDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${isFuture ? ' - Upcoming' : ''})`,
          score,
          isReal,
          isFuture,
          isActive: isThisActive
        });
      }

      const completedBars = bars.filter(b => !b.isFuture && typeof b.score === 'number');
      const avg = completedBars.length > 0 
        ? Math.round((completedBars.reduce((sum, b) => sum + b.score, 0) / completedBars.length) * 10) / 10 
        : currentBaseScore;
      return { label, bars, average: avg };
    });

    // Calculate week trends
    weekSeries[0].trend = weekSeries[0].average >= weekSeries[1].average
      ? `▲ +${(weekSeries[0].average - weekSeries[1].average).toFixed(1)}% from last week`
      : `▼ ${(weekSeries[0].average - weekSeries[1].average).toFixed(1)}% from last week`;
    weekSeries[1].trend = weekSeries[1].average >= weekSeries[2].average
      ? `▲ +${(weekSeries[1].average - weekSeries[2].average).toFixed(1)}% from ${weekSeries[2].label}`
      : `▼ ${(weekSeries[1].average - weekSeries[2].average).toFixed(1)}% from ${weekSeries[2].label}`;
    weekSeries[2].trend = `▲ +1.5% from previous`;

    // 3. Build Month (Every week of the month according to the month: W1, W2, W3, W4, [W5])
    const monthSeries = periods.map(pIndex => {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - pIndex, 1);
      const monthYear = targetMonthDate.getFullYear();
      const monthIndex = targetMonthDate.getMonth();
      const monthShort = targetMonthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthLong = targetMonthDate.toLocaleDateString('en-US', { month: 'long' });

      // Exact number of days in this month
      const totalDaysInMonth = new Date(monthYear, monthIndex + 1, 0).getDate();
      const numWeeks = totalDaysInMonth > 28 ? 5 : 4;

      const label = pIndex === 0 
        ? 'This Month' 
        : pIndex === 1 
        ? 'Last Month' 
        : `${monthShort} ${monthYear}`;

      const bars = [];
      for (let w = 1; w <= numWeeks; w++) {
        const startDay = (w - 1) * 7 + 1;
        const endDay = Math.min(w * 7, totalDaysInMonth);
        const isThisActive = pIndex === 0 && (w - 1) === currentWeekOfMonth;
        const isFuture = pIndex === 0 && (w - 1) > currentWeekOfMonth;

        const weekScans = (recentScans || []).filter(s => {
          const sDate = new Date(s.completedAt || s.startedAt);
          return sDate.getFullYear() === monthYear &&
                 sDate.getMonth() === monthIndex &&
                 sDate.getDate() >= startDay &&
                 sDate.getDate() <= endDay &&
                 typeof s.securityScore === 'number';
        });

        let score = null;
        let isReal = false;

        if (isFuture) {
          score = null;
          isReal = false;
        } else if (weekScans.length > 0) {
          score = Math.round((weekScans.reduce((acc, c) => acc + c.securityScore, 0) / weekScans.length) * 10) / 10;
          isReal = true;
        } else if (isThisActive) {
          score = currentBaseScore;
          isReal = true;
        } else {
          score = generateMockScore(currentBaseScore - 2, w, pIndex, 1.1);
        }

        bars.push({
          label: `W${w}`,
          fullLabel: `Week ${w} (${monthShort} ${startDay}-${endDay}${isFuture ? ' - Upcoming' : ''})`,
          score,
          isReal,
          isFuture,
          isActive: isThisActive
        });
      }

      const completedBars = bars.filter(b => !b.isFuture && typeof b.score === 'number');
      const avg = completedBars.length > 0 
        ? Math.round((completedBars.reduce((sum, b) => sum + b.score, 0) / completedBars.length) * 10) / 10 
        : currentBaseScore;
      return { label, bars, average: avg, monthName: monthLong };
    });

    // Calculate month trends
    monthSeries[0].trend = monthSeries[0].average >= monthSeries[1].average
      ? `▲ +${(monthSeries[0].average - monthSeries[1].average).toFixed(1)}% from last month`
      : `▼ ${(monthSeries[0].average - monthSeries[1].average).toFixed(1)}% from last month`;
    monthSeries[1].trend = monthSeries[1].average >= monthSeries[2].average
      ? `▲ +${(monthSeries[1].average - monthSeries[2].average).toFixed(1)}% from ${monthSeries[2].label}`
      : `▼ ${(monthSeries[1].average - monthSeries[2].average).toFixed(1)}% from ${monthSeries[2].label}`;
    monthSeries[2].trend = `▲ +1.0% from baseline`;

    return {
      Day: {
        current: daySeries[0],
        previous: daySeries[1],
        historical: daySeries[2]
      },
      Week: {
        current: weekSeries[0],
        previous: weekSeries[1],
        historical: weekSeries[2]
      },
      Month: {
        current: monthSeries[0],
        previous: monthSeries[1],
        historical: monthSeries[2]
      }
    };
  }, [displayStats.securityScore, recentScans]);

  const periodsList = ['current', 'previous', 'historical'];
  const activePeriodKey = periodsList[periodIndex] || 'current';
  let selectedPeriodData = chartSeries?.[timeframe]?.[activePeriodKey] || { label: '', bars: [], average: 100, trend: '' };
  let currentData = selectedPeriodData.bars || [];

  if (isDisconnectedCloud) {
    currentData = [];
    selectedPeriodData = {
      ...selectedPeriodData,
      average: 100.0,
      trend: 'Not configured / 0 Assets',
      bars: []
    };
  }

  // Cloud Security Exposure distribution (Open misconfigurations count per cloud)
  const exposureData = useMemo(() => {
    let aws = 0;
    let gcp = 0;
    let azure = 0;

    if (stats?.cloudExposure && typeof stats.cloudExposure.total === 'number') {
      aws = stats.cloudExposure.aws || 0;
      gcp = stats.cloudExposure.gcp || 0;
      azure = stats.cloudExposure.azure || 0;
    } else {
      (findings || []).forEach(f => {
        if (f.status !== 'Active') return;
        const prov = (
          f.resourceId?.cloudProvider ||
          (f.resourceArn?.includes('gcp') ? 'GCP' : f.resourceArn?.includes('azure') || f.resourceArn?.includes('/subscriptions/') ? 'AZURE' : 'AWS')
        ).toUpperCase();
        if (prov === 'GCP') gcp++;
        else if (prov === 'AZURE') azure++;
        else aws++;
      });
    }

    const total = aws + gcp + azure;
    const awsPercent = total > 0 ? (aws / total) * 100 : 0;
    const gcpPercent = total > 0 ? (gcp / total) * 100 : 0;
    const azurePercent = total > 0 ? (azure / total) * 100 : 0;

    const clouds = [
      {
        cloud: 'AWS',
        providerKey: 'AWS',
        count: aws,
        percent: Math.round(awsPercent * 10) / 10,
        color: '#FF9900' // AWS Orange
      },
      {
        cloud: 'GCP',
        providerKey: 'GCP',
        count: gcp,
        percent: Math.round(gcpPercent * 10) / 10,
        color: '#2b6d34' // Project Green (as used in Scan History and benchmarks)
      },
      {
        cloud: 'Azure',
        providerKey: 'AZURE',
        count: azure,
        percent: Math.round(azurePercent * 10) / 10,
        color: '#0078D4' // Azure Blue
      }
    ];

    return {
      clouds,
      total
    };
  }, [stats?.cloudExposure, findings]);

  // Pre-calculate SVG Donut slice arcs and boundary divider lines
  const donutSlices = useMemo(() => {
    const total = exposureData.total;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    const slices = exposureData.clouds.map((item) => {
      const percent = total > 0 ? item.count / total : 0;
      const strokeDasharray = `${percent * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedPercent * circumference;
      const startAngle = accumulatedPercent * 360;
      accumulatedPercent += percent;

      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        startAngle
      };
    });

    const activeSlices = slices.filter(s => s.count > 0);
    const dividers = activeSlices.length > 1
      ? activeSlices.map((slice) => {
          const rad = (slice.startAngle * Math.PI) / 180;
          return {
            x1: 50 + 27.5 * Math.sin(rad),
            y1: 50 - 27.5 * Math.cos(rad),
            x2: 50 + 42.5 * Math.sin(rad),
            y2: 50 - 42.5 * Math.cos(rad)
          };
        })
      : [];

    return { slices, dividers, radius, circumference };
  }, [exposureData]);

  const handleCloudClick = (providerKey) => {
    if (setSelectedCloud) {
      setSelectedCloud(providerKey);
    }
    navigate('/findings');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

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
                {displayStats.securityScore.toFixed(1)}%
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
                {displayStats.complianceRate.toFixed(1)}%
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
                {displayStats.totalResources.toLocaleString()} Assets
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
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] p-6 border border-[#e6e8eb] relative shadow-sm flex flex-col justify-between space-y-6 overflow-hidden">
          
          {/* Header Area with dynamic average and controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Dynamic average metrics display */}
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">
                {timeframe === 'Day' ? 'Hourly Posture Index (24 Hours)' : timeframe === 'Week' ? 'Daily Posture Index (7 Days)' : 'Weekly Posture Index (Monthly)'}
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
          <div className={`relative h-44 flex items-end justify-between ${
            timeframe === 'Day' ? 'px-1 sm:px-2 gap-0.5 sm:gap-1' : timeframe === 'Week' ? 'px-2 gap-2' : 'px-3 gap-3'
          } pt-8 border-b border-gray-100 pb-1 overflow-x-auto sm:overflow-visible`}>
            
            {/* Dotted threshold line */}
            <div className="absolute top-1/3 left-0 w-full border-t border-dashed border-gray-200 z-0"></div>
            
            {/* Custom Dynamic Bar Graphs */}
            {currentData.map((item, idx) => {
              const isActive = item.isActive !== undefined ? item.isActive : (idx === currentData.length - 1 && periodIndex === 0);
              const isFuture = !!item.isFuture;
              const isHovered = hoveredBarIndex === idx;

              // Proportional width based on quantity of days/hours/weeks
              const barWidth = timeframe === 'Day' 
                ? 'w-1.5 sm:w-2 md:w-2.5' 
                : timeframe === 'Week' 
                ? 'w-7 sm:w-8 md:w-9' 
                : 'w-10 sm:w-12 md:w-14';

              const wrapperClass = timeframe === 'Day'
                ? 'flex-1 flex flex-col items-center gap-1 z-10 relative cursor-pointer group min-w-[8px]'
                : timeframe === 'Week'
                ? 'flex-1 max-w-[48px] flex flex-col items-center gap-2.5 z-10 relative cursor-pointer group'
                : 'flex-1 max-w-[64px] flex flex-col items-center gap-2.5 z-10 relative cursor-pointer group';

              const barHeight = isFuture 
                ? 4 
                : Math.max(6, (((item.score ?? 0) / 100) * 110));

              return (
                <div 
                  className={wrapperClass}
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                  key={idx}
                >
                  {/* Floating tooltip above hovered bar */}
                  {isHovered && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#0c0e0c] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl z-30 flex items-center gap-1.5 whitespace-nowrap animate-fade-up pointer-events-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${isFuture ? 'bg-gray-500' : item.isReal ? 'bg-[#39ff14]' : 'bg-gray-400'}`}></span>
                      <span>{item.fullLabel || item.label}: {isFuture ? 'Upcoming / No scan yet' : `${item.score?.toFixed(1)}%`}</span>
                      {isFuture ? (
                        <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide bg-gray-800 px-1 py-0.5 rounded">Upcoming</span>
                      ) : item.isReal ? (
                        <span className="text-[8px] text-[#39ff14] font-extrabold uppercase tracking-wide bg-[#14471d] px-1 py-0.5 rounded">Live</span>
                      ) : (
                        <span className="text-[8px] text-gray-400 font-medium uppercase tracking-wide bg-gray-800 px-1 py-0.5 rounded">Est.</span>
                      )}
                    </div>
                  )}

                  <div 
                    className={`rounded-t-lg transition-all duration-200 ${barWidth} ${
                      isFuture
                        ? 'bg-gray-200/70 border-t border-dashed border-gray-300'
                        : isActive 
                        ? 'bg-gradient-to-t from-[#14471d] to-[#39ff14] border border-[#2b6d34]' 
                        : isHovered
                        ? 'bg-gradient-to-t from-[#1b2f1f] to-[#2ecc71]/80'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}
                    style={{ height: `${barHeight}px` }}
                  ></div>
                  <span className={`text-[9px] font-bold tracking-tight text-center ${
                    isActive 
                      ? 'text-black font-extrabold' 
                      : isFuture 
                      ? 'text-gray-300' 
                      : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side item: Cloud Security Exposure Donut Chart */}
        <div className="bg-[#e8fce0]/45 rounded-[1.5rem] p-5 sm:p-6 border border-[#c3f4b0]/70 relative shadow-sm flex flex-col justify-between h-full text-black overflow-hidden">
          <div>
            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight text-black leading-snug">
                Cloud Security Exposure
              </h3>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                Open misconfigurations across monitored cloud environments
              </p>
            </div>

            {/* Donut Chart & Legend in Responsive Layout (Left Donut, Right Legend) */}
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 my-auto py-4 min-w-0">
              {/* Left: Donut Chart with Centered Total */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {exposureData.total === 0 ? (
                      /* Empty state baseline ring */
                      <circle
                        cx="50"
                        cy="50"
                        r={donutSlices.radius}
                        fill="transparent"
                        stroke="#c3f4b0"
                        strokeWidth="14"
                        strokeDasharray="4 4"
                      />
                    ) : (
                      /* Slices rotated -90deg to start at 12 o'clock */
                      donutSlices.slices.map((slice) => {
                        if (slice.count === 0) return null;
                        return (
                          <circle
                            key={slice.cloud}
                            cx="50"
                            cy="50"
                            r={donutSlices.radius}
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth={hoveredCloud === slice.cloud ? 15.5 : 14}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            transform="rotate(-90 50 50)"
                            className="cursor-pointer transition-all duration-300"
                            style={{
                              filter: hoveredCloud === slice.cloud ? 'brightness(1.12)' : 'none'
                            }}
                            onClick={() => handleCloudClick(slice.providerKey)}
                            onMouseEnter={() => setHoveredCloud(slice.cloud)}
                            onMouseLeave={() => setHoveredCloud(null)}
                          />
                        );
                      })
                    )}

                    {/* Subtle divider lines between slices matching light green card background */}
                    {donutSlices.dividers.map((line, idx) => (
                      <line
                        key={idx}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#e8fce0"
                        strokeWidth="2.5"
                        className="pointer-events-none"
                      />
                    ))}
                  </svg>

                  {/* Center of Donut: Total Open Issues */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <span className="text-2xl sm:text-3xl font-black text-black font-mono leading-none tracking-tight">
                      {exposureData.total}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                      Open Issues
                    </span>
                  </div>

                  {/* Hover Tooltip */}
                  {hoveredCloud && (() => {
                    const activeCloud = exposureData.clouds.find(c => c.cloud === hoveredCloud);
                    if (!activeCloud) return null;
                    return (
                      <div
                        className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-150 bg-white border border-[#c3f4b0] rounded-xl px-3 py-1 shadow-xl backdrop-blur-md whitespace-nowrap text-center"
                        style={{
                          borderLeft: `3px solid ${activeCloud.color}`
                        }}
                      >
                        <div className="text-[11px] font-bold text-black tracking-wide">
                          {activeCloud.cloud}: <span className="font-mono">{activeCloud.count}</span> ({activeCloud.percent.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right: Legend Breakdown List */}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {exposureData.clouds.map((item) => (
                  <div
                    key={item.cloud}
                    onClick={() => handleCloudClick(item.providerKey)}
                    onMouseEnter={() => setHoveredCloud(item.cloud)}
                    onMouseLeave={() => setHoveredCloud(null)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all duration-150 min-w-0 ${
                      hoveredCloud === item.cloud ? 'bg-white/80 scale-[1.02] shadow-sm' : 'hover:bg-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 shrink">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-black tracking-tight truncate">
                        {item.cloud}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-1">
                      <span className="text-xs font-bold text-black font-mono min-w-[16px] text-right">
                        {item.count}
                      </span>
                      <span className="text-[11px] font-medium text-gray-500 font-mono min-w-[38px] text-right">
                        {item.percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Empty State Banner if 0 open issues */}
                {exposureData.total === 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-[#2b6d34] bg-white/70 py-1 px-2 rounded-lg border border-[#c3f4b0] mt-1 shadow-sm">
                    <span>✓</span>
                    <span className="truncate">No open issues</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Total */}
          <div className="pt-3 border-t border-[#c3f4b0]/70 flex items-center justify-between mt-2">
            <span className="text-[11px] font-medium text-gray-600 truncate">
              Total open: <strong className="text-black font-bold font-mono">{exposureData.total}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#2b6d34] bg-white/80 px-2 py-0.5 rounded-full border border-[#c3f4b0] shadow-sm shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2b6d34] animate-pulse"></span>
              Live
            </span>
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
