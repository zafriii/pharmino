import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";
import InventoryWrapper from "@/components/Admin/Inventory/InventoryWrapper";
import FetchInventory from "@/components/Admin/Inventory/FetchInventory";

interface InventoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    stockStatus?: string;
    itemStatus?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Inventory Management">
      {/* Filters / Search UI */}
      <InventoryWrapper />

      {/* Inventory List */}
      <Suspense fallback={<Load message="Loading inventory" />}>
        <FetchInventory searchParams={resolvedParams} />
      </Suspense>
    </PageContainer>
  );
}
