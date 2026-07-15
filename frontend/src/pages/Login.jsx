import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiShieldCheck, 
  HiMail, 
  HiLockClosed, 
  HiEye, 
  HiEyeOff, 
  HiOutlineDatabase,
  HiOutlineServer,
  HiOutlineFingerPrint,
  HiOutlineCloud,
  HiOutlineArrowRight
} from 'react-icons/hi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Accordion hover state for left panel
  const [hoveredIdx, setHoveredIdx] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all credential fields.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mapped columns mimicking the AirPods Max color columns
  const columns = [
    {
      title: 'S3 Ingestion',
      subtitle: 'Object Storage Audits',
      watermark: 'S3 BUCKET',
      icon: <HiOutlineDatabase className="w-16 h-16" />,
      colorBg: 'bg-[#8ba5c4]', // slate blue
      colorText: 'text-[#1e2d42]',
      checks: ['Public Ingress Block audits', 'Default server encryption validation', 'Bucket permissions audits']
    },
    {
      title: 'EC2 Inspector',
      subtitle: 'Elastic Compute Audits',
      watermark: 'EC2 NODE',
      icon: <HiOutlineServer className="w-16 h-16" />,
      colorBg: 'bg-[#f7b0b0]', // coral pink
      colorText: 'text-[#5c2424]',
      checks: ['Volume encryption checks', 'Metadata service configuration audits', 'Ingestion nodes validation']
    },
    {
      title: 'IAM Key Auditor',
      subtitle: 'Identity Boundary Checks',
      watermark: 'IAM USER',
      icon: <HiOutlineFingerPrint className="w-16 h-16" />,
      colorBg: 'bg-[#b6d4b6]', // sage green
      colorText: 'text-[#1e3d1e]',
      checks: ['Access Key rotation validation', 'MFA activation verification', 'Console credentials audits']
    },
    {
      title: 'Firewall Guard',
      subtitle: 'Network Security Groups',
      watermark: 'SEC GROUP',
      icon: <HiOutlineCloud className="w-16 h-16" />,
      colorBg: 'bg-[#cbb6e2]', // lavender purple
      colorText: 'text-[#381e54]',
      checks: ['Port 22 SSH ingress checks', 'Port 3389 RDP ingress checks', 'Global routing audits']
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col lg:flex-row relative overflow-hidden select-none font-sans text-[#1D1D1F]">
      
      <style>{`
        @keyframes floatNode {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
          }
        }
        .animate-float {
          animation: floatNode 4s ease-in-out infinite;
        }
        .neumorphic-input {
          box-shadow: inset 1px 1px 3px rgba(0,0,0,0.05), inset -1px -1px 3px rgba(255,255,255,0.7);
        }
        .neumorphic-btn {
          background: #F5F5F7;
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.04), -4px -4px 10px rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .neumorphic-btn:hover {
          box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.04), -2px -2px 5px rgba(255, 255, 255, 0.9);
          transform: translateY(1px);
        }
        .neumorphic-btn:active {
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.7);
          transform: translateY(2px);
        }
      `}</style>

      {/* --- LEFT SECTION: DYNAMIC EXPANDABLE COLUMNS SHOWCASE --- */}
      <div className="hidden lg:flex lg:w-7/12 p-8 flex-col justify-between bg-[#EFEFEF] border-r border-[#D2D2D7] relative">
        
        {/* Header App Profile Row */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-[#FFFFFF] border border-[#D2D2D7] text-[#1D1D1F] rounded-lg shadow-sm">
              <HiShieldCheck size={20} />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1D1D1F]">CloudLockr</span>
          </div>
          <span className="text-[9px] text-[#86868B] font-bold tracking-wider uppercase border border-[#D2D2D7] bg-[#FFFFFF] px-2 py-0.5 rounded-full shadow-sm">
            Cloud Security Posture Management
          </span>
        </div>

        {/* Mapped expandable column cards block */}
        <div className="flex h-[60vh] gap-4 my-auto relative z-10 w-full">
          {columns.map((col, idx) => {
            const isHovered = hoveredIdx === idx;
            
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                className={`relative h-full ${col.colorBg} ${col.colorText} rounded-2xl flex flex-col justify-between p-6 transition-all duration-500 ease-out overflow-hidden shadow-md border border-[#D2D2D7]/10 ${
                  isHovered ? 'flex-[2.2]' : 'flex-[0.6]'
                }`}
              >
                {/* Outline large watermarked text in background */}
                <div 
                  className="absolute inset-0 flex items-center justify-center font-extrabold text-[5.5rem] tracking-tighter opacity-[0.05] pointer-events-none select-none font-mono whitespace-nowrap"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {col.watermark}
                </div>

                {/* Column header metadata */}
                <div className={`space-y-1 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{col.subtitle}</span>
                  <h3 className="text-xl font-bold tracking-tight">{col.title}</h3>
                </div>

                {/* Centered floating icon */}
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className={`transition-transform duration-500 animate-float ${isHovered ? 'scale-110' : 'scale-90 opacity-80'}`}>
                    {col.icon}
                  </div>
                </div>

                {/* Detailed checklist block revealed on hover */}
                {isHovered ? (
                  <div className="space-y-2 pt-4 border-t border-[#1D1D1F]/10 animate-[fadeIn_0.5s_ease-out]">
                    {col.checks.map((check, cIdx) => (
                      <div key={cIdx} className="flex items-center space-x-2 text-xs font-medium">
                        <span className="text-[10px]">✔</span>
                        <span>{check}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center font-bold text-[10px] uppercase tracking-widest rotate-180 writing-vertical select-none opacity-40">
                    {col.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info label */}
        <div className="flex items-center justify-between text-xs text-[#86868B] font-medium z-10">
          <span>Active Scanners Coordinator</span>
          <span>© 2026 CloudLockr</span>
        </div>

      </div>

      {/* --- RIGHT SECTION: SLEEK NEUMORPHIC LOGIN FORM --- */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 bg-[#F5F5F7] z-10 relative">
        <div className="w-full max-w-md bg-[#F5F5F7] border border-[#FFFFFF] rounded-3xl p-8 shadow-2xl space-y-8 relative">
          
          {/* Subtle logo showing on mobile top only */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="p-2.5 bg-[#FFFFFF] border border-[#D2D2D7] text-[#1D1D1F] rounded-xl shadow-sm">
              <HiShieldCheck size={28} />
            </div>
          </div>

          {/* Title Headers */}
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1D1D1F]">Welcome back.</h2>
            <p className="text-xs text-[#86868B] font-semibold">Sign in to coordinate cloud audits.</p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#86868B] pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#86868B]">
                  <HiMail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cloudlockr.com"
                  className="w-full bg-[#EFEFEF] border border-[#D2D2D7] rounded-xl pl-10 pr-4 py-3.5 text-sm text-[#1D1D1F] placeholder-[#86868B]/60 focus:outline-none focus:border-[#0071E3] transition font-mono neumorphic-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#86868B] pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#86868B]">
                  <HiLockClosed size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#EFEFEF] border border-[#D2D2D7] rounded-xl pl-10 pr-10 py-3.5 text-sm text-[#1D1D1F] placeholder-[#86868B]/60 focus:outline-none focus:border-[#0071E3] transition font-mono neumorphic-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#86868B] hover:text-[#1D1D1F] transition"
                >
                  {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            {/* Apple style Neumorphic Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full neumorphic-btn text-[#1D1D1F] font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex justify-center items-center active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <span className="h-4 w-4 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></span>
                  <span>Connecting Secure Tunnel...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>Sign In</span>
                  <HiOutlineArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-[#D2D2D7]/60 text-center">
            <p className="text-xs text-[#86868B]">
              New to CloudLockr?{' '}
              <Link to="/register" className="text-[#0071E3] hover:underline font-bold transition">
                Create account
              </Link>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;
