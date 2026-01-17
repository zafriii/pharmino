"use client";

import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";

interface FinancialSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

export default function FinancialSummary({
  totalRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
  revenueChange,
  expensesChange,
  profitChange,
}: FinancialSummaryProps) {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Financial Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1">
              {React.createElement(getChangeIcon(revenueChange), {
                className: `w-4 h-4 ${getChangeColor(revenueChange)}`,
              })}
              <span className={`text-sm font-medium ${getChangeColor(revenueChange)}`}>
                {formatChange(revenueChange)}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-1">
              {React.createElement(getChangeIcon(expensesChange), {
                className: `w-4 h-4 ${getChangeColor(-expensesChange)}`, // Negative because lower expenses are better
              })}
              <span className={`text-sm font-medium ${getChangeColor(-expensesChange)}`}>
                {formatChange(expensesChange)}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {totalExpenses.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total Expenses</p>
        </div>

        {/* Net Profit */}
        <div className={`bg-gradient-to-br ${
          netProfit >= 0 
            ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
            : 'from-red-50 to-red-100 border-red-200'
        } rounded-lg p-4 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 ${
              netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'
            } rounded-lg flex items-center justify-center`}>
              {React.createElement(netProfit >= 0 ? TrendingUp : TrendingDown, {
                className: "w-5 h-5 text-white",
              })}
            </div>
            <div className="flex items-center gap-1">
              {React.createElement(getChangeIcon(profitChange), {
                className: `w-4 h-4 ${getChangeColor(profitChange)}`,
              })}
              <span className={`text-sm font-medium ${getChangeColor(profitChange)}`}>
                {formatChange(profitChange)}
              </span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {netProfit.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Net Profit</p>
        </div>

        {/* Profit Margin */}
        <div className={`bg-gradient-to-br ${
          profitMargin >= 0 
            ? 'from-blue-50 to-blue-100 border-blue-200' 
            : 'from-orange-50 to-orange-100 border-orange-200'
        } rounded-lg p-4 border`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`w-10 h-10 ${
              profitMargin >= 0 ? 'bg-blue-500' : 'bg-orange-500'
            } rounded-lg flex items-center justify-center`}>
              <Calculator className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {profitMargin.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Profit Margin</p>
        </div>
      </div>
    </div>
  );
}