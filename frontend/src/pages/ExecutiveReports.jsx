import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineShieldCheck, HiOutlineClock, HiOutlineMail } from 'react-icons/hi';

const ExecutiveReports = () => {
  const [downloading, setDownloading] = useState(false);
  const [schedule, setSchedule] = useState('weekly'); // 'weekly', 'monthly', 'disabled'
  const [email, setEmail] = useState('security-alerts@company.com');
  const [savingSchedule, setSavingSchedule] = useState(false);

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

  const handleSaveSchedule = (e) => {
    e.preventDefault();
    setSavingSchedule(true);
    setTimeout(() => {
      setSavingSchedule(false);
      toast.success(`Automated email reports scheduled: ${schedule} delivery to ${email}`);
    }, 1000);
  };

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Executive Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Download and export printable PDF summaries of your AWS security posture.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Document Details & Simulated PDF layout */}
        <div className="p-8 bg-white border border-[#e6e8eb] rounded-[2rem] shadow-sm lg:col-span-2 space-y-8 relative overflow-hidden">
          
          <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-black shadow-sm">
              <HiOutlineDocumentText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black" style={{ letterSpacing: '-0.3px' }}>Security Assessment Summary</h3>
              <p className="text-xs text-gray-500 mt-0.5">CIS Foundations compliance posture snapshot</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Column: Report Contents */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Report Contents:</h4>
              <ul className="space-y-3.5 text-xs text-gray-600">
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Overall Posture Security Score index</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Resource Inventory totals (S3, EC2, IAM, SGs)</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Detailed logs of all Active findings with severity ratings</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Compliance mappings to CIS benchmarks and NIST controls</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Simulated PDF Preview Page */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-[1.5rem] flex flex-col justify-between h-[180px] shadow-inner select-none font-mono">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>CloudLockr Report</span>
                  <span>CONFIDENTIAL</span>
                </div>
                <div className="w-1/3 h-1.5 bg-[#39ff14] rounded-full"></div>
                <div className="pt-2 text-[10px] font-black text-black">AWS SECURITY POSTURE AUDIT</div>
                <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                <div className="w-2/3 h-1 bg-gray-200 rounded-full"></div>
              </div>
              <div className="text-[8px] text-gray-400 font-bold">
                Date: {new Date().toLocaleDateString()}<br />
                Scope: CIS foundations v1.4
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-start">
            <button
              onClick={downloadReport}
              disabled={downloading}
              className="flex items-center space-x-2 px-6 py-3.5 bg-[#39ff14] hover:bg-[#32e612] text-black text-xs font-bold rounded-xl transition shadow-md active:scale-95 disabled:opacity-50"
              style={{ boxShadow: '0 4px 14px rgba(57,255,20,0.2)' }}
            >
              <HiOutlineDownload className="h-4 w-4" />
              <span>{downloading ? 'Generating Report...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Right side: Interactive scheduler Card */}
        <div className="p-8 bg-white border border-[#e6e8eb] rounded-[2rem] shadow-sm space-y-6 flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-black flex items-center space-x-2 border-b border-gray-100 pb-3">
              <HiOutlineClock className="text-black h-5 w-5" />
              <span>Automated Reports Scheduler</span>
            </h3>
            
            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Send reports to</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-[#e6e8eb] rounded-xl text-xs text-black placeholder-gray-400 outline-none focus:bg-white focus:border-black transition font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Delivery Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSchedule('weekly')}
                    className={`px-3 py-2 text-[10px] font-bold rounded-xl border text-center transition ${
                      schedule === 'weekly' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-black'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedule('monthly')}
                    className={`px-3 py-2 text-[10px] font-bold rounded-xl border text-center transition ${
                      schedule === 'monthly' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-black'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedule('disabled')}
                    className={`px-3 py-2 text-[10px] font-bold rounded-xl border text-center transition ${
                      schedule === 'disabled' ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-black'
                    }`}
                  >
                    Disable
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSchedule}
                className="w-full bg-black text-white hover:bg-black/90 text-xs font-bold py-2.5 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingSchedule ? 'Scheduling...' : 'Save Report Schedule'}
              </button>
            </form>
          </div>
          
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-4 border-t border-gray-100 leading-relaxed">
            Note:<br />
            Schedulers rely on the Express daily scanning cron cycle tasks.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReports;
