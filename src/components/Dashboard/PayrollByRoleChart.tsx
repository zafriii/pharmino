"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Users } from "lucide-react";
import type { PayrollByRoleChartProps } from "@/types/dashboard.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PayrollByRoleChart({ data }: PayrollByRoleChartProps) {
  const chartData = {
    labels: data.map(item => item.role),
    datasets: [
      {
        label: 'Total Paid',
        data: data.map(item => item.totalPaid),
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const item = data[dataIndex];
            return [
              `Total Paid: ${item.totalPaid.toLocaleString()}`,
              `Employees: ${item.employeeCount}`,
              `Avg Salary: ${item.averageSalary.toLocaleString()}`
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Payroll by Role</h2>
      </div>

      {data.length > 0 ? (
        <>
          <div className="h-64 mb-6">
            <Bar data={chartData} options={options} />
          </div>

          {/* Payroll breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Role Breakdown</h3>
            <div className="space-y-3">
              {data.map((role, index) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{role.role}</p>
                      <p className="text-xs text-gray-500">{role.employeeCount} employees</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {role.totalPaid.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Avg: {role.averageSalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payroll data available</p>
          </div>
        </div>
      )}
    </div>
  );
}