import StatsCard from "@/components/shared ui/StatsCard";
import { Receipt, DollarSign, CreditCard } from "lucide-react";
import type { Expense } from "@/types/expense.types";

interface ExpenseBreakdownData {
  payroll: number;
  products: number;
  other: number;
}

interface ExpenseStatsProps {
  expenses: Expense[];
  breakdown?: ExpenseBreakdownData;
}

const ExpenseStats = ({ expenses = [], breakdown }: ExpenseStatsProps) => {
  const total = expenses.length;
  
  const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  // Fix today's date filtering to match API logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
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

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Expense Breakdown */}
      {breakdown && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expense Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">
                    Payroll Expenses
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(breakdown.payroll)}
                  </p>
                </div>
                <div className="text-blue-600">
                  <Receipt className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Employee salaries & benefits
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">
                    Product Costs
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(breakdown.products)}
                  </p>
                </div>
                <div className="text-purple-600">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm text-purple-600 mt-2">
                Inventory & product purchases
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    Other Expenses
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(breakdown.other)}
                  </p>
                </div>
                <div className="text-orange-600">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
              <p className="text-sm text-orange-600 mt-2">
                Utilities, rent & miscellaneous
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extra Expenses */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Extra Expenses
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
