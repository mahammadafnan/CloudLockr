import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  HiOutlineViewGrid,
  HiOutlineCloud,
  HiOutlineCube,
  HiOutlineShieldExclamation,
  HiOutlineDocumentReport,
  HiOutlineClock,
  HiOutlineAdjustments,
  HiOutlineLogout
} from 'react-icons/hi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const mainLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <HiOutlineViewGrid size={18} /> },
    { name: 'Security Findings', path: '/findings', icon: <HiOutlineShieldExclamation size={18} /> },
    { name: 'Reports', path: '/reports', icon: <HiOutlineDocumentReport size={18} /> },
    { name: 'Scan History', path: '/history', icon: <HiOutlineClock size={18} /> },
    { name: 'Cloud Accounts', path: '/accounts', icon: <HiOutlineCloud size={18} /> },
    { name: 'Resource Findings', path: '/resources', icon: <HiOutlineCube size={18} /> },
  ];

  return (
    <aside
      className={`h-full bg-[#0c0e0c] flex flex-col justify-between transition-all duration-300 z-30 select-none border-r border-[#1a221c] ${
        isOpen ? 'w-64' : 'w-20'
      }`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
    >
      {/* Brand Header */}
      <div className="p-5 flex flex-col gap-4 border-b border-[#161d18]">
        <div className="flex items-center">
          {isOpen ? (
            <span className="text-base font-bold text-white tracking-tight">CloudLockr</span>
          ) : (
            <span className="text-base font-bold text-[#39ff14] tracking-tight">CL</span>
          )}
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-4 space-y-1">
        {isOpen && (
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-3 mb-2">
            Navigation
          </div>
        )}
        {mainLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#121c13] border border-[#1e3a22] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#121612]/50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0">{link.icon}</span>
              {isOpen && <span>{link.name}</span>}
            </div>
            {isOpen && link.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                link.badge === 'New' ? 'bg-[#39ff14] text-black' : 'bg-[#1e251f] border border-[#2b6d34] text-gray-400'
              }`}>
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Flex Spacer to push Settings and User Account to the absolute bottom */}
      <div className="flex-grow"></div>

      {/* Settings Link (rendered at the bottom above the profile) */}
      <div className="px-3 pb-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-[#121c13] border border-[#1e3a22] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#121612]/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <HiOutlineAdjustments size={18} className="shrink-0" />
            {isOpen && <span>Settings</span>}
          </div>
        </NavLink>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-[#161d18] bg-[#0a0c0a] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#1b4a22] border border-[#2b6d34] flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || 'CL'}
            </div>
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">{user?.name || 'Afnan'}</span>
                <span className="text-[10px] text-gray-500 font-mono truncate">#cl-0974</span>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-[#1e251f] hover:border-[#ba1a1a]/30 text-gray-400 hover:text-[#ff4d4d] transition"
              title="Logout"
            >
              <HiOutlineLogout size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
