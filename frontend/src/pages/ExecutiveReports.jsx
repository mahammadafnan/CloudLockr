import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineShieldCheck } from 'react-icons/hi';

const ExecutiveReports = () => {
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Executive Reports</h2>
        <p className="text-sm text-gray-400 mt-1">Download and export printable PDF summaries of your AWS security posture.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Download details card */}
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass glow-blue md:col-span-2 space-y-6">
          <div className="flex items-center space-x-3 border-b border-gray-800 pb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <HiOutlineDocumentText size={24} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Security Assessment Summary</h3>
              <p className="text-xs text-gray-400 mt-0.5">CIS Foundations compliance posture snapshot</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Report Contents:</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Overall Posture Security Score (0-100)</span>
              </li>
              <li className="flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Resource Inventory totals (S3, EC2, IAM, SGs)</span>
              </li>
              <li className="flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Detailed logs of all Active findings with severity ratings</span>
              </li>
              <li className="flex items-center space-x-2">
                <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Compliance mappings to CIS benchmarks and NIST controls</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-850">
            <button
              onClick={downloadReport}
              disabled={downloading}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
            >
              <HiOutlineDownload className="h-4 w-4" />
              <span>{downloading ? 'Generating Report...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Audit Details */}
        <div className="p-6 border border-gray-800 rounded-xl cyber-glass space-y-4">
          <h3 className="text-sm font-semibold text-white">Compliance Standard</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Reports generated represent an assessment against configurations recorded in the database during the last scan. 
          </p>
          <div className="text-[10px] text-gray-500 font-mono leading-normal pt-2">
            Recommended Action:<br />
            Execute a new scan from the dashboard before exporting reports to capture up-to-date states.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReports;
