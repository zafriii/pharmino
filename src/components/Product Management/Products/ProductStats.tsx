import React from 'react';
import StatsCard from '@/components/shared ui/StatsCard';
import { Product } from '@/types/products.types';

interface ProductStatsProps {
  products: Product[];
}

export default function ProductStats({ products = [] }: ProductStatsProps) {
  const stats = [
    {
      title: 'Total Products',
      value: products.length.toString(),     
      variant: 'blue',
    },
    {
      title: 'Active Products',
      value: products.filter(p => p.status === 'ACTIVE').length.toString(),     
      variant: 'green',
    },
    {
      title: 'Inactive Products',
      value: products.filter(p => p.status === 'INACTIVE').length.toString(),
      variant: 'gray',
    },       
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          variant={stat.variant as any}
        />
      ))}
    </div>
  );
}
