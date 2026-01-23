import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import Load from "@/components/Load";
import InventoryWrapper from "@/components/Inventory/InventoryWrapper";
import FetchInventory from "@/components/Inventory/FetchInventory";

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
      <FetchInventory searchParams={resolvedParams} />
    </PageContainer>
  );
}
