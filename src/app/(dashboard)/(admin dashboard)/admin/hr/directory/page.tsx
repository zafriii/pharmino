import React, { Suspense } from "react";
import FetchEmployees from "@/components/Admin/HR Management/Directory/FetchEmployees";
import EmployeeWrapper from "@/components/Admin/HR Management/Directory/EmployeeWrapper";
import PageContainer from "@/components/shared ui/PageContainer";
import HRTabs from "@/components/Admin/HR Management/HRTabs";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    role?: string;
    dutyType?: string;
    shift?: string;
  }>;
}


export default async function EmployeesPage({ searchParams }: PageProps) {

  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Human Resource Management">
      <HRTabs />

      {/* Search + Create + Filters */}
      <EmployeeWrapper />

      {/* Employee List with Suspense */}      
      <FetchEmployees searchParams={resolvedParams} />      
    </PageContainer>
  );
}
