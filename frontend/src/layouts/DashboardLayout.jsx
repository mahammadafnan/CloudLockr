import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Page Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top Header Navbar */}
        <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Dynamic Nested Page Content */}
        <main className="flex-grow p-6 relative">
          {/* Background Decorative Glow */}
          <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-[#ff3c00]/5 rounded-full blur-[130px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto w-full relative z-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
