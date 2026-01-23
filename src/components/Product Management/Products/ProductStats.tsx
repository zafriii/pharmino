import React from 'react';
import StatsCard from '@/components/shared ui/StatsCard';
import { Product } from '@/types/products.types';


interface ProductStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
  };
}

export default function ProductStats({ stats }: ProductStatsProps) {
  const statList = [
    {
      title: 'Total Products',
      value: stats.total.toString(),
      variant: 'blue',
    },
    {
      title: 'Active Products',
      value: stats.active.toString(),
      variant: 'green',
    },
    {
      title: 'Inactive Products',
      value: stats.inactive.toString(),
      variant: 'gray',
    },
  ];
  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6">
      {statList.map((stat, index) => (
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
