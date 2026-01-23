import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Payment } from "@/types/payment.types";


interface PaymentStatsProps {
  stats: {
    total: number;
    paid: number;
    refunded: number;
    partiallyRefunded: number;
    totalRevenue: number;
    totalRefunded: number;
    totalPartialRefunds: number;
  };
}


const PaymentStats: React.FC<PaymentStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mt-6">
      <StatsCard
        title="Total Payments"
        value={stats.total.toString()}
        variant="blue"
      />
      <StatsCard
        title="Paid"
        value={stats.paid.toString()}
        variant="green"
      />
      <StatsCard
        title="Partially Refunded"
        value={stats.partiallyRefunded.toString()}
        variant="yellow"
      />
      <StatsCard
        title="Refunded"
        value={stats.refunded.toString()}
        variant="red"
      />
      <StatsCard
        title="Total Revenue"
        value={`${Number(stats.totalRevenue).toFixed(2)}`}
        variant="green"
      />
      <StatsCard
        title="Total Refunded"
        value={`${Number(stats.totalRefunded).toFixed(2)}`}
        variant="red"
      />
      <StatsCard
        title="Partial Refunds"
        value={`${Number(stats.totalPartialRefunds).toFixed(2)}`}
        variant="yellow"
      />
    </div>
  );
};

export default PaymentStats;