"use client";

import React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface ActivitylogFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export default function ActivitylogFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: ActivitylogFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200">
        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="bg-transparent text-xs text-gray-700 outline-none border-none p-0 focus:ring-0 w-24"
          placeholder="Start date"
        />
      </div>
      <span className="text-gray-400 text-xs">to</span>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded border border-gray-200">
        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="bg-transparent text-xs text-gray-700 outline-none border-none p-0 focus:ring-0 w-24"
          placeholder="End date"
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          title="Clear filter"
        >
          <X className="h-3.5 w-3.5 text-gray-500" />
        </button>
      )}
    </div>
  );
}
