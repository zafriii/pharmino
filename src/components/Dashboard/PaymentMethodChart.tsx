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
import { CreditCard } from "lucide-react";
import type { PaymentMethodChartProps } from "@/types/dashboard.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const chartData = {
    labels: data.map(item => item.method),
    datasets: [
      {
        label: 'Amount',
        data: data.map(item => item.amount),
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
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
              `Amount: ${item.amount.toLocaleString()}`,
              `Transactions: ${item.count}`,
              `Share: ${item.percentage.toFixed(1)}%`
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
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Payment Method Analysis</h2>
      </div>

      {data.length > 0 ? (
        <>
          <div className="h-64 mb-6">
            <Bar data={chartData} options={options} />
          </div>

          {/* Payment method breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Payment Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.map((method, index) => (
                <div key={method.method} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        method.method === 'CASH' ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-700">
                        {method.method}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {method.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-gray-900">
                      {method.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {method.count} transactions
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
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payment data available</p>
          </div>
        </div>
      )}
    </div>
  );
}