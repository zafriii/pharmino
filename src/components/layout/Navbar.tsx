"use client";

import React from "react";
import { GoSidebarCollapse } from "react-icons/go";
import { IoNotificationsOutline } from "react-icons/io5";


interface NavbarProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 700);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header
      className="h-16 bg-[#FFFFFF] flex items-center justify-between px-4 sticky top-0 z-40 transition-all duration-300"
      style={{
        marginLeft: !isMobile && isSidebarOpen ? '256px' : '0'
      }}
    >
      {/* Left: Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="p-4.5 rounded-md hover:bg-gray-100 text-gray-600 hover:py-2  focus:outline-none transition-all duration-200 cursor-pointer"
      >
        <GoSidebarCollapse size={24} />
      </button>

      {/* Right: User & Actions (Placeholder based on image) */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
           <IoNotificationsOutline size={20} />
        </button>
        
       
      </div>
    </header>
  );
};

// export default Navbar;

export default React.memo(Navbar);