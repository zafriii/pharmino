'use client';

import React, { useState, useTransition } from 'react';
import { EmployeeWithAttendance } from '@/types/attendance.types';
import MarkButton from '@/components/shared ui/MarkButton';
import CrossButton from '@/components/shared ui/CrossButton';
import AttendanceStats from './AttendanceStats';
import { LuClockAlert } from "react-icons/lu";
import { markAttendanceAction, fetchEmployeeAttendanceStatsAction } from '@/actions/attendance.actions';
import ViewButton from '@/components/shared ui/ViewButton';

interface AttendanceActionProps {
  employee: EmployeeWithAttendance;
  selectedDate: string;
}

const AttendanceAction: React.FC<AttendanceActionProps> = ({ employee, selectedDate }) => {

  const [isPending, startTransition] = useTransition();
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const attendance = employee.attendance;
  const status = attendance?.status;

  // Normalize dates for comparison
  const attDate = attendance?.date ? new Date(attendance.date).toISOString().split("T")[0] : null;
  const isActive = attDate === selectedDate;

  const handleMarkAttendance = (newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    startTransition(async () => {
      try {
        await markAttendanceAction(
          employee.id,
          newStatus,
          selectedDate,
          attendance?.id
        );
      } catch (error) {
        console.error(`Failed to mark ${newStatus}`, error);
      }
    });
  };

  // Fetch employee-specific attendance stats using server action
  const fetchEmployeeStats = async (userId: string) => {
    try {
      setLoadingStats(true);
      const result = await fetchEmployeeAttendanceStatsAction(userId);
      
      if (result.success) {
        setEmployeeStats(result.stats || null);
      } else {
        console.error(result.error);
        setEmployeeStats(null);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      setEmployeeStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle stats modal open
  const handleStatsModalOpen = () => {
    setIsStatsModalOpen(true);
    fetchEmployeeStats(employee.id);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* View Stats Button */}
        <ViewButton
          onClick={handleStatsModalOpen}
          disabled={isPending || loadingStats}
          aria-label="View attendance statistics"                            
        />

        {/* Mark Present */}
        <MarkButton
          variant="success"
          ariaLabel="Mark Present"
          title="Mark Present"
          onClick={() => handleMarkAttendance('PRESENT')}
          isActive={isActive && status === 'PRESENT'}
          disabled={isPending}
        />

        {/* Mark Absent */}
        <CrossButton
          ariaLabel="Mark Absent"
          title="Mark Absent"
          onClick={() => handleMarkAttendance('ABSENT')}
          isActive={isActive && status === 'ABSENT'}
          disabled={isPending}
        />

        {/* Mark Late */}
        <button
          onClick={() => handleMarkAttendance('LATE')}
          aria-label="Mark Late"
          title="Mark Late"
          disabled={isPending}
          className={`p-2 rounded-xl bg-[#FEFCE8] text-[#CA8A04] transition-colors
            hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-700 focus:ring-opacity-50
            ${isActive && status === 'LATE' ? 'bg-yellow-700 hover:bg-yellow-800 text-white' : ''}
            ${isPending ? "opacity-50 cursor-not-allowed hover:bg-[#FEFCE8]" : ""}`}
        >
          <LuClockAlert 
            size={18} 
            className={isActive && status === 'LATE' ? 'text-white' : ''} 
          />
        </button>
      </div>

      {/* Stats Modal */}
      <AttendanceStats
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={employeeStats}
        loading={loadingStats}
        employeeName={employee.name}
      />
    </>
  );
};

export default AttendanceAction;
