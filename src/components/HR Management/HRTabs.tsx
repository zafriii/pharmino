'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import TabNavigation, { TabItem } from '../shared ui/TabNavigation';
import { LuUsersRound, LuDollarSign } from "react-icons/lu";
import { CiClock2 } from "react-icons/ci";
import { IoKeyOutline } from "react-icons/io5";

const HRTabs: React.FC = () => {
  const pathname = usePathname();

  // Extract first-level route → /directory, /payroll, etc.
  const activeTabId = pathname.split("/")[3] || "directory";

  const hrTabs: TabItem[] = [
    { id: 'directory', label: 'Directory', path: '/admin/hr/directory', icon: <LuUsersRound size={18} /> },
    { id: 'payroll', label: 'Payroll', path: '/admin/hr/payroll', icon: <LuDollarSign size={18} /> },
    { id: 'attendance', label: 'Attendance', path: '/admin/hr/attendance', icon: <CiClock2 size={18} /> },
    { id: 'authentication', label: 'Authentication', path: '/admin/hr/authentication', icon: <IoKeyOutline size={18} /> },
  ];

  // Wrap each tab with Next.js Link
  const tabsWithLink = hrTabs.map(tab => ({
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

export default HRTabs;
