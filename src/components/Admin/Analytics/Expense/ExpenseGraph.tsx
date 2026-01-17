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
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Expense } from "@/types/expense.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'today':
        // Today: from 00:00:00 to 23:59:59 of current local date
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'week':
        // This week: from Monday 00:00:00 to Sunday 23:59:59 (local time)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // This month: from 1st 00:00:00 to last day 23:59:59 (local time)
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        // This year: from Jan 1st 00:00:00 to Dec 31st 23:59:59 (local time)
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        // Default to month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const groupExpensesByDate = () => {
    const grouped: { [key: string]: number } = {};
    
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const dateKey = expenseDate.toISOString().split('T')[0];
        grouped[dateKey] = (grouped[dateKey] || 0) + Number(expense.amount);
      }
    });

    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dates.push(dateKey);
      if (!grouped[dateKey]) {
        grouped[dateKey] = 0;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dates, amounts: dates.map(date => grouped[date]) };
  };

  const { dates, amounts } = groupExpensesByDate();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === 'today') {
      return date.toLocaleDateString("en-US", { hour: '2-digit' });
    } else if (period === 'week') {
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    } else if (period === 'month') {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (period === 'year') {
      return date.toLocaleDateString("en-US", { month: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            return `Amount: ${context.parsed.y.toLocaleString()}`;
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

  const chartDataConfig = {
    labels: dates.map((date) => formatDate(date)),
    datasets: [
      {
        label: "Expenses",
        data: amounts,
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0.01)');
          return gradient;
        },
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(239, 68, 68)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        tension: 0.4,
      },
    ],
  };

  const totalExpenses = amounts.reduce((sum, amount) => sum + amount, 0);
  const daysWithExpenses = amounts.filter(amount => amount > 0).length;
  const avgExpense = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;
  const maxExpense = amounts.length > 0 ? Math.max(...amounts) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
          <p className="text-xs font-medium text-red-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <p className="text-xs font-medium text-orange-600 mb-1">{getAverageLabel(period)}</p>
          <p className="text-2xl font-bold text-orange-700">{Math.round(avgExpense).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <p className="text-xs font-medium text-amber-600 mb-1">Peak Expense</p>
          <p className="text-2xl font-bold text-amber-700">{maxExpense.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="h-96">
        <Line data={chartDataConfig} options={chartOptions} />
      </div>
    </div>
  );
}
