import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Employee } from "@/types/employees.types";

interface EmployeeStatsProps {
  employees: Employee[];
}

const EmployeeStats: React.FC<EmployeeStatsProps> = ({ employees = [] }) => {
  const total = employees.length;
  const active = employees.filter((e) => e.status === "ACTIVE").length;
  const onLeave = employees.filter((e) => e.status === "ON_LEAVE").length;
  const inactive = employees.filter((e) => e.status === "INACTIVE").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <StatsCard
        title="Total Employees"
        value={total.toString()}
        variant="blue"
      />

      <StatsCard
        title="Active"
        value={active.toString()}
        variant="green"
      />

      <StatsCard
        title="On Leave"
        value={onLeave.toString()}
        variant="yellow"
      />

      <StatsCard
        title="Inactive"
        value={inactive.toString()}
        variant="red"
      />
    </div>
  );
};

export default EmployeeStats;
