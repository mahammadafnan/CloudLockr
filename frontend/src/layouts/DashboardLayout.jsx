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
    <div className="min-h-screen bg-[#0a0f1d] text-gray-100 flex overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Page Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top Header Navbar */}
        <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Dynamic Nested Page Content */}
        <main className="flex-grow p-6 relative">
          {/* Background Decorative Glow */}
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-900/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto w-full relative z-10 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
