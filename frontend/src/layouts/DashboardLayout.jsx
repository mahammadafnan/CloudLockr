import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-[#0c0e0c] select-none font-sans">
      {/* Sidebar on the left */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main dashboard content on the right, consuming the remaining screen */}
      <div className="flex-grow flex flex-col min-w-0 bg-white relative overflow-hidden h-screen">
        <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main className="flex-grow p-6 overflow-y-auto h-[calc(100%-64px)] bg-[#f6f8f6]">
          <div className="w-full max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
