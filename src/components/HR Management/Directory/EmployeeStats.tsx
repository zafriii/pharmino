import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Employee } from "@/types/employees.types";


interface EmployeeStatsProps {
  stats: {
    total: number;
    active: number;
    onLeave: number;
    inactive: number;
  };
}


const EmployeeStats: React.FC<EmployeeStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <StatsCard
        title="Total Employees"
        value={stats.total.toString()}
        variant="blue"
      />
      <StatsCard
        title="Active"
        value={stats.active.toString()}
        variant="green"
      />
      <StatsCard
        title="On Leave"
        value={stats.onLeave.toString()}
        variant="yellow"
      />
      <StatsCard
        title="Inactive"
        value={stats.inactive.toString()}
        variant="red"
      />
    </div>
  );
};

export default EmployeeStats;
