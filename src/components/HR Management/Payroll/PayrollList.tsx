import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import PayrollAction from "./PayrollAction";
import PayrollPagination from "./PayrollPagination";
import PayrollEditableField from "./PayrollEditableField";
import { Payroll} from "@/types/payroll.types";
import Image from "next/image";

interface PayrollListProps {
  payrolls: Payroll[];
  totalPages: number;
  currentPage: number;
}

export default function PayrollList({
  payrolls,
  totalPages,
  currentPage,
}: PayrollListProps) {
  const columns: TableColumn[] = [
    {
      key: "employee",
      header: "Employee",
      render: (row: Payroll) => (
        <div className="flex items-center gap-3">          
          <span className="font-medium">{row.user.name}</span>
        </div>
      ),
    },
    { 
      key: "role", 
      header: "Role", 
      render: (row: Payroll) => <Badge variant="white">{row.user.role}</Badge> 
    },
    { 
      key: "baseSalary", 
      header: "Base Salary", 
      render: (row: Payroll) => Number(row.baseSalary).toLocaleString() 
    },
    {
      key: "allowances",
      header: "Allowances",
      render: (row: Payroll) => (
        <PayrollEditableField
          payrollId={row.id}
          fieldName="allowances"
          currentValue={row.allowances}
        />
      ),
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (row: Payroll) => (
        <PayrollEditableField
          payrollId={row.id}
          fieldName="deductions"
          currentValue={row.deductions}
        />
      ),
    },
    { 
      key: "netPay", 
      header: "Net Pay", 
      render: (row: Payroll) => (
        <span className="text-green-600">
          {Number(row.netPay).toLocaleString()}
        </span>
      )
    },
    { 
      key: "paymentStatus", 
      header: "Status", 
      render: (row: Payroll) => (
        <Badge variant={row.paymentStatus === "PAID" ? "green" : "yellow"}>
          {row.paymentStatus}
        </Badge>
      ) 
    },
    {
      key: "action",
      header: "Action",
      render: (row: Payroll) => (
        <PayrollAction payroll={row} />
      ),
    },
  ];

  return (

    //Show all employee payroll info

    <div className="w-full">
      <ReusableTable columns={columns} data={payrolls} />
      
      <div className="flex justify-end mt-4">
        <PayrollPagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
        />
      </div>
    </div>
  );
}