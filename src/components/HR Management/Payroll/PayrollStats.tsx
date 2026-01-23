import React from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import { PayrollResponse } from "@/types/payroll.types";
import { 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown,
  FiCheckCircle,
  FiClock,
  FiAward
} from "react-icons/fi";
import Load from "@/components/Load";

interface PayrollStatsProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: PayrollResponse["stats"];
  loading?: boolean;
  employeeName?: string;
}

export default function PayrollStats({
  isOpen,
  onClose,
  stats,
  loading = false,
  employeeName,
}: PayrollStatsProps) {
  const formatNumber = (num: string | number) => {
    const n = Number(num);
    return isNaN(n) ? String(num) : n.toLocaleString("en-US");
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeName ? `Payroll Statistics - ${employeeName}` : "Payroll Statistics"}
      width="w-full max-w-3xl"
    >
      {loading ? (
        <div className="text-center text-gray-500 py-10">       
         <Load message="Loading statistics" />
        </div>
      ) : !stats ? (
        <div className="text-center text-gray-500 py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <FiUsers className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">Statistics not available</p>
          <p className="text-sm text-gray-400">No payroll data found for this employee.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Total Net Pay - Featured Card */}
          <div className="bg-[#4a90e2] rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium mb-2">Total Net Pay</p>
                <p className="text-4xl font-bold">{formatNumber(stats.totalNetPay)}</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <FiAward className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Payrolls */}
            <StatCard
              icon={<FiUsers className="w-6 h-6" />}
              label="Total Payrolls"
              value={stats.totalPayrolls}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
              textColor="text-blue-900"
            />

            {/* Total Base Salary */}
            <StatCard
              icon={<FiDollarSign className="w-6 h-6" />}
              label="Total Base Salary"
              value={formatNumber(stats.totalBaseSalary)}
              bgColor="bg-indigo-50"
              iconColor="text-indigo-600"
              textColor="text-indigo-900"
            />

            {/* Total Allowances */}
            <StatCard
              icon={<FiTrendingUp className="w-6 h-6" />}
              label="Total Allowances"
              value={formatNumber(stats.totalAllowances)}
              bgColor="bg-green-50"
              iconColor="text-green-600"
              textColor="text-green-900"
            />

            {/* Total Deductions */}
            <StatCard
              icon={<FiTrendingDown className="w-6 h-6" />}
              label="Total Deductions"
              value={formatNumber(stats.totalDeductions)}
              bgColor="bg-red-50"
              iconColor="text-red-600"
              textColor="text-red-900"
            />
          </div>

          {/* Payment Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Payrolls */}
            <StatCard
              icon={<FiClock className="w-6 h-6" />}
              label="Pending Payrolls"
              value={stats.pendingPayrolls}
              bgColor="bg-amber-50"
              iconColor="text-amber-600"
              textColor="text-amber-900"
            />

            {/* Paid Payrolls */}
            <StatCard
              icon={<FiCheckCircle className="w-6 h-6" />}
              label="Paid Payrolls"
              value={stats.paidPayrolls}
              bgColor="bg-emerald-50"
              iconColor="text-emerald-600"
              textColor="text-emerald-900"
            />
          </div>
        </div>
      )}
    </CenteredModal>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
  iconColor: string;
  textColor: string;
}

function StatCard({ icon, label, value, bgColor, iconColor, textColor }: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-5 transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`${textColor} text-sm font-medium mb-2 opacity-80`}>{label}</p>
          <p className={`${textColor} text-3xl font-bold`}>{value}</p>
        </div>
        <div className={`${bgColor} ${iconColor} rounded-lg p-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}