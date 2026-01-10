import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  variant?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'gray';
  className?: string;
}

const valueStyles = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export default function StatsCard({ 
  title, 
  value, 
  description, 
  variant = 'gray',
  className 
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        'border border-gray-200 bg-white',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>

          <p
            className={cn(
              'text-2xl font-bold',
              valueStyles[variant]
            )}
          >
            {value}
          </p>

          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
