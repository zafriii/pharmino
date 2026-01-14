import React, { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import FetchPayments from "@/components/Admin/Payments/FetchPayments";
import PaymentWrapper from "@/components/Admin/Payments/PaymentWrapper";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise< {
    page?: string;
    search?: string;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }>;
}


export default async function PaymentsPage({ searchParams }: PageProps) {

  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Payment Management">
      {/* Search + Filters */}
      <PaymentWrapper />

      {/* Payments List with Suspense */}      
    <FetchPayments searchParams={resolvedParams} />      
    </PageContainer>
  );
};
