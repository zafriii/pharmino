import React, { Suspense } from 'react';
import PageContainer from "@/components/shared ui/PageContainer";
import PurchaseWrapper from '@/components/Purchase/Purchase List/PurchaseWrapper';
import FetchPurchases from '@/components/Purchase/Purchase List/FetchPurchases';
import { fetchCategories } from '@/components/Product Management/Category/FetchCategories';
import Load from '@/components/Load';


interface PurchasePageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function PurchasePage({ searchParams }: PurchasePageProps) {
  const resolvedParams = await searchParams;
  // Fetch categories for the form
  const categories = await fetchCategories();

  return (
    <PageContainer title="Purchase Management">
      {/* <PurchaseTabs/> */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>        
            {categories.length === 0 && (
              <p className="text-red-600 text-sm mt-1">
                No categories found. Please create categories first.
              </p>
            )}
          </div>
        </div>

        {/* Purchase Controls */}
        <PurchaseWrapper />

        {/* Purchase List */}        
          <FetchPurchases searchParams={resolvedParams} />
      </div>
    </PageContainer>
  );
}

 