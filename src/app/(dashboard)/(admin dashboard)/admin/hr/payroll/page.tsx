import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";
import FetchPayroll from "@/components/HR Management/Payroll/FetchPayroll";
import PayrollWrapper from "@/components/HR Management/Payroll/PayrollWrapper";
import HRTabs from "@/components/HR Management/HRTabs";

interface PayrollPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    month?: string;
  }>;
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Human Resource Management">
      <HRTabs />

      {/* Search and Filters */}
      <PayrollWrapper />

      {/* Payroll List with Suspense */}      
        <FetchPayroll searchParams={resolvedParams} />
    </PageContainer>
  );
}


