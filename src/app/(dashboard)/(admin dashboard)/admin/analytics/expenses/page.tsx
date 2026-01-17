import React, { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import AnalyticsTabs from "@/components/Admin/Analytics/AnalyticsTabs";
import ExpenseWrapper from "@/components/Admin/Analytics/Expense/ExpenseWrapper";
import FetchExpense from "@/components/Admin/Analytics/Expense/FetchExpense";
import ExpenseGraph from "@/components/Admin/Analytics/Expense/ExpenseGraph";
import Load from "@/components/Load";
import { fetchExpensesForGraph } from "@/actions/analytics.actions";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    period?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const period = resolvedParams.period || "month";
  const expensesForGraph = await fetchExpensesForGraph(period);

  return (
    <PageContainer title="Expense Management">
      <AnalyticsTabs />

      <ExpenseWrapper />
      
        <FetchExpense searchParams={resolvedParams} />
    
      <div className="mt-8">
        <ExpenseGraph expenses={expensesForGraph} period={period} />
      </div>
    </PageContainer>
  );
}
