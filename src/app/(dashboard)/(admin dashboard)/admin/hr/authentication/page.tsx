import React, { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import HRTabs from "@/components/HR Management/HRTabs";
import FetchUsers from "@/components/HR Management/Authentication/FetchUsers";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AuthenticationPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Human Resource Management">
      <HRTabs />

      {/* Suspense Wrapper – Same as Directory code */}     
    <FetchUsers searchParams={resolvedParams} />    
    </PageContainer>
  );
}
