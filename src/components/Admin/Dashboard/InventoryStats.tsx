import StatsCard from "@/components/shared ui/StatsCard";
import type { InventoryStatsProps } from "@/types/dashboard.types";

export default function InventoryStats({
  expiringCount,
  lowStockCount,
  outOfStockCount,
  totalProducts
}: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Expiring Soon"
        value={expiringCount.toString()}
        description="Within 2 days"
        variant="red"
      />
      
      <StatsCard
        title="Low Stock"
        value={lowStockCount.toString()}
        description="Below threshold"
        variant="yellow"
      />
      
      <StatsCard
        title="Out of Stock"
        value={outOfStockCount.toString()}
        description="Zero inventory"
        variant="red"
      />
      
      <StatsCard
        title="Total Products"
        value={totalProducts.toString()}
        description="Active products"
        variant="blue"
      />
    </div>
  );
}