'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import TabNavigation, { TabItem } from '../shared ui/TabNavigation';


const ProductTabs: React.FC = () => {
  const pathname = usePathname();

  const activeTabId = pathname.split("/")[3] || "products";

  const productTabs: TabItem[] = [
    { id: 'products', label: 'Products', path: '/admin/product-management/products' },
    { id: 'categories', label: 'Categories', path: '/admin/product-management/categories' },
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

export default ProductTabs;
