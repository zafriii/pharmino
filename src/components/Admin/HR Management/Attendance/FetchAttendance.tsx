import React from "react";
import { cookies } from "next/headers";
import AttendanceList from "./AttendanceList";
import EmptyState from "@/components/EmptyState";
import type { EmployeeWithAttendance } from "@/types/attendance.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchAttendanceProps {
  searchParams: {
    page?: string;
    search?: string;
    date?: string;
  };
}

// Fetch employees with attendance data from API with caching
async function fetchEmployeesWithAttendance(
  params: FetchAttendanceProps["searchParams"]
): Promise<{ 
  employees: EmployeeWithAttendance[]; 
  totalPages: number; 
  currentPage: number;
  selectedDate: string;
}> {
  const page = Number(params.page) || 1;
  const selectedDate = params.date || new Date().toISOString().split('T')[0];

  const queryParams = new URLSearchParams({
    page: String(page),
    status: "ACTIVE", // Only show active employees
    ...(params.search && { search: params.search }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        employees: [],
        totalPages: 1,
        currentPage: 1,
        selectedDate,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Fetch employees
    const employeesResponse = await fetch(`${baseUrl}/api/admin/employees?${queryParams}`, {
      next: {
        revalidate: 60, // 5 minutes
        tags: ["employees"], 
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!employeesResponse.ok) {
      throw new Error(`Failed to fetch employees: ${employeesResponse.status}`);
    }

    const employeesData = await employeesResponse.json();

    // Fetch attendance for the selected date
    const attendanceParams = new URLSearchParams({
      date: selectedDate,
      limit: "1000", // Get all attendance records for the date
    });

    const attendanceResponse = await fetch(`${baseUrl}/api/admin/attendance?${attendanceParams}`, {
      next: {
        revalidate: 60, // 1 minute for attendance data
        tags: ["attendance"],
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    let attendanceRecords: any[] = [];
    if (attendanceResponse.ok) {
      const attendanceData = await attendanceResponse.json();
      attendanceRecords = attendanceData.attendances || [];
    }

    // Merge employees with their attendance data
    const employees = (employeesData.employees || []).map((emp: any) => {
      const attendance = attendanceRecords.find(att => att.userId === emp.id);
      return {
        ...emp,
        imageUrl: emp.imageUrl || null,
        attendance: attendance || null,
      };
    });

    return {
      employees: employees as EmployeeWithAttendance[],
      totalPages: employeesData.pagination?.totalPages || 1,
      currentPage: page,
      selectedDate,
    };
  } catch (error) {
    console.error("Fetch Employees with Attendance Error:", error);
    return {
      employees: [],
      totalPages: 1,
      currentPage: 1,
      selectedDate,
    };
  }
}

export default async function FetchAttendance({ searchParams }: FetchAttendanceProps) {
  const { employees, totalPages, currentPage, selectedDate } = await fetchEmployeesWithAttendance(searchParams);

  if (employees.length === 0) {
    return <EmptyState message="No employees found" />;
  }

  return (
    <AttendanceList
      employees={employees}
      totalPages={totalPages}
      currentPage={currentPage}
      selectedDate={selectedDate}
    />
  );
}