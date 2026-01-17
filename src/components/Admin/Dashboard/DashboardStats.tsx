"use client";

import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";

interface DashboardStatsProps {
  totalRevenue: number;
  netRevenue: number;
  grossProfit: number;
  profitMargin: number;
  totalOrders: number;
  avgOrderValue: number;
  totalExpenses: number;
  totalRefunds: number;
  revenueChange: number;
  netRevenueChange: number;
  grossProfitChange: number;
  ordersChange: number;
  avgOrderChange: number;
  expensesChange: number;
  refundsChange: number;
}

export default function DashboardStats({
  totalRevenue,
  netRevenue,
  grossProfit,
  profitMargin,
  totalOrders,
  avgOrderValue,
  totalExpenses,
  totalRefunds,
  revenueChange,
  netRevenueChange,
  grossProfitChange,
  ordersChange,
  avgOrderChange,
  expensesChange,
  refundsChange,
}: DashboardStatsProps) {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Revenue"
        value={totalRevenue.toLocaleString()}
        description={revenueChange !== 0 ? formatChange(revenueChange) : undefined}
        variant="green"
      />
      
      <StatsCard
        title="Net Revenue"
        value={netRevenue.toLocaleString()}
        description={netRevenueChange !== 0 ? formatChange(netRevenueChange) : undefined}
        variant="blue"
      />
      
      <StatsCard
        title="Gross Profit"
        value={grossProfit.toLocaleString()}
        description={grossProfitChange !== 0 ? formatChange(grossProfitChange) : undefined}
        variant="green"
      />
      
      <StatsCard
        title="Profit Margin"
        value={`${profitMargin.toFixed(1)}%`}
        variant="purple"
      />
      
      <StatsCard
        title="Total Orders"
        value={totalOrders.toLocaleString()}
        description={ordersChange !== 0 ? formatChange(ordersChange) : undefined}
        variant="blue"
      />
      
      <StatsCard
        title="Avg Order Value"
        value={avgOrderValue.toLocaleString()}
        description={avgOrderChange !== 0 ? formatChange(avgOrderChange) : undefined}
        variant="purple"
      />
      
      <StatsCard
        title="Total Expenses"
        value={totalExpenses.toLocaleString()}
        description={expensesChange !== 0 ? formatChange(expensesChange) : undefined}
        variant="yellow"
      />
      
      <StatsCard
        title="Total Refunds"
        value={totalRefunds.toLocaleString()}
        description={refundsChange !== 0 ? formatChange(refundsChange) : undefined}
        variant="red"
      />
    </div>
  );
}