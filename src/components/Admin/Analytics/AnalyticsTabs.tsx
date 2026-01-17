'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import TabNavigation, { TabItem } from '../../shared ui/TabNavigation';
import { LuTrendingUp, LuReceipt } from "react-icons/lu";

const AnalyticsTabs: React.FC = () => {
  const pathname = usePathname();

  // Extract the analytics route → /profit-loss, /expenses
  const activeTabId = pathname.split("/")[3] || "profit-loss";

  const analyticsTabs: TabItem[] = [
    { 
      id: 'profit-loss', 
      label: 'Profit & Loss', 
      path: '/admin/analytics/profit-loss', 
      icon: <LuTrendingUp size={18} /> 
    },
    { 
      id: 'expenses', 
      label: 'Expenses', 
      path: '/admin/analytics/expenses', 
      icon: <LuReceipt size={18} /> 
    },
  ];

  // Wrap each tab with Next.js Link
  const tabsWithLink = analyticsTabs.map(tab => ({
    ...tab,
    render: (isActive: boolean) => (
      <Link
        key={tab.id}
        href={tab.path}        
      >
        {tab.icon}
        {tab.label}
      </Link>
    ),
  }));

  return <TabNavigation tabs={tabsWithLink} activeTabId={activeTabId} />;
};

export default AnalyticsTabs;
