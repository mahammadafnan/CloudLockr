import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiShieldCheck, 
  HiMail, 
  HiLockClosed, 
  HiEye, 
  HiEyeOff, 
  HiX,
  HiOutlineDatabase,
  HiOutlineServer,
  HiOutlineFingerPrint,
  HiOutlineCloud,
  HiOutlineArrowRight,
  HiUser,
  HiBriefcase,
  HiOutlineSparkles
} from 'react-icons/hi';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Mode state inside auth modal: 'signup' or 'signin'
  const [authMode, setAuthMode] = useState('signup');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Accordion active index
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Cinematic intro stages:
  // 'black' (0.0s - 0.6s) -> Screen blank, top-right soft light glow, camera dollies in
  // 'text_reveal' (0.6s - 1.6s) -> Text "CLOUDLOCKR" appears with blur & tracking expansion shimmer
  // 'logo_morph' (1.6s - 2.3s) -> Text "CLOUDLOCKR" melts & morphs into wave cloud logo inside gooey filter
  // 'logo_details' (2.3s - 2.9s) -> Cloud logo fixed, letters reveal below it
  // 'reveal' (2.9s - 3.3s) -> Splash zooms out and fades out, homepage shows
  // 'interactive' (3.3s+) -> Homepage interactive
  const [introStage, setIntroStage] = useState('black');

  useEffect(() => {
    // Stage 1: 0.6s -> Let text appear first with cinematic reveal
    const t1 = setTimeout(() => setIntroStage('text_reveal'), 600);

    // Stage 2: 1.6s -> Morph text to logo
    const t2 = setTimeout(() => setIntroStage('logo_morph'), 1600);

    // Stage 3: 2.3s -> Show logo clearly, letters reveal below
    const t3 = setTimeout(() => setIntroStage('logo_details'), 2200);

    // Stage 4: 2.9s -> splash zooms out and reveals homepage
    const t4 = setTimeout(() => setIntroStage('reveal'), 2900);

    // Stage 5: 3.3s -> homepage fully interactive
    const t5 = setTimeout(() => setIntroStage('interactive'), 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (authMode === 'signin') {
        if (!email || !password) {
          toast.error('Please specify both email and password.');
          setSubmitting(false);
          return;
        }
        await login(email, password);
        toast.success('Successfully logged in!');
      } else {
        if (!name || !email || !password || !role) {
          toast.error('All registration fields must be filled.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await register(name, email, password, role);
        toast.success('Account created successfully!');
      }
      setShowAuthModal(false);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'S3 Ingestion',
      subtitle: 'Object Storage Audits',
      watermark: 'S3 BUCKET',
      icon: <HiOutlineDatabase className="w-20 h-20" />,
      colorBg: 'bg-[#e2ebf5]', // soft slate blue
      colorText: 'text-[#1e2d42]',
      checks: ['Public Ingress Block audits', 'Default server encryption validation', 'Bucket permissions audits']
    },
    {
      title: 'EC2 Inspector',
      subtitle: 'Elastic Compute Audits',
      watermark: 'EC2 NODE',
      icon: <HiOutlineServer className="w-20 h-20" />,
      colorBg: 'bg-[#fdf0f0]', // soft coral pink
      colorText: 'text-[#5c2424]',
      checks: ['Volume encryption checks', 'Metadata service configuration audits', 'Ingestion nodes validation']
    },
    {
      title: 'IAM Key Auditor',
      subtitle: 'Identity Boundary Checks',
      watermark: 'IAM USER',
      icon: <HiOutlineFingerPrint className="w-20 h-20" />,
      colorBg: 'bg-[#f0f7f0]', // soft sage green
      colorText: 'text-[#1e3d1e]',
      checks: ['Access Key rotation validation', 'MFA activation verification', 'Console credentials audits']
    },
    {
      title: 'Firewall Guard',
      subtitle: 'Network Security Groups',
      watermark: 'SEC GROUP',
      icon: <HiOutlineCloud className="w-20 h-20" />,
      colorBg: 'bg-[#f5effa]', // soft lavender purple
      colorText: 'text-[#381e54]',
      checks: ['Port 22 SSH ingress checks', 'Port 3389 RDP ingress checks', 'Global routing audits']
    },
    {
      title: 'CloudTrail Auditor',
      subtitle: 'Audit Trail Logging',
      watermark: 'CLOUDTRAIL',
      icon: <HiShieldCheck className="w-20 h-20" />,
      colorBg: 'bg-[#faf4ed]', // soft peach/gold
      colorText: 'text-[#4e3917]',
      checks: ['Log recording status checks', 'Event logging activation audits', 'S3 storage boundary validations']
    },
    {
      title: 'GenAI Remediation',
      subtitle: 'AI Security Assistant',
      watermark: 'GEMINI AI',
      icon: <HiOutlineSparkles className="w-20 h-20" />,
      colorBg: 'bg-[#faf0f7]', // soft rose-purple
      colorText: 'text-[#4c1d42]',
      checks: ['Gemini-1.5-Flash integration', 'One-click AWS CLI remediation scripts', 'Automated security risk analysis']
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none font-sans text-white">
      
      {/* GLOBAL CINEMATIC ANIMATIONS & GLOW STYLES */}
      <style>{`
        @keyframes floatNode {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        .animate-float {
          animation: floatNode 4s ease-in-out infinite;
        }
        .neumorphic-input {
          background: #151515;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 1px 1px 3px rgba(0,0,0,0.4);
          color: #ffffff;
        }
        .neumorphic-btn {
          background: #161616;
          color: #ffffff;
          box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5), -4px -4px 10px rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .neumorphic-btn:hover {
          box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5), -2px -2px 5px rgba(255, 255, 255, 0.02);
          transform: translateY(0.5px);
          border-color: rgba(255, 60, 0, 0.4);
        }
        .neumorphic-btn:active {
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.6);
          transform: translateY(1.5px);
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 3s linear infinite;
        }
        @keyframes floatParticles {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
          50% { transform: translateY(-30px) translateX(15px); opacity: 0.4; }
          100% { transform: translateY(-60px) translateX(0px); opacity: 0.1; }
        }
        .particle {
          position: absolute;
          background: #ff3c00;
          border-radius: 50%;
          pointer-events: none;
          animation: floatParticles 8s infinite ease-in-out;
        }
        /* Liquid morphing filter for logo morphs */
        .gooey-filter {
          filter: url(#gooey-blend);
        }
        .text-letter-reveal {
          display: inline-block;
          animation: letterReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateX(8px);
        }
        @keyframes letterReveal {
          to { opacity: 1; transform: translateX(0); }
        }
        
        /* PREMIUM CINEMATIC TEXT REVEAL & MORPH */
        @keyframes cinematicTextReveal {
          0% {
            opacity: 0;
            filter: blur(16px);
            letter-spacing: -0.15em;
            transform: scale(0.92);
          }
          50% {
            opacity: 0.8;
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            letter-spacing: 0.05em;
            transform: scale(1.0);
          }
        }
        .cinematic-text-reveal {
          animation: cinematicTextReveal 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .text-shimmer {
          background: linear-gradient(110deg, #ffffff 35%, #8a8a8f 50%, #ffffff 65%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerActive 2.5s infinite linear;
        }
        @keyframes shimmerActive {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes textMelt {
          0% {
            transform: scale(1.0);
            letter-spacing: 0.05em;
            filter: blur(0px);
            opacity: 1;
          }
          100% {
            transform: scale(0.6);
            letter-spacing: -0.3em;
            filter: blur(8px);
            opacity: 0.15;
          }
        }
        .text-melt-anim {
          animation: textMelt 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes logoSolidify {
          0% {
            transform: scale(0.4);
            filter: blur(8px);
            opacity: 0;
          }
          100% {
            transform: scale(1.0);
            filter: blur(0px);
            opacity: 1;
          }
        }
        .logo-solidify-anim {
          animation: logoSolidify 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* SVG Liquid/Gooey Filter for Morphing */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="gooey-blend">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* --- CINEMATIC AMBIENCE (BACKGROUND GLOWS & PARTICLES) --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft orange accent glow top-right */}
        <div className="absolute -top-48 -right-48 w-[45rem] h-[45rem] bg-[#ff3c00] opacity-[0.09] blur-[150px] rounded-full transition-transform duration-[6s] ease-in-out scale-105" />
        
        {/* Faint center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-[#ff3c00] opacity-[0.02] blur-[130px] rounded-full" />
        
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-vignette opacity-90 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, transparent 30%, #050505 100%)' }} />

        {/* Subtle Floating Particles */}
        <div className="particle w-1.5 h-1.5 top-1/4 left-1/3" style={{ animationDelay: '0s', animationDuration: '6s' }} />
        <div className="particle w-2 h-2 top-2/3 left-1/4" style={{ animationDelay: '2s', animationDuration: '9s' }} />
        <div className="particle w-1 h-1 top-1/2 left-3/4" style={{ animationDelay: '4s', animationDuration: '7s' }} />
        <div className="particle w-2.5 h-2.5 top-1/3 left-2/3" style={{ animationDelay: '1s', animationDuration: '10s' }} />
      </div>

      {/* --- FLOATING CINEMATIC FRAME wrapper (homepage container) --- */}
      <div className={`w-full h-full min-h-[92vh] flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden rounded-3xl border border-white/5 bg-[#101010]/40 backdrop-blur-xl shadow-[0_0_100px_rgba(255,60,0,0.06)] z-10 transition-all duration-[1200ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        introStage === 'reveal' || introStage === 'interactive' ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0 pointer-events-none'
      }`}>

        {/* --- TOP HEADER NAVIGATION BAR --- */}
        <header className={`w-full flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/10 pb-6 z-20 transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) delay-[400ms] ${
          introStage === 'interactive' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center space-x-3">
            {/* SVG Custom Cloud Logo Icon */}
            <div className="p-2.5 bg-[#161616] border border-white/10 text-white rounded-xl shadow-md">
              <svg className="w-6 h-6" viewBox="0 0 200 200" fill="currentColor">
                <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
              </svg>
            </div>
            <span className="text-xl font-black italic tracking-tighter text-white uppercase">CLOUDLOCKR</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
              className="text-sm font-bold px-4 py-2.5 text-[#8a8a8f] hover:text-white transition"
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="text-sm font-extrabold px-6 py-3 border border-white/10 bg-white text-black hover:bg-gray-100 rounded-full shadow-md active:scale-95 transition"
            >
              Create Account
            </button>
          </div>
        </header>

        {/* --- MAIN BODY: EXPANDABLE COLUMNS CARD --- */}
        <main className="w-full flex-1 flex flex-col justify-center py-8 z-10">
          
          {/* Title header block */}
          <div className={`text-center space-y-2 mb-8 transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) ${
            introStage === 'interactive' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              We secure your cloud environment
            </h1>
            <p className="text-xs sm:text-base text-[#8a8a8f] max-w-xl mx-auto font-medium">
              Real-time compliance monitoring, automated scans auditing, and GenAI remediation advisors.
            </p>
          </div>

          {/* Full-width 6-column rising accordion panel */}
          <div 
            className={`w-full h-[55vh] flex gap-4 transition-all duration-[900ms] cubic-bezier(0.16, 1, 0.3, 1) delay-[200ms] ${
              introStage === 'interactive' ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
            onMouseLeave={() => {
              if (introStage === 'interactive') setHoveredIdx(null);
            }}
          >
            {columns.map((col, idx) => {
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => {
                    if (introStage === 'interactive') setHoveredIdx(idx);
                  }}
                  className={`relative h-full border border-white/5 rounded-[2rem] flex flex-col justify-between p-8 transition-all duration-[500ms] ease-out overflow-hidden ${
                    isHovered 
                      ? `flex-[2.5] border-none shadow-[0_15px_45px_rgba(0,0,0,0.5)] ${col.colorBg} ${col.colorText}` 
                      : 'flex-[0.5] bg-[#151515] text-white/40 hover:text-white border-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Large watermark text */}
                  <div
                    className="absolute inset-0 flex items-center justify-center font-extrabold text-[8rem] tracking-tighter opacity-[0.02] pointer-events-none select-none font-mono whitespace-nowrap"
                    style={{ transform: 'rotate(-90deg)' }}
                  >
                    {col.watermark}
                  </div>

                  {/* Header text info */}
                  <div className={`space-y-1 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{col.subtitle}</span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">{col.title}</h3>
                  </div>

                  {/* Floating icon */}
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className={`transition-all duration-500 ${
                      isHovered ? 'scale-125 animate-float' : 'scale-95 animate-float'
                    }`}>
                      {col.icon}
                    </div>
                  </div>

                  {/* Checklist block */}
                  {isHovered ? (
                    <div className="space-y-2 pt-4 border-t border-black/10 animate-[fadeIn_0.5s_ease-out] max-w-md">
                      {col.checks.map((check, cIdx) => (
                        <div key={cIdx} className="flex items-center space-x-2 text-xs font-semibold">
                          <span>✔</span>
                          <span>{check}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center font-black text-sm tracking-wider select-none opacity-40">
                      {idx === 0 ? 'S3' : idx === 1 ? 'EC2' : idx === 2 ? 'IAM' : idx === 3 ? 'SG' : idx === 4 ? 'TRAIL' : 'AI'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* --- FOOTER STATEMENT --- */}
        <footer className={`w-full flex items-center justify-between text-[11px] text-[#8a8a8f] font-semibold border-t border-white/10 pt-6 z-20 transition-all duration-[800ms] cubic-bezier(0.16, 1, 0.3, 1) delay-[500ms] ${
          introStage === 'interactive' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <span>CLOUDLOCKR CSPM Dashboard</span>
          <span>All scanning metrics operational</span>
        </footer>

      </div>

      {/* --- FLOATING AUTHENTICATION MODAL DIALOG --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-[#101010] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 relative text-white">
            
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full border border-white/10 text-[#8a8a8f] hover:text-white bg-[#151515] hover:shadow active:scale-95 transition"
            >
              <HiX size={16} />
            </button>

            {/* Modal Headers */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-[#8a8a8f] font-semibold">
                {authMode === 'signin' 
                  ? 'Connect secure tunnel to CSPM dashboard.' 
                  : 'Register administrative security privileges.'
                }
              </p>
            </div>

            {/* Forms fields */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8f] pl-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8a8a8f]">
                      <HiUser size={18} />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Afnan"
                      className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff3c00] transition neumorphic-input"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8f] pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8a8a8f]">
                    <HiMail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@cloudlockr.com"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff3c00] transition font-mono neumorphic-input"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8f] pl-1">
                    Security Analyst Role
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8a8a8f] pointer-events-none">
                      <HiBriefcase size={18} />
                    </span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff3c00] transition appearance-none cursor-pointer neumorphic-input"
                    >
                      <option value="Viewer">Viewer (Read-only access)</option>
                      <option value="Security Analyst">Security Analyst (Configure Rules & Scan)</option>
                      <option value="Admin">Admin (Full administrative privileges)</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8a8a8f] pointer-events-none text-[10px]">
                      ▼
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a8a8f] pl-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8a8a8f]">
                    <HiLockClosed size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050505] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff3c00] transition font-mono neumorphic-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8a8a8f] hover:text-white transition"
                  >
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit skeuomorphic action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full neumorphic-btn font-bold py-3 px-4 rounded-xl text-sm transition flex justify-center items-center active:scale-[0.98] mt-4"
              >
                {submitting ? (
                  <span className="flex items-center space-x-2 text-gray-500">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Synchronizing Secure Keys...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5">
                    <span>Create Account</span>
                    <HiOutlineArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Toggle Signin / Signup mode */}
            <div className="pt-4 border-t border-white/10 text-center">
              {authMode === 'signin' ? (
                <p className="text-xs text-[#8a8a8f]">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signup')}
                    className="text-[#ff3c00] hover:underline font-bold transition ml-1"
                  >
                    Create one
                  </button>
                </p>
              ) : (
                <p className="text-xs text-[#8a8a8f]">
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-[#ff3c00] hover:underline font-bold transition ml-1"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- CINEMATIC SHAPE-SHIFTING INTRO SPLASH LAYER --- */}
      {introStage !== 'interactive' && (
        <div className={`fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${
          introStage === 'reveal' ? 'scale-[0.97] opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}>
          
          {/* Volumetric light lighting for splash overlay */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#ff3c00] opacity-[0.12] blur-[140px] rounded-full pointer-events-none transition-opacity duration-1000" />
          
          {/* Liquid Gooey Morphing Container */}
          <div className="relative w-80 h-80 flex flex-col items-center justify-center gooey-filter text-white">
            
            {/* STAGE 1: Text "CLOUDLOCKR" appears first with cinematic reveal */}
            {introStage === 'text_reveal' && (
              <div className="text-4xl sm:text-5xl font-black italic select-none text-shimmer cinematic-text-reveal text-center">
                CLOUDLOCKR
              </div>
            )}

            {/* STAGE 2: Morphing transition - Text melts while logo solidifies */}
            {introStage === 'logo_morph' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute text-4xl sm:text-5xl font-black italic select-none text-center text-melt-anim text-white">
                  CLOUDLOCKR
                </div>
                <div className="absolute logo-solidify-anim">
                  <svg className="w-32 h-32 text-white animate-float" viewBox="0 0 200 200" fill="currentColor">
                    <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
                  </svg>
                </div>
              </div>
            )}

            {/* STAGE 3: Cloud Logo shown fully */}
            {(introStage === 'logo_details' || introStage === 'reveal') && (
              <div className="flex flex-col items-center space-y-4 scale-100 opacity-100 transition-all duration-700 ease-in-out">
                <svg className="w-32 h-32 animate-float text-white" viewBox="0 0 200 200" fill="currentColor">
                  <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
                </svg>
              </div>
            )}

          </div>

          {/* STAGE 3: Letters reveal company name below the Logo */}
          {(introStage === 'logo_details' || introStage === 'reveal') && (
            <div className="mt-2 text-lg tracking-[0.25em] font-extrabold uppercase text-white/90 select-none">
              {"CLOUDLOCKR".split("").map((char, index) => (
                <span 
                  key={index} 
                  className="text-letter-reveal text-white font-black italic tracking-tighter" 
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  {char}
                </span>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Register;
