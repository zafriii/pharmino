import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import { HiOutlineSun } from "react-icons/hi2";
import { BiMoon } from "react-icons/bi";
import EmployeeAction from "./EmployeeAction";
import EmployeePagination from "./EmployeePagination";
import { Employee } from "@/types/employees.types";
import Link from "next/link";


interface EmployeeListProps {
  employees: Employee[];
  totalPages: number;
  currentPage: number;
}

export default function EmployeeList({
  employees,
  totalPages,
  currentPage,
}: EmployeeListProps) {
  const columns: TableColumn[] = [
    {
      key: "name",
      header: "Employee",
      render: (row: Employee) => (
        <Link
          href={`/admin/hr/directory/employee/${row.id}`}
          className="flex items-center gap-3 group"
        >          
          <span className="font-medium group-hover:text-[#4a90e2] transition">
            {row.name}
          </span>
        </Link>
      ),
    },

    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },

    {
      key: "role",
      header: "Role",
      render: (row: Employee) => <Badge variant="white">{row.role}</Badge>,
    },

    {
      key: "status",
      header: "Status",
      render: (row: Employee) => (
        <Badge
          variant={
            row.status === "ACTIVE"
              ? "green"
              : row.status === "ON_LEAVE"
              ? "yellow"
              : "red"
          }
        >
          {row.status}
        </Badge>
      ),
    },

    { key: "dutyType", header: "Duty Type" },

    {
      key: "shift",
      header: "Shift",
      render: (row: Employee) => (
        <span className="flex items-center gap-1 text-xs font-medium">
          {row.shift === "DAY" ? (
            <HiOutlineSun className="w-4 h-4" />
          ) : (
            <BiMoon className="w-4 h-4" />
          )}
          {row.shift}
        </span>
      ),
    },

    {
      key: "joiningDate",
      header: "Joining Date",
      render: (row: Employee) =>
        new Date(row.joiningDate).toLocaleDateString("en-US"),
    },

    { key: "monthlySalary", header: "Salary" },

    {
      key: "action",
      header: "Action",
      render: (row: Employee) => <EmployeeAction employee={row} />,
    },
  ];

  return (

    //Show all employee details in directory page

    <div className="w-full">
      <ReusableTable columns={columns} data={employees} />

      <div className="mt-4 flex justify-end">
        <EmployeePagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

