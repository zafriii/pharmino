export interface Expense {
  id: number;
  reason: string;
  amount: number;
  date: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ExpenseFormData {
  reason: string;
  amount: number;
  date: string;
}

export interface ProfitLossData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  current: {
    revenue: number;
    expenses: {
      payroll: number;
      products: number;
      other: number;
      total: number;
    };
    profit: number;
    profitMargin: string;
  };
  previous?: {
    revenue: number;
    expenses: {
      payroll: number;
      products: number;
      other: number;
      total: number;
    };
    profit: number;
    profitMargin: string;
  };
  changes?: {
    revenue: string;
    expenses: string;
    profit: string;
  };
  expenseBreakdown: Array<{
    reason: string;
    amount: number;
    date: string;
  }>;
  chartData: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
}