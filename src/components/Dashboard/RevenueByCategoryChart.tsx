"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Package } from "lucide-react";
import type { RevenueByCategoryChartProps } from "@/types/dashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#10B981", // emerald-500
  "#3B82F6", // blue-500
  "#8B5CF6", // violet-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
  "#F97316", // orange-500
  "#EC4899", // pink-500
  "#6366F1", // indigo-500
];

export default function RevenueByCategoryChart({ data }: RevenueByCategoryChartProps) {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: COLORS.slice(0, data.length),
        borderColor: COLORS.slice(0, data.length),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = data[context.dataIndex]?.percentage || 0;
            return `${label}: ${value.toLocaleString()} (${percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Revenue by Category</h2>
      </div>

      {data.length > 0 ? (
        <div className="h-80">
          <Doughnut data={chartData} options={options} />
        </div>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No category data available</p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {data.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Category Breakdown</h3>
          {data.slice(0, 5).map((category, index) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {category.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}