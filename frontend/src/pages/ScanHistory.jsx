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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Scan History</h2>
          <p className="text-sm text-gray-400 mt-1">Audit log tracking all security scan tasks and posture score calculations.</p>
        </div>
        <button
          onClick={fetchScans}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Scans table list */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-800 rounded-xl bg-[#111827]/30">
          <HiOutlineClock className="h-12 w-12 text-gray-600 mb-2" />
          <p className="text-sm font-semibold text-white">No scans executed yet</p>
          <p className="text-xs text-gray-500 mt-1">Execute a scan from the dashboard to initialize security logs.</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden cyber-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-black/40 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  <th className="p-4">Scan ID</th>
                  <th className="p-4">Trigger / Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Findings Count</th>
                  <th className="p-4">Posture Score</th>
                  <th className="p-4">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-xs">
                {scans.map((scan) => (
                  <tr key={scan._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-[10px] text-gray-400 select-all">{scan._id}</td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-white">{scan.triggerType || 'Manual'}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {scan.accountId ? `Scope: AWS (${scan.accountId})` : 'Mock Mode Ingestion'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {scan.status === 'Completed' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                          <HiOutlineCheckCircle className="h-4 w-4" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold">
                          <HiOutlineXCircle className="h-4 w-4" />
                          <span>{scan.status || 'Failed'}</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-300 font-mono">
                      {scan.findingsCount ? (
                        <span>
                          C:{scan.findingsCount.critical || 0} | H:{scan.findingsCount.high || 0} | M:{scan.findingsCount.medium || 0}
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-bold text-white text-sm">
                      {scan.score !== undefined ? `${scan.score}/100` : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(scan.completedAt || scan.startedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
