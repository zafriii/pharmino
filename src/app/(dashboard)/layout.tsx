import DashboardWrapper from '@/components/layout/DashboardWrapper';
import React from 'react';

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardWrapper>
      {children}
    </DashboardWrapper>
  );
}