import React from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import ProductPanel from "@/components/Admin/Sale/Create Sale/ProductPanel";
import SalePanel from "@/components/Admin/Sale/Create Sale/SalePanel";
import { SaleProvider } from "@/contexts/SaleContext";

interface SaleBoxProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function SaleBox({ searchParams }: SaleBoxProps) {
  // Resolve the searchParams Promise at the server component level
  const resolvedParams = await searchParams;

  return (
    <SaleProvider>
    <div className="flex flex-col md:flex-row gap-4 h-full">
      
      {/* Products Panel */}
      <div className="flex-1">
        <PageContainer title="Products">
          <ProductPanel searchParams={resolvedParams} />
        </PageContainer>
      </div>

      {/* Sale Panel */}
      <div className="w-full md:w-96">
        <PageContainer title="Sale Panel">
          <SalePanel />
        </PageContainer>
      </div>

    </div>
  </SaleProvider>
  );
}
