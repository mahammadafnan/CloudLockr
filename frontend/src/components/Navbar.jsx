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
  const [darkMode, setDarkMode] = useState(false);
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
    <header className="h-16 bg-surface/85 backdrop-blur-md border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left items: sidebar hamburger and search */}
      <div className="flex items-center space-x-4 flex-grow max-w-md">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-ink-secondary hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            <HiMenu size={20} />
          </button>
        )}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            <HiOutlineSearch size={18} />
          </span>
          <input
            type="text"
            placeholder="Search resources, findings, or compliance mappings..."
            className="w-full bg-surface-secondary border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Right items: user role state indicators, settings, profile */}
      <div className="flex items-center space-x-4">
        {/* Active Role status badge */}
        <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-500">
          Role: {user?.role || 'Viewer'}
        </span>

        {/* Dark/Light mode theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-ink-secondary hover:text-foreground hover:bg-sidebar-accent border border-border bg-surface-secondary/50 transition-all duration-150"
          title="Toggle system theme color"
        >
          {darkMode ? <HiOutlineSun size={18} /> : <HiOutlineMoon size={18} />}
        </button>

        {/* Notifications list trigger */}
        <button
          onClick={() => setAlertsCount(0)}
          className="p-2 rounded-lg text-ink-secondary hover:text-foreground hover:bg-sidebar-accent border border-border bg-surface-secondary/50 relative transition-all duration-150"
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
        <div className="flex items-center space-x-2 border-l border-border pl-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-semibold text-foreground">{user?.name || 'Afnan'}</span>
            <span className="text-[10px] text-gray-500 font-mono">online</span>
          </div>
          <HiOutlineUserCircle size={28} className="text-gray-400 hover:text-foreground transition-colors cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
