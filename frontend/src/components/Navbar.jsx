import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineBell,
  HiOutlineSearch,
  HiOutlineUserCircle,
  HiMenu
} from 'react-icons/hi';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode for global Kinetic theme
  const [alertsCount, setAlertsCount] = useState(3);

  // Sync theme selection to HTML class List
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left items: sidebar hamburger and search */}
      <div className="flex items-center space-x-4 flex-grow max-w-md">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-full text-[#8a8a8f] hover:text-white hover:bg-white/5 transition"
          >
            <HiMenu size={20} />
          </button>
        )}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8a8a8f]">
            <HiOutlineSearch size={18} />
          </span>
          <input
            type="text"
            placeholder="Search resources, findings, or compliance..."
            className="w-full bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-[#8a8a8f] focus:outline-none focus:bg-white/10 focus:border-white/10 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      {/* Right items: user role state indicators, settings, profile */}
      <div className="flex items-center space-x-4">
        {/* Active Role status badge */}
        <span className="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/5 text-[#ff3c00]">
          Role: {user?.role || 'Viewer'}
        </span>

        {/* Dark/Light mode theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full text-[#8a8a8f] hover:text-white hover:bg-white/5 border border-white/5 bg-white/5 transition"
          title="Toggle system theme color"
        >
          {darkMode ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>

        {/* Notifications list trigger */}
        <button
          onClick={() => setAlertsCount(0)}
          className="p-2 rounded-full text-[#8a8a8f] hover:text-white hover:bg-white/5 border border-white/5 bg-white/5 relative transition"
          title="Security alerts"
        >
          <HiOutlineBell size={18} />
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold font-mono">
              {alertsCount}
            </span>
          )}
        </button>

        {/* User profile dropdown trigger */}
        <div className="flex items-center space-x-2 border-l border-white/5 pl-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-bold text-white">{user?.name || 'Afnan'}</span>
            <span className="text-[10px] text-[#8a8a8f] font-semibold font-sans">online</span>
          </div>
          <HiOutlineUserCircle size={28} className="text-[#8a8a8f] hover:text-white transition-colors cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
