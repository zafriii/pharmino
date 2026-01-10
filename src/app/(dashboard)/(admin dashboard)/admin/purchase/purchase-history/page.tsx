import React from 'react';
import Link from 'next/link';
import PageContainer from "@/components/shared ui/PageContainer";

interface PurchaseHistoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    tab?: string;
  }>;
}

export default async function PurchaseHistoryPage({ searchParams }: PurchaseHistoryPageProps) {
  const resolvedParams = await searchParams;
  return (
    <PageContainer title="Purchase History">
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Purchase History
          </h2>
          <p className="text-gray-500 mb-6">
            View your ordered and received items using the links below.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/admin/purchase/ordered-items"
              className="px-6 py-3 bg-[#4a90e2] text-white rounded-lg "
            >
              View Ordered Items
            </Link>
            <Link 
              href="/admin/purchase/received-items"
              className="px-6 py-3 bg-[#4a90e2] text-white rounded-lg"
            >
              View Received Items
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}