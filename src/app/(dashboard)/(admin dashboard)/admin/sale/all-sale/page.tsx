import React, { Suspense } from "react";
import FetchSale from "@/components/Admin/Sale/All sales/FetchSale";
import SaleWrapper from "@/components/Admin/Sale/All sales/SaleWrapper";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AllSalesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="All Sales">
      {/* Search + Filters */}
      <SaleWrapper />

      {/* Sales List with Suspense */}     
    <FetchSale searchParams={resolvedParams} />
    </PageContainer>
  );
}