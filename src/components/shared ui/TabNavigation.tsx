'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from '@/stores/navigationStore';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTabId: string;
}

const TabNavigation = ({ tabs, activeTabId }: TabNavigationProps) => {
  const { isNavigating, startNavigation, endNavigation } = useNavigationStore();
  const [animatingTabId, setAnimatingTabId] = useState<string | null>(null);

  const handleTabClick = (tabId: string) => {
    setAnimatingTabId(tabId);
    startNavigation();
  };

  const handleAnimationComplete = () => {
    // Animation complete hole navigation reset
    endNavigation();
    setAnimatingTabId(null);
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <motion.div 
        className="inline-flex bg-[#F1F5F9] rounded-full p-1.5 min-w-max relative"
        layout
      >
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const isAnimating = animatingTabId === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              onClick={() => handleTabClick(tab.id)}
              className="relative"
            >
              <motion.button
                className={`
                  relative flex items-center gap-2 px-5 h-9 rounded-full text-sm font-medium whitespace-nowrap
                  ${isNavigating && !isAnimating ? 'opacity-60 pointer-events-none' : 'opacity-100'}
                  transition-opacity duration-150
                `}
                style={{
                  color: isActive ? '#ffffff' : '#4b5563'
                }}
                whileHover={!isActive ? { 
                  scale: 1.02,
                  
                  color:'#4a90e2'
                } : {}}
                whileTap={!isActive ? { scale: 0.98 } : {}}
              >
                {/* Animated background */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      layoutId="activeBg"
                      className="absolute inset-0 bg-gradient-to-r bg-[#4a90e2] rounded-full shadow-md"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                        mass: 0.5,
                        duration: 0.4
                      }}
                      onAnimationComplete={handleAnimationComplete}
                    />
                  )}
                </AnimatePresence>
                
                {/* Content with proper z-index */}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon && (
                    <motion.span 
                      className="text-lg"
                      animate={{
                        rotate: isActive ? [0, -10, 10, 0] : 0,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut",
                        delay: 0.1
                      }}
                    >
                      {tab.icon}
                    </motion.span>
                  )}
                  <span>{tab.label}</span>
                </span>
              </motion.button>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
};

export default TabNavigation;