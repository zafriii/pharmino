import React, { Suspense } from 'react';
import PageContainer from "@/components/shared ui/PageContainer";
import Load from '@/components/Load';
import PurchaseTabs from '@/components/Admin/Purchase/PurchaseTabs';
import ReceivedItemsWrapper from '@/components/Admin/Purchase/ReceivedItems/ReceivedItemsWrapper';
import FetchReceivedItems from '@/components/Admin/Purchase/ReceivedItems/FetchReceivedItems';
// import FetchReceivedItems from '@/components/Admin/Purchase/ReceivedItems/FetchReceivedItems';

interface ReceivedItemsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function ReceivedItemsPage({ searchParams }: ReceivedItemsPageProps) {
  const resolvedParams = await searchParams;
  return (
    <PageContainer title="Received Items">
      <PurchaseTabs/>
      <div className="space-y-6">
        <ReceivedItemsWrapper>        
         <FetchReceivedItems searchParams={resolvedParams} />
        </ReceivedItemsWrapper>
      </div>
    </PageContainer>
  );
}