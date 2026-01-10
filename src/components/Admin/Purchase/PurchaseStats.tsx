import StatsCard from '@/components/shared ui/StatsCard';
import { formatCurrency } from '@/lib/utils';
import { PurchaseOrder } from '@/types/purchase.types';

interface PurchaseStatsProps {
  purchases: PurchaseOrder[];
}

export default function PurchaseStats({ purchases = [] }: PurchaseStatsProps) {
  const totalOrders = purchases.length;
  
  const totalAmount = purchases.reduce((sum, purchase) => {
    return sum + parseFloat(purchase.totalAmount.toString());
  }, 0);

  const statusCounts = purchases.reduce((acc, purchase) => {
    acc[purchase.status] = (acc[purchase.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItems = purchases.reduce((sum, purchase) => {
    return sum + (purchase.items?.length || 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="Total Orders"
        value={totalOrders.toString()}
        description="Purchase orders"
        variant="blue"
      />
      
      <StatsCard
        title="Total Amount"
        // value={formatCurrency(totalAmount)}
        value={totalAmount.toString()}
        description="Total purchase value"
        variant="green"
      />
      
      <StatsCard
        title="Listed Orders"
        value={(statusCounts.LISTED || 0).toString()}
        description="Pending orders"
        variant="yellow"
      />
      
      <StatsCard
        title="Total Items"
        value={totalItems.toString()}
        description="Items in orders"
        variant="purple"
      />
    </div>
  );
}