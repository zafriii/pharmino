import React from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Load from "@/components/Load";

interface AttendanceStatsData {
  last30Days: {
    present: number;
    absent: number;
    late: number;
  };
}

interface AttendanceStatsProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: AttendanceStatsData;
  loading?: boolean;
  employeeName?: string;
}

export default function AttendanceStats({
  isOpen,
  onClose,
  stats,
  loading = false,
  employeeName,
}: AttendanceStatsProps) {
  const calculateTotal = () => {
    if (!stats) return 0;
    return stats.last30Days.present + stats.last30Days.absent + stats.last30Days.late;
  };

  const calculateAttendancePercentage = () => {
    if (!stats) return 0;
    const total = calculateTotal();
    if (total === 0) return 0;
    return Math.round((stats.last30Days.present / total) * 100);
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeName ? `Attendance Statistics - ${employeeName}` : "Attendance Statistics"}
      width="w-full max-w-2xl"
    >
      {loading ? (
         <Load message="Loading statistics" />
      ) : !stats ? (
        <div className="text-center text-gray-500 py-10">
          <p className="mb-2">Statistics not available</p>
          <p className="text-sm">No attendance data found for this employee.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last 30 Days Overview</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{calculateAttendancePercentage()}%</p>
                <p className="text-sm text-gray-600">Attendance Rate</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-gray-900">{calculateTotal()}</p>
                <p className="text-sm text-gray-600">Total Days</p>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AttendanceStat 
              label="Present Days" 
              value={stats.last30Days.present} 
              color="green"
              percentage={calculateTotal() > 0 ? Math.round((stats.last30Days.present / calculateTotal()) * 100) : 0}
            />
            <AttendanceStat 
              label="Absent Days" 
              value={stats.last30Days.absent} 
              color="red"
              percentage={calculateTotal() > 0 ? Math.round((stats.last30Days.absent / calculateTotal()) * 100) : 0}
            />
            <AttendanceStat 
              label="Late Days" 
              value={stats.last30Days.late} 
              color="yellow"
              percentage={calculateTotal() > 0 ? Math.round((stats.last30Days.late / calculateTotal()) * 100) : 0}
            />
          </div>

          {/* Performance Indicator */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Performance Indicator</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateAttendancePercentage()}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {calculateAttendancePercentage() >= 90 ? 'Excellent' : 
                 calculateAttendancePercentage() >= 80 ? 'Good' : 
                 calculateAttendancePercentage() >= 70 ? 'Average' : 'Needs Improvement'}
              </span>
            </div>
          </div>
        </div>
      )}
    </CenteredModal>
  );
}

function AttendanceStat({
  label,
  value,
  color,
  percentage,
}: {
  label: string;
  value: number;
  color: 'green' | 'red' | 'yellow';
  percentage: number;
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1">{percentage}% of total</p>
    </div>
  );
}