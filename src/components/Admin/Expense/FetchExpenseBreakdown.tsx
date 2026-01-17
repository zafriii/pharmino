import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/cookie-utils";
import ExpenseStats from "./ExpenseStats";
import type { Expense } from "@/types/expense.types";

interface ExpenseBreakdownData {
  payroll: number;
  products: number;
  other: number;
}

interface FetchExpenseBreakdownProps {
  expenses: Expense[];
  period: string;
}

async function fetchExpenseBreakdown(period: string = 'month'): Promise<ExpenseBreakdownData> {
  try {
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      return { payroll: 0, products: 0, other: 0 };
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/analytics/profit-loss?period=${period}`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return { payroll: 0, products: 0, other: 0 };
    }

    const data = await response.json();
    
    return {
      payroll: data.current?.expenses?.payroll || 0,
      products: data.current?.expenses?.products || 0,
      other: data.current?.expenses?.other || 0,
    };
  } catch (error) {
    console.error("Fetch Expense Breakdown Error:", error);
    return { payroll: 0, products: 0, other: 0 };
  }
}

export default async function FetchExpenseBreakdown({ expenses, period }: FetchExpenseBreakdownProps) {
  const breakdown = await fetchExpenseBreakdown(period);
  
  return <ExpenseStats expenses={expenses} breakdown={breakdown} />;
}