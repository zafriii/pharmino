// "use client";

// import React, { useState, useEffect, useRef } from "react";

// export interface TabItem {
//   id: string;
//   label: string;
// }

// interface FilterTabsProps {
//   tabs: TabItem[];
//   onTabChange: (tabId: string) => void;
//   initialActiveTab?: string;
// }

// const FilterTabs: React.FC<FilterTabsProps> = ({
//   tabs,
//   onTabChange,
//   initialActiveTab,
// }) => {
//   const [activeTabId, setActiveTabId] = useState(
//     initialActiveTab || (tabs.length > 0 ? tabs[0].id : "")
//   );
//   const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
//   const tabRefs = useRef<Array<HTMLDivElement | null>>([]);

//   // --- FIXED: removed `tabs` dependency to stop infinite loop ---
//   useEffect(() => {
//     const activeIndex = tabs.findIndex((tab) => tab.id === activeTabId);
//     const activeTabRef = tabRefs.current[activeIndex];

//     if (activeTabRef) {
//       const { offsetLeft, clientWidth } = activeTabRef;
//       setIndicatorStyle({ left: offsetLeft, width: clientWidth });
//     }
//   }, [activeTabId]);   // ONLY depends on activeTabId

//   const handleTabClick = (tabId: string) => {
//     setActiveTabId(tabId);
//     onTabChange(tabId);

//     const activeIndex = tabs.findIndex((tab) => tab.id === tabId);
//     const activeTabRef = tabRefs.current[activeIndex];
//     if (activeTabRef) {
//       activeTabRef.scrollIntoView({ behavior: "smooth", inline: "center" });
//     }
//   };

//   return (
//     <div className="relative w-full">
//       <div className="relative flex bg-gray-100 rounded-full p-1 overflow-x-auto whitespace-nowrap no-scrollbar">
//         {tabs.map((tab, index) => {
//           const isActive = activeTabId === tab.id;
//           return (
//             <div
//               key={tab.id}
//               ref={(el) => (tabRefs.current[index] = el)}
//               className={`flex items-center justify-center px-5 h-9 rounded-full text-sm font-medium cursor-pointer z-10 transition-all duration-300 flex-shrink-0
//                 ${
//                   isActive
//                     ? "bg-[#059669] text-white"
//                     : "text-gray-600 hover:text-[#059669] hover:bg-gray-200"
//                 }
//               `}
//               onClick={() => handleTabClick(tab.id)}
//             >
//               {tab.label}
//             </div>
//           );
//         })}

//         {/* Sliding indicator */}
//         <div
//           className="absolute bottom-1 top-1 bg-[#059669] rounded-full transition-all duration-300"
//           style={{
//             left: indicatorStyle.left,
//             width: indicatorStyle.width,
//             zIndex: 1,
//           }}
//         ></div>
//       </div>
//     </div>
//   );
// };

// export default FilterTabs;




"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
}

interface FilterTabsProps {
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
  initialActiveTab?: string;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  tabs,
  onTabChange,
  initialActiveTab,
}) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTab || (tabs.length > 0 ? tabs[0].id : "")
  );

  const handleTabClick = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange(tabId);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex bg-gray-100 rounded-full p-1 overflow-x-auto whitespace-nowrap no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          
          return (
            <motion.div
              key={tab.id}
              className="relative flex-shrink-0"
              whileHover={!isActive ? { scale: 1.02 } : {}}
              whileTap={!isActive ? { scale: 0.98 } : {}}
            >
              <button
                className={`
                  relative flex items-center justify-center px-5 h-9 rounded-full text-sm font-medium cursor-pointer z-10 transition-colors duration-200
                  ${isActive ? "text-white" : "text-gray-600 hover:text-[#4a90e2]"}
                `}
                onClick={() => handleTabClick(tab.id)}
              >
                {/* Animated background indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="filterActiveTab"
                      className="absolute inset-0 bg-[#4a90e2] rounded-full shadow-sm"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.6
                      }}
                    />
                  )}
                </AnimatePresence>
                
                {/* Label with z-index */}
                <span className="relative z-10">{tab.label}</span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FilterTabs;








