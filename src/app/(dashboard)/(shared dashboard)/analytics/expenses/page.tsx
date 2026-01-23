import PageContainer from "@/components/shared ui/PageContainer";
import ExpenseWrapper from "@/components/Expense/ExpenseWrapper";
import FetchExpense from "@/components/Expense/FetchExpense";
import ExpenseGraph from "@/components/Expense/ExpenseGraph";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    listFilter?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const period = resolvedParams.period || "month";

  return (
    <PageContainer title="Expense Management">
      <ExpenseWrapper />

      <div className="mt-8">
        <ExpenseGraph
          period={period}
          startDate={resolvedParams.startDate}
          endDate={resolvedParams.endDate}
        />
      </div>

      <FetchExpense searchParams={resolvedParams} />
    </PageContainer>
  );
}
