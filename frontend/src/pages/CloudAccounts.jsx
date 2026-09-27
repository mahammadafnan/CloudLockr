import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCloud } from '../context/CloudContext';
import { 
  HiOutlineCheckCircle, 
  HiOutlinePlus,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const CloudAccounts = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const { selectedCloud, setSelectedCloud } = useCloud();
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await axios.get('/api/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (error) {
        console.error('[Accounts API] Error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const handleSelectCloudCard = (cloudId) => {
    setSelectedCloud(cloudId);
    toast.success(`Cloud provider filter set to ${cloudId}`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-black select-none font-sans" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black" style={{ letterSpacing: '-0.8px' }}>Cloud Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">Connect, monitor, and filter live scanning boundaries across your multi-cloud environment.</p>
        </div>
        <button 
          onClick={() => toast.success('All supported cloud environments (AWS, Azure, GCP) are connected and monitored.')}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-black text-white hover:bg-black/90 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
        >
          <HiOutlinePlus size={16} />
          <span>Connect Cloud Account</span>
        </button>
      </div>

      {/* Cloud Providers Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AWS - Connected */}
        <div 
          onClick={() => handleSelectCloudCard('AWS')}
          className={`bg-white rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer active:scale-98 transition-all duration-300 ${
            selectedCloud === 'AWS' 
              ? 'border-2 border-[#39ff14] ring-4 ring-[#39ff14]/25 shadow-[0_0_20px_rgba(57,255,20,0.3)]' 
              : 'border-2 border-[#c3f4b0] hover:border-[#39ff14]/70 hover:shadow-md'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8fce0] rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-[#e8fce0] border border-[#c3f4b0] text-black uppercase">
                ACTIVE
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Amazon Web Services</h3>
              <p className="text-xs text-gray-500 font-mono">Account ID: 464433361537</p>
            </div>
            <span className="text-2xl">🇺🇸</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: eu-north-1</span>
            <span className="text-xs font-bold text-[#2b6d34] flex items-center gap-1">
              <HiOutlineCheckCircle className="h-4 w-4" /> Healthy
            </span>
          </div>
        </div>

        {/* Microsoft Azure - Active */}
        <div 
          onClick={() => handleSelectCloudCard('AZURE')}
          className={`bg-white rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer active:scale-98 transition-all duration-300 ${
            selectedCloud === 'AZURE' 
              ? 'border-2 border-[#39ff14] ring-4 ring-[#39ff14]/25 shadow-[0_0_20px_rgba(57,255,20,0.3)]' 
              : 'border-2 border-[#c3f4b0] hover:border-[#39ff14]/70 hover:shadow-md'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8fce0] rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-[#e8fce0] border border-[#c3f4b0] text-black uppercase">
                ACTIVE
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Microsoft Azure</h3>
              <p className="text-xs text-gray-500 font-mono">ID: 48131ce1-65df-4433-bb54-cb966376f6b6</p>
            </div>
            <span className="text-2xl">🇪🇺</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: West Europe</span>
            <span className="text-xs font-bold text-[#2b6d34] flex items-center gap-1">
              <HiOutlineCheckCircle className="h-4 w-4" /> Healthy
            </span>
          </div>
        </div>

        {/* Google Cloud - Active */}
        <div 
          onClick={() => handleSelectCloudCard('GCP')}
          className={`bg-white rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-[180px] relative overflow-hidden cursor-pointer active:scale-98 transition-all duration-300 ${
            selectedCloud === 'GCP' 
              ? 'border-2 border-[#39ff14] ring-4 ring-[#39ff14]/25 shadow-[0_0_20px_rgba(57,255,20,0.3)]' 
              : 'border-2 border-[#c3f4b0] hover:border-[#39ff14]/70 hover:shadow-md'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#e8fce0] rounded-bl-full -z-10 opacity-60"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-[#e8fce0] border border-[#c3f4b0] text-black uppercase">
                ACTIVE
              </span>
              <h3 className="text-lg font-bold mt-1 text-black">Google Cloud Platform</h3>
              <p className="text-xs text-gray-500 font-mono">ID: project-25a7942f-6ee6-4832-a57</p>
            </div>
            <span className="text-2xl">🌐</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Default: us-central1</span>
            <span className="text-xs font-bold text-[#2b6d34] flex items-center gap-1">
              <HiOutlineCheckCircle className="h-4 w-4" /> Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Scope Status Banner */}
      <div className="p-6 bg-[#e8fce0]/45 border border-[#c3f4b0]/70 rounded-[1.8rem] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white border border-[#c3f4b0]/60 rounded-xl text-black shadow-sm shrink-0">
            <HiOutlineShieldCheck size={22} className="text-[#2b6d34]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-black">Active Multi-Cloud Boundary Coverage</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Currently monitoring AWS (eu-north-1), Azure (West Europe), and GCP (us-central1) with automated scanning engines.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-gray-600">Active Scope:</span>
          <span className="px-3 py-1 bg-white border border-[#c3f4b0] rounded-full text-xs font-bold text-black font-mono shadow-sm">
            {selectedCloud === 'ALL' ? 'Multi-Cloud (All 3)' : selectedCloud}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CloudAccounts;
