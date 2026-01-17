import PageContainer from "@/components/shared ui/PageContainer";
import ExpenseWrapper from "@/components/Admin/Expense/ExpenseWrapper";
import FetchExpense from "@/components/Admin/Expense/FetchExpense";
import ExpenseGraph from "@/components/Admin/Expense/ExpenseGraph";

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

  return (
    <PageContainer title="Expense Management">
      <ExpenseWrapper />
          
      <div className="mt-8">
        <ExpenseGraph period={period} />
      </div>

      <FetchExpense searchParams={resolvedParams} />
    </PageContainer>
  );
}
