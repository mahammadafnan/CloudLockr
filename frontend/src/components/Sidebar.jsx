import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  HiShieldCheck,
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
    { name: 'Compliance benchmarks', path: '/compliance', icon: <HiOutlineCheckCircle size={20} /> },
    { name: 'Executive Reports', path: '/reports', icon: <HiOutlineDocumentReport size={20} /> },
    { name: 'Scan History', path: '/history', icon: <HiOutlineClock size={20} /> },
    { name: 'System Settings', path: '/settings', icon: <HiOutlineAdjustments size={20} /> },
  ];

  return (
    <aside
      className={`h-screen bg-[#111827] border-r border-gray-800 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand logo container */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 text-blue-500 animate-pulse-slow shrink-0">
            <HiShieldCheck size={24} />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-white">
                Cloud<span className="text-blue-500">Lockr</span>
              </span>
              <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">CSPM</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          {isOpen ? <HiChevronLeft size={20} /> : <HiMenu size={20} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-grow py-4 px-3 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                  : 'text-gray-400 border border-transparent hover:text-white hover:bg-gray-800/60'
              }`
            }
          >
            <div className="shrink-0">{link.icon}</div>
            {isOpen && <span className="truncate">{link.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer info block */}
      <div className="p-4 border-t border-gray-800 bg-[#0e1420]/50 space-y-4">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="h-10 w-10 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
            {user?.name?.slice(0, 2) || 'SA'}
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user?.name || 'Security Analyst'}</span>
              <span className="text-[10px] text-gray-500 font-mono font-medium truncate uppercase mt-0.5">
                {user?.role || 'Analyst'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-red-500/20 hover:border-red-500/40 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-sm font-semibold rounded-lg transition-colors"
        >
          <HiOutlineLogout size={18} className="shrink-0" />
          {isOpen && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
