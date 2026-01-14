import React, { Suspense } from 'react';
import PageContainer from "@/components/shared ui/PageContainer";
import Load from '@/components/Load';
import PurchaseTabs from '@/components/Admin/Purchase/PurchaseTabs';
import OrderedItemsWrapper from '@/components/Admin/Purchase/OrderedItems/OrderedItemsWrapper';
import FetchOrderedItems from '@/components/Admin/Purchase/OrderedItems/FetchOrderedItems';


interface OrderedItemsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function OrderedItemsPage({ searchParams }: OrderedItemsPageProps) {
  const resolvedParams = await searchParams;
  return (
    <PageContainer title="Ordered Items">
      <PurchaseTabs/>
      <div className="space-y-6">
        <OrderedItemsWrapper>         
        <FetchOrderedItems searchParams={resolvedParams} />
        </OrderedItemsWrapper>
      </div>
    </PageContainer>
  );
}