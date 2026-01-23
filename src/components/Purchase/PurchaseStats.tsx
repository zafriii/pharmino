import StatsCard from '@/components/shared ui/StatsCard';
import { formatCurrency } from '@/lib/utils';
import { PurchaseOrder } from '@/types/purchase.types';


interface PurchaseStatsProps {
  stats: {
    totalOrders: number;
    totalAmount: number;
    listedOrders: number;
    totalItems: number;
  };
}


export default function PurchaseStats({ stats }: PurchaseStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Total Orders"
        value={stats.totalOrders.toString()}
        description="Purchase orders"
        variant="blue"
      />
      <StatsCard
        title="Total Amount"
        value={stats.totalAmount.toFixed(2)}
        description="Total purchase value"
        variant="green"
      />
      <StatsCard
        title="Listed Orders"
        value={stats.listedOrders.toString()}
        description="Pending orders"
        variant="yellow"
      />
      <StatsCard
        title="Total Items"
        value={stats.totalItems.toString()}
        description="Items in orders"
        variant="purple"
      />
    </div>
  );
}