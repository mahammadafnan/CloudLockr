import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiShieldCheck, 
  HiUser, 
  HiMail, 
  HiLockClosed, 
  HiEye, 
  HiEyeOff, 
  HiBriefcase,
  HiOutlineCloud,
  HiOutlineServer,
  HiOutlineDatabase,
  HiOutlineFingerPrint,
  HiOutlineShieldCheck
} from 'react-icons/hi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error('All registration details must be specified.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, role);
      toast.success('Registration successful! Session loaded.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col lg:flex-row relative overflow-hidden select-none font-sans">
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .network-line {
          stroke-dasharray: 4 4;
          animation: dash 1.5s linear infinite;
        }
        .pulse-glow {
          animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: .6;
            transform: scale(1.05);
          }
        }
      `}</style>

      {/* --- GLOWING AMBER/BLUE GRADIENTS --- */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-500/15 to-red-500/0 blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/0 blur-[120px] pointer-events-none"></div>

      {/* --- LEFT SECTION: GCORE ESTHETIC PRODUCT SHOWCASE --- */}
      <div className="hidden lg:flex lg:w-7/12 p-12 flex-col justify-between relative overflow-hidden bg-black border-r border-gray-900 z-10">
        
        {/* Top Header Row */}
        <div className="flex items-center space-x-2 text-white">
          <div className="p-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-lg">
            <HiShieldCheck size={24} />
          </div>
          <span className="text-lg font-bold tracking-tight">CloudLockr</span>
          <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase bg-gray-900 border border-gray-850 px-1.5 py-0.5 rounded">CSPM</span>
        </div>

        {/* Center Hero Marketing Area */}
        <div className="space-y-6 max-w-xl my-auto">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold">
            <span>✨</span>
            <span>GenAI Cloud Posture Management</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Security Posture <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-amber-400">at the Cloud Edge</span>
          </h1>

          <p className="text-base text-gray-400 leading-relaxed">
            Audit cloud boundaries in real-time. Ingest AWS infrastructure setups, match profiles against standard compliance matrices, and execute Gemini remediation intelligence automatically.
          </p>

          {/* Animated Topological Network SVG */}
          <div className="relative pt-6">
            <svg className="w-full h-48 text-orange-500/40" viewBox="0 0 500 200" fill="none">
              {/* Lines from nodes to center */}
              <line className="network-line" x1="100" y1="50" x2="250" y2="100" stroke="#f97316" strokeWidth="1.5" />
              <line className="network-line" x1="100" y1="150" x2="250" y2="100" stroke="#f97316" strokeWidth="1.5" />
              <line className="network-line" x1="250" y1="30" x2="250" y2="100" stroke="#f97316" strokeWidth="1.5" />
              <line className="network-line" x1="400" y1="50" x2="250" y2="100" stroke="#f97316" strokeWidth="1.5" />
              <line className="network-line" x1="400" y1="150" x2="250" y2="100" stroke="#f97316" strokeWidth="1.5" />

              {/* Central node ring */}
              <circle className="pulse-glow" cx="250" cy="100" r="28" fill="rgba(249, 115, 22, 0.1)" stroke="#f97316" strokeWidth="1" />
              <circle cx="250" cy="100" r="18" fill="#1c1917" stroke="#f97316" strokeWidth="2" />

              {/* Surrounding nodes */}
              <circle cx="100" cy="50" r="16" fill="#1c1917" stroke="#374151" strokeWidth="1.5" />
              <circle cx="100" cy="150" r="16" fill="#1c1917" stroke="#374151" strokeWidth="1.5" />
              <circle cx="250" cy="30" r="16" fill="#1c1917" stroke="#374151" strokeWidth="1.5" />
              <circle cx="400" cy="50" r="16" fill="#1c1917" stroke="#374151" strokeWidth="1.5" />
              <circle cx="400" cy="150" r="16" fill="#1c1917" stroke="#374151" strokeWidth="1.5" />
            </svg>

            {/* Central icon placement */}
            <div className="absolute top-[96px] left-[238px] text-orange-500">
              <HiOutlineShieldCheck size={24} />
            </div>

            {/* Surrounding icon placement */}
            <div className="absolute top-[48px] left-[88px] text-gray-400" title="S3 Storage">
              <HiOutlineDatabase size={24} />
            </div>
            <div className="absolute top-[148px] left-[88px] text-gray-400" title="EC2 Instances">
              <HiOutlineServer size={24} />
            </div>
            <div className="absolute top-[28px] left-[238px] text-gray-400" title="IAM Configurations">
              <HiOutlineFingerPrint size={24} />
            </div>
            <div className="absolute top-[48px] left-[388px] text-gray-400" title="Security Groups">
              <HiOutlineCloud size={24} />
            </div>
            <div className="absolute top-[148px] left-[388px] text-gray-400" title="CloudTrail Logs">
              <HiShieldCheck size={24} />
            </div>
          </div>
        </div>

        {/* Bottom Status bar footer */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>All scanning daemons operational. System secure.</span>
        </div>

      </div>

      {/* --- RIGHT SECTION: SLEEK ENTRY FORM AREA --- */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 bg-[#030303] z-10 relative">
        <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-900 rounded-2xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          
          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
            <p className="text-xs text-zinc-500">Register analyst access boundaries</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <HiUser size={18} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Afnan"
                  className="w-full bg-black border border-zinc-900 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <HiMail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="afnan@sentinelcloud.com"
                  className="w-full bg-black border border-zinc-900 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Assign Security Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600 pointer-events-none">
                  <HiBriefcase size={18} />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-black border border-zinc-900 rounded-lg pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition appearance-none cursor-pointer"
                >
                  <option value="Viewer">Viewer (Read-only access)</option>
                  <option value="Security Analyst">Security Analyst (Configure Rules & Scan)</option>
                  <option value="Admin">Admin (Full administrative privileges)</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 pointer-events-none text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-600">
                  <HiLockClosed size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-zinc-900 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition"
                >
                  {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] flex justify-center items-center mt-2"
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Registering Account...</span>
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-6 border-t border-zinc-900 text-center">
            <p className="text-xs text-zinc-500">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-500 hover:text-orange-400 font-semibold transition">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
