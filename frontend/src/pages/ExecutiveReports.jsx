import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useCloud } from '../context/CloudContext';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineShieldCheck, HiOutlineClock, HiOutlineMail } from 'react-icons/hi';

const ExecutiveReports = () => {
  const { selectedCloud, setSelectedCloud } = useCloud();
  const [downloading, setDownloading] = useState(false);
  const [schedule, setSchedule] = useState('weekly'); // 'weekly', 'monthly', 'disabled'
  const [email, setEmail] = useState('security-alerts@company.com');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const targetCloudLabel = selectedCloud === 'ALL' ? 'Multi-Cloud' : selectedCloud;

  const downloadReport = async () => {
    setDownloading(true);
    const filename = `CloudLockr_${targetCloudLabel}_Security_Report.pdf`;
    toast.promise(
      axios.get('/api/reports/download', { 
        params: { provider: selectedCloud },
        responseType: 'blob' 
      }),
      {
        loading: `Compiling ${targetCloudLabel} security audit findings and generating PDF report...`,
        success: (res) => {
          setDownloading(false);
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          return `${targetCloudLabel} PDF report downloaded successfully!`;
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
      toast.success(`Automated ${targetCloudLabel} email reports scheduled: ${schedule} delivery to ${email}`);
    }, 1000);
  };

  // Dynamic scope and inventory labels based on selected cloud
  const getInventoryLabel = () => {
    if (selectedCloud === 'AWS') return 'AWS Resource Inventory (S3, EC2, IAM, Security Groups)';
    if (selectedCloud === 'GCP') return 'GCP Resource Inventory (Cloud Storage, Compute Engine, IAM, VPC)';
    if (selectedCloud === 'AZURE') return 'Azure Resource Inventory (Blob Storage, Virtual Machines, Entra ID, NSGs)';
    return 'Multi-Cloud Resource Inventory (AWS, GCP, Azure Assets)';
  };

  const getBenchmarkLabel = () => {
    if (selectedCloud === 'AWS') return 'CIS AWS Foundations Benchmark v1.4.0 & NIST 800-53';
    if (selectedCloud === 'GCP') return 'CIS Google Cloud Platform Benchmark v2.0.0 & NIST';
    if (selectedCloud === 'AZURE') return 'CIS Microsoft Azure Benchmark v2.0.0 & NIST';
    return 'Multi-Cloud CIS Benchmarks (AWS v1.4, GCP v2.0, Azure v2.0)';
  };

  const getSimulatedScope = () => {
    if (selectedCloud === 'AWS') return 'Scope: CIS AWS foundations v1.4';
    if (selectedCloud === 'GCP') return 'Scope: CIS GCP foundations v2.0';
    if (selectedCloud === 'AZURE') return 'Scope: CIS Azure foundations v2.0';
    return 'Scope: Multi-Cloud Benchmarks';
  };

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Executive Reports</h2>
          <p className="text-sm text-gray-500 mt-1">
            Download and export printable PDF audit summaries for your {targetCloudLabel === 'Multi-Cloud' ? 'Multi-Cloud infrastructure' : `${targetCloudLabel} cloud deployment`}.
          </p>
        </div>

        {/* Cloud Selector Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#f0f2f0] p-1 rounded-2xl border border-[#e2e6e2]">
          {[
            { key: 'ALL', label: 'All Clouds' },
            { key: 'AWS', label: 'AWS' },
            { key: 'GCP', label: 'GCP' },
            { key: 'AZURE', label: 'Azure' },
          ].map((tab) => {
            const isActive = selectedCloud === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedCloud(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-black hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Document Details & Simulated PDF layout */}
        <div className="p-8 bg-white border border-[#e6e8eb] rounded-[2rem] shadow-sm lg:col-span-2 space-y-8 relative overflow-hidden">
          
          <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-black shadow-sm">
              <HiOutlineDocumentText size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black" style={{ letterSpacing: '-0.3px' }}>
                {targetCloudLabel} Security Assessment Summary
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">CIS Foundations compliance & active vulnerability posture snapshot</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Left Column: Report Contents */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Report Contents:</h4>
              <ul className="space-y-3.5 text-xs text-gray-600">
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Overall {targetCloudLabel} Security Posture Index & Compliance rating</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{getInventoryLabel()}</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Filtered list of active {targetCloudLabel} findings with severity levels</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Actionable remediation instructions for each issue</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <HiOutlineShieldCheck className="h-5 w-5 text-[#2b6d34] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{getBenchmarkLabel()}</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Simulated PDF Preview Page */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-[1.5rem] flex flex-col justify-between h-[195px] shadow-inner select-none font-mono">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>CloudLockr Report</span>
                  <span className="text-[#2b6d34] font-bold">{targetCloudLabel}</span>
                </div>
                <div className="w-1/3 h-1.5 bg-[#39ff14] rounded-full"></div>
                <div className="pt-2 text-[10px] font-black text-black">
                  {targetCloudLabel.toUpperCase()} SECURITY POSTURE AUDIT
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                <div className="w-2/3 h-1 bg-gray-200 rounded-full"></div>
              </div>
              <div className="text-[8px] text-gray-400 font-bold space-y-0.5">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>{getSimulatedScope()}</div>
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
              <span>{downloading ? 'Compiling Report...' : `Download ${targetCloudLabel} PDF Report`}</span>
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
            Schedulers compile snapshot reports scoped to your active cloud configuration.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveReports;
