import StatsCard from "@/components/shared ui/StatsCard";
import type { ProfitLossData } from "@/types/expense.types";

interface ProfitLossOverviewProps {
  data: ProfitLossData;
}

export default function ProfitLossOverview({ data }: ProfitLossOverviewProps) {
  const { current, previous, changes } = data;

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}`;
  };

  const formatChange = (change: string, prevValue: number) => {
    const num = parseFloat(change);
    const sign = num >= 0 ? "+" : "";
    return `${sign}${change}% vs prev: ${(prevValue)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Revenue Card */}
      <StatsCard
        title="Total Revenue"
        value={formatCurrency(current.revenue)}
        variant="green"
        description={
          changes && previous
            ? formatChange(changes.revenue, previous.revenue)
            : undefined
        }
      />

      {/* Total Expenses Card */}
      <StatsCard
        title="Total Expenses"
        value={formatCurrency(current.expenses.total)}
        variant="red"
        description={
          changes && previous
            ? formatChange(changes.expenses, previous.expenses.total)
            : undefined
        }
      />

      {/* Net Profit Card */}
      <StatsCard
        title="Net Profit"
        value={formatCurrency(current.profit)}
        variant={current.profit >= 0 ? "green" : "red"}
        description={
          changes && previous
            ? formatChange(changes.profit, previous.profit)
            : undefined
        }
      />

      {/* Profit Margin Card */}
      <StatsCard
        title="Profit Margin"
        value={`${current.profitMargin}%`}
        variant={parseFloat(current.profitMargin) >= 0 ? "green" : "red"}
        description={
          previous
            ? `Previous: ${previous.profitMargin}%`
            : undefined
        }
      />
    </div>
  );
}