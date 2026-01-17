"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import type { Expense } from "@/types/expense.types";
import { useEffect, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface ExpenseBreakdownData {
  payroll: number;
  products: number;
  other: number;
  total: number;
}

interface ExpenseGraphProps {
  expenses: Expense[];
  period: string;
}

// Helper functions
function getPeriodLabel(period: string) {
  switch (period) {
    case 'today':
      return 'Today';
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'year':
      return 'This Year';
    default:
      return 'This Month';
  }
}

function getAverageLabel(period: string) {
  switch (period) {
    case 'today':
      return 'Hourly Average';
    case 'week':
    case 'month':
      return 'Daily Average';
    case 'year':
      return 'Monthly Average';
    default:
      return 'Average';
  }
}

export default function ExpenseGraph({ expenses, period }: ExpenseGraphProps) {
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownData>({
    payroll: 0,
    products: 0,
    other: 0,
    total: 0,
  });
  const [chartData, setChartData] = useState<Array<{
    date: string;
    payroll: number;
    products: number;
    other: number;
    total: number;
  }>>([]);

  // Fetch comprehensive expense data from the new dedicated expense analytics API
  useEffect(() => {
    const fetchExpenseData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL;
        
        // Fetch from the new dedicated expense analytics endpoint
        const response = await fetch(`${baseUrl}/api/admin/analytics/expenses?period=${period}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          setExpenseBreakdown({
            payroll: data.totals?.payroll || 0,
            products: data.totals?.products || 0,
            other: data.totals?.other || 0,
            total: data.totals?.total || 0,
          });
          
          // Set detailed chart data with daily/monthly breakdown by category
          setChartData(data.chartData || []);
        }
      } catch (error) {
        console.error("Failed to fetch expense data:", error);
      }
    };

    fetchExpenseData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };

  // Process chart data to extract expense categories by date
  const processChartDataForExpenses = () => {
    if (!chartData || chartData.length === 0) {
      return {
        dates: [],
        payrollAmounts: [],
        productAmounts: [],
        otherAmounts: [],
        totalAmounts: []
      };
    }

    // Use the actual detailed data from the API
    const dates = chartData.map(item => item.date);
    const payrollAmounts = chartData.map(item => item.payroll || 0);
    const productAmounts = chartData.map(item => item.products || 0);
    const otherAmounts = chartData.map(item => item.other || 0);
    const totalAmounts = chartData.map(item => item.total || 0);

    return {
      dates,
      payrollAmounts,
      productAmounts,
      otherAmounts,
      totalAmounts
    };
  };

  const { dates, payrollAmounts, productAmounts, otherAmounts, totalAmounts } = processChartDataForExpenses();

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (period === 'today') {
      return date.toLocaleDateString("en-US", { hour: '2-digit' });
    } else if (period === 'week') {
      return date.toLocaleDateString("en-US", { weekday: "short" }) + " " + day;
    } else if (period === 'month') {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (period === 'year') {
      return date.toLocaleDateString("en-US", { month: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  // Stacked Bar Chart Configuration
  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: `Expense Breakdown by Category - ${getPeriodLabel(period)}`,
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y.toLocaleString();
            return `${label}: ${value}`;
          },
          afterBody: function (context: any) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;
              const total = totalAmounts[dataIndex];
              return [`Total: ${total.toLocaleString()}`];
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: function (value: any) {
            return `${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  const stackedBarData = {
    labels: dates.map((date) => formatDate(date)),
    datasets: [
      {
        label: "Payroll Expenses",
        data: payrollAmounts,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#3b82f6",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Product Costs",
        data: productAmounts,
        backgroundColor: "rgba(147, 51, 234, 0.8)",
        borderColor: "#9333ea",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Other Expenses",
        data: otherAmounts,
        backgroundColor: "rgba(249, 115, 22, 0.8)",
        borderColor: "#f97316",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Line Chart for Trends
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: `Expense Trends - ${getPeriodLabel(period)}`,
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y.toLocaleString();
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: function (value: any) {
            return `${value.toLocaleString()}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const lineChartData = {
    labels: dates.map((date) => formatDate(date)),
    datasets: [
      {
        label: "Payroll Expenses",
        data: payrollAmounts,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        fill: false,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
      {
        label: "Product Costs",
        data: productAmounts,
        borderColor: "#9333ea",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        borderWidth: 3,
        fill: false,
        pointBackgroundColor: "#9333ea",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
      {
        label: "Other Expenses",
        data: otherAmounts,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 3,
        fill: false,
        pointBackgroundColor: "#f97316",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
      {
        label: "Total Expenses",
        data: totalAmounts,
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        fill: true,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  };

  // Expense Distribution Pie Chart
  const expenseDistributionData = {
    labels: ['Payroll Expenses', 'Product Costs', 'Other Expenses'],
    datasets: [
      {
        data: [
          expenseBreakdown.payroll,
          expenseBreakdown.products,
          expenseBreakdown.other,
        ],
        backgroundColor: [
          '#3b82f6', // Blue for payroll
          '#9333ea', // Purple for products
          '#f97316', // Orange for other
        ],
        borderColor: [
          '#2563eb',
          '#7c3aed',
          '#ea580c',
        ],
        borderWidth: 2,
      },
    ],
  };

  const expenseDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 11,
          },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: "Expense Distribution",
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
        padding: {
          top: 10,
          bottom: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed.toLocaleString();
            const total = expenseBreakdown.total;
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate statistics
  const totalExpenses = totalAmounts.reduce((sum, amount) => sum + amount, 0);
  const daysWithExpenses = totalAmounts.filter(amount => amount > 0).length;
  const avgExpense = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;
  const maxExpense = totalAmounts.length > 0 ? Math.max(...totalAmounts) : 0;

  const totalPayroll = payrollAmounts.reduce((sum, amount) => sum + amount, 0);
  const totalProducts = productAmounts.reduce((sum, amount) => sum + amount, 0);
  const totalOther = otherAmounts.reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <p className="text-xs font-medium text-red-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 mb-1">Payroll</p>
          <p className="text-2xl font-bold text-blue-700">{totalPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 mb-1">Products</p>
          <p className="text-2xl font-bold text-purple-700">{totalProducts.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <p className="text-xs font-medium text-orange-600 mb-1">Other</p>
          <p className="text-2xl font-bold text-orange-700">{totalOther.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="h-80">
            <Doughnut data={expenseDistributionData} options={expenseDistributionOptions} />
          </div>
        </div>

        {/* Statistics and Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expense Statistics - {getPeriodLabel(period)}
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
                <p className="text-xs font-medium text-orange-600 mb-1">{getAverageLabel(period)}</p>
                <p className="text-xl font-bold text-orange-700">{Math.round(avgExpense).toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-600 mb-1">Peak Expense</p>
                <p className="text-xl font-bold text-amber-700">{maxExpense.toLocaleString()}</p>
              </div>
            </div>

            {/* Expense Breakdown from API */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Period Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-blue-700">Payroll Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-blue-800">{expenseBreakdown.payroll.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-purple-700">Product Costs</span>
                  </div>
                  <span className="text-sm font-bold text-purple-800">{expenseBreakdown.products.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-orange-700">Other Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-orange-800">{expenseBreakdown.other.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96">
          <Bar data={stackedBarData} options={stackedBarOptions} />
        </div>
      </div>

      {/* Line Chart for Trends */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-96">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>
    </div>
  );
}
