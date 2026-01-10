// components/shared ui/Badge.tsx
'use client';

import React from 'react';

type BadgeVariant = 'white' | 'green' | 'yellow'| 'red' | 'blue';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'white' }) => {
  let baseClasses = "px-2 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full min-w-[80px]";

  let variantClasses = '';
  switch (variant) {
    case 'green':
      variantClasses = "bg-green-100 text-green-800";
      break;
    case 'yellow':
      variantClasses = "bg-yellow-100 text-yellow-800";
      break;
    case 'red':
      variantClasses = 'bg-[#FEF2F2] text-[#DC2626]';
      break;
    case 'blue':
      variantClasses = 'bg-[#DBEAFE] text-[#1D4ED8]';
      break;
    case 'white':
    default:
      variantClasses = "bg-[#F1F5F9] text-black";
      break;
  }

  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
};

export default Badge;
