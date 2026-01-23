import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Sale } from "@/types/sale.types";


interface SaleStatsProps {
  stats: {
    total: number;
    completed: number;
    returned: number;
    totalDiscount: number;
  };
}


const SaleStats: React.FC<SaleStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 mt-6">
      <StatsCard
        title="Total Sales"
        value={stats.total.toString()}
        variant="blue"
      />
      <StatsCard
        title="Completed"
        value={stats.completed.toString()}
        variant="green"
      />
      <StatsCard
        title="Returned"
        value={stats.returned.toString()}
        variant="red"
      />
      <StatsCard
        title="Total Discount"
        value={`${Number(stats.totalDiscount).toFixed(2)}`}
        variant="yellow"
      />
    </div>
  );
};

export default SaleStats;