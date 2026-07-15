import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  HiOutlineViewGrid,
  HiOutlineCloud,
  HiOutlineCube,
  HiOutlineShieldExclamation,
  HiOutlineCheckCircle,
  HiOutlineDocumentReport,
  HiOutlineClock,
  HiOutlineAdjustments,
  HiOutlineLogout,
  HiChevronLeft,
  HiMenu
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <HiOutlineViewGrid size={20} /> },
    { name: 'Cloud Accounts', path: '/accounts', icon: <HiOutlineCloud size={20} /> },
    { name: 'Resource Explorer', path: '/resources', icon: <HiOutlineCube size={20} /> },
    { name: 'Security Findings', path: '/findings', icon: <HiOutlineShieldExclamation size={20} /> },
    { name: 'Compliance Benchmarks', path: '/compliance', icon: <HiOutlineCheckCircle size={20} /> },
    { name: 'Executive Reports', path: '/reports', icon: <HiOutlineDocumentReport size={20} /> },
    { name: 'Scan History', path: '/history', icon: <HiOutlineClock size={20} /> },
    { name: 'System Settings', path: '/settings', icon: <HiOutlineAdjustments size={20} /> },
  ];

  return (
    <aside
      className={`h-screen bg-[#050505] border-r border-white/5 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand logo container */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2.5 bg-white/5 border border-white/5 text-white rounded-xl shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 200 200" fill="currentColor">
              <path d="M50 120 C30 120 20 105 20 90 C20 70 40 60 55 80 C70 100 80 125 100 125 C120 125 130 100 145 80 C160 60 180 70 180 90 C180 105 170 120 150 120 C130 120 120 95 100 95 C80 95 70 120 50 120 Z" />
            </svg>
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-xs font-black italic tracking-tighter text-white uppercase leading-none">
                CLOUDLOCKR
              </span>
              <span className="text-[8px] text-[#8a8a8f] font-mono tracking-widest uppercase mt-0.5">CSPM</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-full text-[#8a8a8f] hover:text-white hover:bg-white/5 transition"
        >
          {isOpen ? <HiChevronLeft size={20} /> : <HiMenu size={20} />}
        </button>
      </div>

      {/* Nav List - Kinetic Rounded style */}
      <nav className="flex-grow py-4 px-3 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#ff3c00] text-white shadow-lg shadow-orange-500/10'
                  : 'text-[#8a8a8f] hover:text-white hover:bg-white/5'
              }`
            }
          >
            <div className="shrink-0">{link.icon}</div>
            {isOpen && <span className="truncate">{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer info block */}
      <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/40 space-y-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-sm">
            {user?.name?.slice(0, 2) || 'SA'}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user?.name || 'Security Analyst'}</span>
              <span className="text-[10px] text-[#8a8a8f] font-mono font-medium truncate uppercase mt-0.5">
                {user?.role || 'Analyst'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-red-500/20 hover:border-red-500/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-sm font-semibold rounded-full transition"
        >
          <HiOutlineLogout size={18} className="shrink-0" />
          {isOpen && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
