"use client";

import React, { useState } from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Load from "@/components/Load";
import Button from "@/components/shared ui/Button";
import { 
  FiPackage, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiPauseCircle, 
  FiXCircle, 
  FiClock,
} from "react-icons/fi";
import { IoIosStats } from "react-icons/io";

interface BatchStatsProps {
  summary: {
    totalStock: number;
    totalDamageQuantity: number;
    activeBatchesCount: number;
    inactiveBatchesCount: number;
    soldOutBatchesCount: number;
    expiredBatchesCount: number;
  };
  loading?: boolean;
}

export default function BatchStats({ summary, loading = false}: BatchStatsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statsData = [
    {
      label: "Total Stock",
      value: summary.totalStock,
      icon: FiPackage,
      color: "blue",
      unit: "units"
    },
    {
      label: "Total Damaged",
      value: summary.totalDamageQuantity,
      icon: FiAlertTriangle,
      color: "red",
      unit: "units"
    },
    {
      label: "Active Batches",
      value: summary.activeBatchesCount,
      icon: FiCheckCircle,
      color: "green",
      unit: "batches"
    },
    {
      label: "Inactive Batches",
      value: summary.inactiveBatchesCount,
      icon: FiPauseCircle,
      color: "gray",
      unit: "batches"
    },
    {
      label: "Sold Out",
      value: summary.soldOutBatchesCount,
      icon: FiXCircle,
      color: "red",
      unit: "batches"
    },
    {
      label: "Expired",
      value: summary.expiredBatchesCount,
      icon: FiClock,
      color: "red",
      unit: "batches"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      case "green":
        return "bg-green-50 text-green-700 border-green-200";
      case "gray":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-500";
      case "red":
        return "text-red-500";
      case "green":
        return "text-green-500";
      case "gray":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <>
      {/* Stats Overview Button */}
      <div className="flex justify-center mb-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="secondary"
          leftIcon={<IoIosStats/>}
          className="px-6 flex items-center gap-2 whitespace-nowrap mt-4"
        >
          Batch Statistics
        </Button>
      </div>

      {/* Centered Modal */}
      <CenteredModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Batch Statistics Overview"
        width="w-full max-w-4xl"
      >
        {loading ? (
          <Load message="Loading batch statistics" />
        ) : (
          <div className="space-y-6">
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsData.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className={`rounded-lg p-4 border ${getColorClasses(stat.color)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{stat.label}</p>
                      <IconComponent className={`w-5 h-5 ${getIconColor(stat.color)}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <span className="text-xs text-gray-500">{stat.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Health Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Batches</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.activeBatchesCount + summary.inactiveBatchesCount + summary.soldOutBatchesCount + summary.expiredBatchesCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Damage Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {summary.totalStock > 0 
                      ? ((summary.totalDamageQuantity / (summary.totalStock + summary.totalDamageQuantity)) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Batch Status Distribution</h4>
              <div className="space-y-2">
                {[
                  { label: "Active", count: summary.activeBatchesCount, color: "green" },
                  { label: "Inactive", count: summary.inactiveBatchesCount, color: "gray" },
                  { label: "Sold Out", count: summary.soldOutBatchesCount, color: "red" },
                  { label: "Expired", count: summary.expiredBatchesCount, color: "red" }
                ].map((item, index) => {
                  const total = summary.activeBatchesCount + summary.inactiveBatchesCount + summary.soldOutBatchesCount + summary.expiredBatchesCount;
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 w-16">{item.label}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              item.color === 'green' ? 'bg-green-500' :
                              item.color === 'gray' ? 'bg-gray-400' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12">{percentage}%</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CenteredModal>
    </>
  );
}
