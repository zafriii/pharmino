import React, { Suspense } from 'react';
import PageContainer from '@/components/shared ui/PageContainer';
import FetchDamages from '@/components/Admin/Damage Record/FetchDamages';
import Load from '@/components/Load';

interface DamageRecordsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function DamageRecordsPage({ searchParams }: DamageRecordsPageProps) {

  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Damage Records">      
      <div className="space-y-6">                
        <FetchDamages searchParams={resolvedParams} />
      </div>
    </PageContainer>
  );
}
