import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import { HiOutlineSun } from "react-icons/hi2";
import { BiMoon } from "react-icons/bi";
import AttendanceAction from "./AttendanceAction";
import { EmployeeWithAttendance } from "@/types/attendance.types";
import Image from "next/image";
import EmployeePagination from "../Directory/EmployeePagination";

interface AttendanceListProps {
  employees: EmployeeWithAttendance[];
  totalPages: number;
  currentPage: number;
  selectedDate: string;
}

export default function AttendanceList({
  employees,
  totalPages,
  currentPage,
  selectedDate,
}: AttendanceListProps) {
  const columns: TableColumn[] = [
    {
      key: "name",
      header: "Employee",
      render: (row: EmployeeWithAttendance) => (
        <div className="flex items-center gap-3">         
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },

    { key: "phone", header: "Phone" },

    {
      key: "role",
      header: "Role",
      render: (row: EmployeeWithAttendance) => <Badge variant="white">{row.role}</Badge>,
    },

    { key: "email", header: "Email" },

    {
      key: "dutyType",
      header: "Duty",
      render: (row: EmployeeWithAttendance) => (
        <span className="text-sm">{row.dutyType}</span>
      ),
    },

    {
      key: "shift",
      header: "Shift",
      render: (row: EmployeeWithAttendance) => (
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
      key: "action",
      header: "Action",
      render: (row: EmployeeWithAttendance) => (
        <AttendanceAction 
          employee={row} 
          selectedDate={selectedDate}
        />
      ),
    },
  ];

  return (

    //Show all employee details in with attendance in attendance page

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