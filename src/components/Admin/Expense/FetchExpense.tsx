import React from "react";
import { cookies } from "next/headers";
import ExpenseList from "./ExpenseList";
import EmptyState from "@/components/EmptyState";
import type { Expense } from "@/types/expense.types";
import FetchExpenseBreakdown from "./FetchExpenseBreakdown";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchExpenseProps {
  searchParams: {
    page?: string;
    search?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  };
}

async function fetchExpenses(
  params: FetchExpenseProps["searchParams"]
): Promise<{ expenses: Expense[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.period && { period: params.period }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  });

  try {
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        expenses: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/expenses?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      next: {
          revalidate: 60, // 5 minutes
          tags: ['expenses'],
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
      throw new Error(`Failed to fetch expenses: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      expenses: data.expenses || [],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Expenses Error:", error);
    return {
      expenses: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchExpense({ searchParams }: FetchExpenseProps) {
  const { expenses, totalPages, currentPage } = await fetchExpenses(searchParams);
  const period = searchParams.period || 'month';

  return (
    <>
      <FetchExpenseBreakdown expenses={expenses} period={period} />
      {expenses.length === 0 ? (
        <EmptyState message="No expenses found" />
      ) : (
        <ExpenseList
          expenses={expenses}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
}
