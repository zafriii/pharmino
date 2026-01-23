import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
// import PaymentPagination from "./PaymentPagination";
import PaymentAction from "./PaymentAction";
import { Payment } from "@/types/payment.types";
import { HiOutlineCreditCard, HiOutlineBanknotes } from "react-icons/hi2";
import PaymentPagination from "./PaymentPagination";
import LocalDate from "@/components/shared ui/LocalDate";

interface AllPaymentsListProps {
  payments: Payment[];
  totalPages: number;
  currentPage: number;
}

export default function AllPaymentsList({
  payments,
  totalPages,
  currentPage,
}: AllPaymentsListProps) {
  const columns: TableColumn[] = [
    {
      key: "id",
      header: "Payment ID",
      render: (row: Payment) => (
        <span className="font-medium text-gray-900">
          #{row.id}
        </span>
      ),
    },

    {
      key: "saleId",
      header: "Sale ID",
      render: (row: Payment) => (
        <span className="font-medium text-blue-600">
          #{row.saleId}
        </span>
      ),
    },

    {
      key: "customer",
      header: "Customer",
      render: (row: Payment) => (
        <span className="text-gray-700">
          {row.sale?.customer?.name || "Walk-in Customer"}
        </span>
      ),
    },

    {
      key: "amount",
      header: "Amount",
      render: (row: Payment) => (
        <span className="font-semibold text-gray-900">
          {Number(row.amount || 0).toFixed(2)}
        </span>
      ),
    },

    {
      key: "method",
      header: "Payment Method",
      render: (row: Payment) => (
        <span className="flex items-center gap-1 text-xs font-medium">
          {row.method === "CASH" ? (
            <HiOutlineBanknotes className="w-4 h-4" />
          ) : (
            <HiOutlineCreditCard className="w-4 h-4" />
          )}
          {row.method}
        </span>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (row: Payment) => (
        <Badge
          variant={
            row.status === "PAID"
              ? "green"
              : row.status === "REFUNDED"
              ? "red"
              : "yellow"
          }
        >
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },

    {
      key: "refundedAmount",
      header: "Refunded",
      render: (row: Payment) => (
        <span className="text-gray-600">
          {Number(row.refundedAmount || 0) > 0 ? `${Number(row.refundedAmount || 0).toFixed(2)}` : "-"}
        </span>
      ),
    },

    {
      key: "refundMethod",
      header: "Refund Method",
      render: (row: Payment) => (
        <span className="text-gray-600">
          {row.refundMethod ? (
            <span className="flex items-center gap-1 text-xs">
              {row.refundMethod === "CASH" ? (
                <HiOutlineBanknotes className="w-3 h-3" />
              ) : (
                <HiOutlineCreditCard className="w-3 h-3" />
              )}
              {row.refundMethod}
            </span>
          ) : "-"}
        </span>
      ),
    },
    
    {
      key: "createdAt",
      header: "Payment date",
      render: (row: Payment) => <LocalDate date={row.createdAt} />,
    },

    {
      key: "refundedAt",
      header: "Refund Date",
      render: (row: Payment) => (
        <span className="text-gray-600">
          {row.refundedAt ? new Date(row.refundedAt).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : "-"}
        </span>
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (row: Payment) => <PaymentAction payment={row} />,
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={payments} />

      <div className="mt-4 flex justify-end">
        <PaymentPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}