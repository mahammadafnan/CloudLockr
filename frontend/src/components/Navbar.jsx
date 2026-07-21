import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBell, HiMenu } from 'react-icons/hi';

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user } = useAuth();
  const [alertsCount, setAlertsCount] = useState(3);

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-[#e6e8eb] bg-white relative shrink-0 select-none">
      {/* Left side: title */}
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-[#e6e8eb] bg-[#f9fafb] text-gray-500 hover:text-black transition"
          >
            <HiMenu size={18} />
          </button>
        )}
        <h1 className="text-xl font-bold text-black tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
          Dashboard
        </h1>
      </div>

      {/* Right side: widgets */}
      <div className="flex items-center gap-4">
        {/* Bell notification */}
        <button
          onClick={() => setAlertsCount(0)}
          className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f3f4f6] transition text-black"
        >
          <HiOutlineBell size={18} />
          {alertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>
          )}
        </button>

        {/* Add custom widget style button */}
        <button 
          className="bg-black text-white hover:bg-black/90 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}
        >
          Add Custom Widget
        </button>
      </div>
    </header>
  );
};

export default Navbar;
