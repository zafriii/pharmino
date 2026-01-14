import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";
import BatchList from "@/components/Admin/Inventory/BatchList";
import BatchWrapper from "@/components/Admin/Inventory/BatchWrapper";

interface BatchesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function BatchesPage({ params, searchParams }: BatchesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  return (
    <PageContainer title="Batch Details">
      <div className="space-y-6">
        {/* Batch Filters */}
        <BatchWrapper />               
        <BatchList itemId={resolvedParams.id} searchParams={resolvedSearchParams} />          
      </div>
    </PageContainer>
  );
}