import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Sale } from "@/types/sale.types";

interface SaleStatsProps {
  sales: Sale[];
}

const SaleStats: React.FC<SaleStatsProps> = ({ sales = [] }) => {
  const total = sales.length;
  const completed = sales.filter((s) => s.status === "COMPLETED").length;
  const returned = sales.filter((s) => s.status === "RETURNED").length;
  const totalDiscount = sales.reduce((sum, sale) => sum + (Number(sale.discountAmount) || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
      <StatsCard
        title="Total Sales"
        value={total.toString()}
        variant="blue"
      />

      <StatsCard
        title="Completed"
        value={completed.toString()}
        variant="green"
      />

      <StatsCard
        title="Returned"
        value={returned.toString()}
        variant="red"
      />


      <StatsCard
        title="Total Discount"
        value={`$${Number(totalDiscount).toFixed(2)}`}
        variant="yellow"
      />
    </div>
  );
};

export default SaleStats;