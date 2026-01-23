"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { TrendingUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlySalesData {
  month: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface MonthlySalesChartProps {
  data: MonthlySalesData[];
}

export default function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Sales',
        data: data.map(item => item.sales),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#3B82F6',
        pointRadius: 4,
        pointHoverRadius: 6,
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
              `Sales: ${item.sales.toLocaleString()}`,
              `Revenue: ${item.revenue.toLocaleString()}`,
              `Orders: ${item.orders}`
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

  // Calculate growth trends
  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  
  const salesGrowth = previousMonth 
    ? ((currentMonth?.sales - previousMonth.sales) / previousMonth.sales) * 100 
    : 0;

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Monthly Sales Trend</h2>
        </div>
        
        {salesGrowth !== 0 && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            salesGrowth >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {data.length > 0 ? (
        <>
          <div className="h-80 mb-6">
            <Line data={chartData} options={options} />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{totalOrders.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>            
          </div>

          {/* Monthly breakdown */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Performance</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {data.slice().reverse().map((month, index) => (
                <div key={month.month} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{month.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-blue-600 font-medium">{month.sales.toLocaleString()}</span>
                    <span className="text-gray-500">{month.orders} orders</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No sales data available</p>
          </div>
        </div>
      )}
    </div>
  );
}