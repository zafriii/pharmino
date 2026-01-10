'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import TabNavigation, { TabItem } from '../../shared ui/TabNavigation';


const PuchaseTabs: React.FC = () => {
  const pathname = usePathname();

  const activeTabId = pathname.split("/")[4] || "ordered-items";

  const productTabs: TabItem[] = [
    { id: 'ordered-items', label:'Purchase Orders', path: '/admin/purchase/purchase-history/ordered-items' },
    { id: 'received-items', label:'Received Orders', path: '/admin/purchase/purchase-history/received-items' },
  ];

  // Wrap each tab with Next.js Link
  const tabsWithLink = productTabs.map(tab => ({
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

export default PuchaseTabs;
