import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import { Expense } from "@/types/expense.types";
import ExpenseAction from "./ExpenseAction";
import ExpensePagination from "./ExpensePagination";
import LocalDate from "@/components/shared ui/LocalDate";

interface ExpenseListProps {
  expenses: Expense[];
  totalPages: number;
  currentPage: number;
}

export default function ExpenseList({
  expenses,
  totalPages,
  currentPage,
}: ExpenseListProps) {
  const columns: TableColumn[] = [
    {
      key: "date",
      header: "Date",
      render: (row: Expense) => (
        <span className="font-medium">
          {new Date(row.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },

    {
      key: "reason",
      header: "Reason",
      render: (row: Expense) => (
        <span className="text-gray-900">{row.reason}</span>
      ),
    },

    {
      key: "amount",
      header: "Amount",
      render: (row: Expense) => (
        <span className="text-red-500">{row.amount.toLocaleString()}</span>
      ),
    },


    {
      key: "creator",
      header: "Created By",
      render: (row: Expense) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.creator.name}</span>
          <span className="text-xs text-gray-500">{row.creator.email}</span>
        </div>
      ),
    },

    {
      key: "createdAt",
      header: "Expenses Recorded",
      render: (row: Expense) => <LocalDate date={row.createdAt} />,
    },

    {
      key: "action",
      header: "Action",
      render: (row: Expense) => <ExpenseAction expense={row} />,
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={expenses} />

      <div className="mt-4 flex justify-end">
        <ExpensePagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
