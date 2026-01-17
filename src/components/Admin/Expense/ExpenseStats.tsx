import StatsCard from "@/components/shared ui/StatsCard";
import type { Expense } from "@/types/expense.types";

interface ExpenseStatsProps {
  expenses: Expense[];
}

const ExpenseStats = ({ expenses = [] }: ExpenseStatsProps) => {
  const total = expenses.length;
  
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  // Fix today's date filtering to match API logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  const todayExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    // Normalize expense date to compare date only
    const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
    const todayDateOnly = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate());
    
    return expenseDateOnly.getTime() === todayDateOnly.getTime();
  });
  const todayAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Fix month filtering to match API logic
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const monthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
    const monthStartOnly = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate());
    const monthEndOnly = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
    
    return expenseDateOnly >= monthStartOnly && expenseDateOnly <= monthEndOnly;
  });
  const monthAmount = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Expense Statistics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">
          Other expenses
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Expenses"
            value={total.toString()}
            variant="blue"
          />

          <StatsCard
            title="Total Amount"
            value={`${totalAmount.toLocaleString()}`}
            variant="green"
          />

          <StatsCard
            title="This Month"
            value={`${monthAmount.toLocaleString()}`}
            variant="yellow"
          />

          <StatsCard
            title="Today"
            value={`${todayAmount.toLocaleString()}`}
            variant="red"
          />
        </div>
      </div>
    </div>
  );
};

export default ExpenseStats;
