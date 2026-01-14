"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import LoadingSpinner from "../shared ui/LoadingSpinner";
import { Toaster } from "react-hot-toast";

interface Props {
  children: React.ReactNode;
}

// Loading component for page transitions
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mx-auto mb-4" />     
    </div>
  </div>
);

export default function DashboardContent({ children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle navigation loading states
  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    // Listen for route changes
    const originalPush = router.push;
    router.push = (...args) => {
      handleStart();
      const result = originalPush.apply(router, args);
      // Reset loading state after a short delay
      setTimeout(handleComplete, 100);
      return result;
    };

    return () => {
      router.push = originalPush;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      <Toaster position="top-right" />

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
          className={`pt-16 p-6 transition-all duration-300 h-screen overflow-y-auto ${
            isSidebarOpen ? "ml-72" : "ml-0"
          }`}
        >
          {/* Show loading spinner during navigation */}
          {isNavigating && (
            <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40">
              <PageLoader />
            </div>
          )}
          
          {children}

          {/* <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense> */}
        </main>
      </div>
    </div>
  );
}


