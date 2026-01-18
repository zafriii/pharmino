import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/cookie-utils";
import ExpenseGraphCharts from "./ExpenseGraphCharts";

interface ExpenseBreakdownData {
  payroll: number;
  products: number;
  other: number;
  total: number;
}

interface ExpenseChartData {
  date: string;
  payroll: number;
  products: number;
  other: number;
  total: number;
}

interface ExpenseGraphProps {
  period: string;
}

// Fetch comprehensive expense data from the dedicated expense analytics API
async function fetchExpenseData(period: string): Promise<{
  expenseBreakdown: ExpenseBreakdownData;
  chartData: ExpenseChartData[];
}> {
  try {
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      return {
        expenseBreakdown: { payroll: 0, products: 0, other: 0, total: 0 },
        chartData: []
      };
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Initial fetch from server (UTC default as no timezone offset is passed)
    const response = await fetch(`${baseUrl}/api/admin/analytics/expenses?period=${period}`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      next: {
        revalidate: 0,
        tags: ['expense-analytics'],
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch expense data:', response.status);
      return {
        expenseBreakdown: { payroll: 0, products: 0, other: 0, total: 0 },
        chartData: []
      };
    }

    const data = await response.json();

    return {
      expenseBreakdown: {
        payroll: data.totals?.payroll || 0,
        products: data.totals?.products || 0,
        other: data.totals?.other || 0,
        total: data.totals?.total || 0,
      },
      chartData: data.chartData || []
    };
  } catch (error) {
    console.error("Failed to fetch expense data:", error);
    return {
      expenseBreakdown: { payroll: 0, products: 0, other: 0, total: 0 },
      chartData: []
    };
  }
}

export default async function ExpenseGraph({ period }: ExpenseGraphProps) {
  const { expenseBreakdown, chartData } = await fetchExpenseData(period);

  return (
    <ExpenseGraphCharts
      expenseBreakdown={expenseBreakdown}
      chartData={chartData}
      period={period}
    />
  );
}
