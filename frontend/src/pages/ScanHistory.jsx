import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineClock, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

const ScanHistory = () => {
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState([]);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/scans');
      if (res.data.success) {
        setScans(res.data.scans || []);
      }
    } catch (error) {
      console.error('[Scans API] Error:', error.message);
      toast.error('Failed to load scan history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  // Compute metrics
  const totalScans = scans.length;
  const lastScan = scans[0];
  const lastScanTime = lastScan ? new Date(lastScan.completedAt || lastScan.startedAt).toLocaleString() : 'N/A';

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Scan History</h2>
          <p className="text-sm text-gray-500 mt-1">Audit log tracking all security scan tasks and posture score calculations.</p>
        </div>
        <button
          onClick={fetchScans}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-black rounded-xl text-xs font-bold active:scale-95 transition-all border border-[#e6e8eb] shadow-sm"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-[#c3f4b0] rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between h-[115px]">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Total Scan Runs</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5">{loading ? '-' : totalScans}</h3>
        </div>
        <div className="bg-white border-2 border-[#c3f4b0] rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between h-[115px]">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Latest Scan Trigger</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5 truncate">
            {loading ? '-' : lastScan ? lastScan.triggerType || 'Manual' : 'None'}
          </h3>
        </div>
        <div className="bg-white border-2 border-[#c3f4b0] rounded-[1.5rem] p-5 shadow-sm flex flex-col justify-between h-[115px]">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">Latest Completion</span>
          <h3 className="text-2xl font-bold tracking-tight text-black mt-1.5 truncate">
            {loading ? '-' : lastScanTime}
          </h3>
        </div>
      </div>

      {/* Live Timeline & Audit Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Historical Audit Table */}
        <div className="lg:col-span-2 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c3f4b0]/40 bg-[#f0fcf1]/80 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  <th className="p-5 pl-8">Scan ID</th>
                  <th className="p-5">Trigger / Mode</th>
                  <th className="p-5">Status</th>
                  <th className="p-5">Findings Count</th>
                  <th className="p-5">Posture Score</th>
                  <th className="p-5 pr-8">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3f4b0]/30 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mx-auto"></div>
                    </td>
                  </tr>
                ) : scans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-16 text-gray-400">
                      <HiOutlineClock className="h-10 w-10 mx-auto text-gray-200 mb-2" />
                      No scans executed.
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => {
                    const findings = scan.findingsFound || scan.findingsCount;
                    const score = scan.securityScore !== undefined ? scan.securityScore : scan.score;
                    const provider = scan.provider || (
                      scan.accountId?.startsWith('project-') || scan.accountId?.includes('gcp') ? 'GCP' :
                      scan.accountId?.includes('-') && scan.accountId?.length > 20 ? 'AZURE' :
                      'AWS'
                    );

                    return (
                      <tr key={scan._id} className="hover:bg-[#d8fad1]/30 transition">
                        <td className="p-5 pl-8 font-sans text-xs text-gray-400 font-semibold select-all tracking-tight uppercase">
                          {scan._id.slice(0, 8)}...
                        </td>
                        <td className="p-5">
                          <div className="space-y-1">
                            <div className="font-bold text-black text-sm">{scan.triggerType || 'Manual'}</div>
                            <div className="text-[10px] text-gray-500 font-sans font-medium flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                provider === 'AWS'
                                  ? 'bg-[#fff3e0] text-[#ff9900] border-[#ffe0b2]'
                                  : provider === 'GCP'
                                  ? 'bg-[#e8fce0] text-[#2b6d34] border-[#c3f4b0]'
                                  : provider === 'AZURE'
                                  ? 'bg-[#e3f2fd] text-[#0078d4] border-[#bbdefb]'
                                  : 'bg-[#ede9fe] text-[#6b21a8] border-[#ddd6fe]'
                              }`}>
                                {provider}
                              </span>
                              <span className="truncate max-w-[170px]" title={scan.accountId}>
                                {scan.accountId || 'All Scopes'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          {scan.status === 'Completed' ? (
                            <span className="inline-flex items-center space-x-1.5 text-[#2b6d34] font-bold">
                              <HiOutlineCheckCircle className="h-5 w-5" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 text-red-600 font-bold">
                              <HiOutlineXCircle className="h-5 w-5" />
                              <span>{scan.status || 'Failed'}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-gray-500 font-sans font-bold text-xs">
                          {findings ? (
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-[#ffe5e5] border border-[#ffc0c0] text-red-800 text-[10px] font-sans font-bold">
                                C:{findings.critical ?? 0}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#fff3e0] border border-[#fdd9a0] text-amber-800 text-[10px] font-sans font-bold">
                                H:{findings.high ?? 0}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#fff8e0] border border-[#fce9a0] text-yellow-800 text-[10px] font-sans font-bold">
                                M:{findings.medium ?? 0}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-sans font-bold">
                                L:{findings.low ?? 0}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">0</span>
                          )}
                        </td>
                        <td className="p-5 font-sans font-black text-sm">
                          {score !== undefined && score !== null ? (
                            <span className={score >= 80 ? 'text-[#2b6d34]' : score >= 60 ? 'text-amber-600' : 'text-red-600'}>
                              {typeof score === 'number' ? score.toFixed(1) : score}%
                            </span>
                          ) : (
                            <span className="text-gray-300">100%</span>
                          )}
                        </td>
                        <td className="p-5 pr-8 text-gray-500 font-bold">
                          {new Date(scan.completedAt || scan.startedAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Scanner Timeline Steps */}
        <div className="p-8 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[2rem] shadow-sm space-y-6 flex flex-col justify-between h-full min-h-[350px]">
          <div>
            <h3 className="text-base font-bold text-black border-b border-[#c3f4b0]/40 pb-3">Scan Process Steps</h3>
            
            <div className="space-y-6 pt-4 relative">
              {/* Vertical timeline line */}
              <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-[#c3f4b0]/50 -z-10"></div>
              
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#1b4a22] border border-[#2b6d34] flex items-center justify-center text-[10px] text-[#39ff14] shrink-0 font-bold font-sans">1</div>
                <div>
                  <h4 className="text-xs font-bold text-black">Asset Discovery</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5 font-sans font-medium">Enumerate S3, EC2 instances, and networking layers.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#1b4a22] border border-[#2b6d34] flex items-center justify-center text-[10px] text-[#39ff14] shrink-0 font-bold font-sans">2</div>
                <div>
                  <h4 className="text-xs font-bold text-black">Policy Evaluation</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5 font-sans font-medium">Validate configuration parameters against CIS audit rules.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-[#1b4a22] border border-[#2b6d34] flex items-center justify-center text-[10px] text-[#39ff14] shrink-0 font-bold font-sans">3</div>
                <div>
                  <h4 className="text-xs font-bold text-black">AI Assessment</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5 font-sans font-medium">Remediate violations and calculate posture index.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-6 border-t border-[#c3f4b0]/40 leading-relaxed font-sans">
            Scan State: Idle<br />
            Trigger manual scans directly from the Main Dashboard header.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanHistory;
