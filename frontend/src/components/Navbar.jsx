import React from 'react';
import { useLocation } from 'react-router-dom';
import { HiMenu } from 'react-icons/hi';

const getPageTitle = (pathname) => {
  if (pathname.startsWith('/accounts')) return 'Cloud Accounts';
  if (pathname.startsWith('/resources')) return 'Resource Findings';
  if (pathname.startsWith('/findings')) return 'Security Findings';
  if (pathname.startsWith('/compliance')) return 'Compliance Benchmarks';
  if (pathname.startsWith('/reports')) return 'Executive Reports';
  if (pathname.startsWith('/history')) return 'Scan History';
  if (pathname.startsWith('/settings')) return 'System Settings';
  return 'Dashboard';
};

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-[#e6e8eb] bg-white relative shrink-0 select-none">
      {/* Left side: title & toggle */}
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-[#e6e8eb] bg-[#f9fafb] text-gray-500 hover:text-black transition"
            title="Expand Sidebar"
          >
            <HiMenu size={18} />
          </button>
        )}
        <h1 className="text-xl font-bold text-black tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
          {title}
        </h1>
      </div>
    </header>
  );
};

export default Navbar;
