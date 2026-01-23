"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import LoadingSpinner from "../shared ui/LoadingSpinner";
import { Toaster } from "react-hot-toast";

interface Props {
  children: React.ReactNode;
}

export default function DashboardContent({ children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 700);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = React.useCallback(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);


  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Toaster position="top-right" />

      {/* Dark Overlay for mobile when sidebar is open */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar (Always fixed, never moves) */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        </div>

        {/* Page Content */}
        <main
          className={`pt-16 p-6 transition-all duration-300 h-screen overflow-y-auto`}
          style={{
            marginLeft: !isMobile && isSidebarOpen ? '288px' : '0'
          }}
        >
          {children}

          {/* <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense> */}
        </main>
      </div>
    </div>
  );
}


