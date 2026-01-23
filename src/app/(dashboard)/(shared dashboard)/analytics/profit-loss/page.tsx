import React, { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import ProfitLossAnalytics from "@/components/Analytics/Profit-loss/ProfitLossAnalytics";
import ProfitLossWrapper from "@/components/Analytics/Profit-loss/ProfitLossWrapper";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    compare?: string;
  }>;
}

export default async function ProfitLossPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Profit & Loss Analysis">
      {/* <AnalyticsTabs /> */}

      <ProfitLossWrapper />
      
      <ProfitLossAnalytics searchParams={resolvedParams} />

    </PageContainer>
  );
}
