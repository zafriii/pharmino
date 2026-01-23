import React from "react";
import { cookies } from "next/headers";
import EmployeeList from "./EmployeeList";
import EmptyState from "@/components/EmptyState";
import type { Employee } from "@/types/employees.types";
import EmployeeStats from "./EmployeeStats";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchEmployeesProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    role?: string;
    duty?: string;
    shift?: string;
  };
}

// Fetch employees from API with caching
async function fetchEmployees(
  params: FetchEmployeesProps["searchParams"]
): Promise<{ employees: Employee[]; totalPages: number; currentPage: number; stats: { total: number; active: number; onLeave: number; inactive: number } }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.role && { role: params.role }),
    ...(params.duty && { duty: params.duty }),
    ...(params.shift && { shift: params.shift }),
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
        stats: { total: 0, active: 0, onLeave: 0, inactive: 0 },
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/employees?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      // cache: 'no-store', 
      //  Cache strategy 
      next: {
        revalidate: 60, // 5 minutes
        tags: ["employees"], // For instant revalidation on mutations
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
      throw new Error(`Failed to fetch employees: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
   

    const employees = (data.employees || []).map((emp: any) => ({
      ...emp,
      imageUrl: emp.image || null,
    }));

    return {
      employees: employees as Employee[],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
      stats: data.stats || { total: 0, active: 0, onLeave: 0, inactive: 0 },
    };
  } catch (error) {
    console.error("Fetch Employees Error:", error);
    return {
      employees: [],
      totalPages: 1,
      currentPage: 1,
      stats: { total: 0, active: 0, onLeave: 0, inactive: 0 },
    };
  }
}

export default async function FetchEmployees({ searchParams }: FetchEmployeesProps) {
  const { employees, totalPages, currentPage, stats } = await fetchEmployees(searchParams);

  return (
    <>
      <EmployeeStats stats={stats} />
      {employees.length === 0 ? (
        <EmptyState message="No employees found" />
      ) : (
        <EmployeeList
          employees={employees}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
}