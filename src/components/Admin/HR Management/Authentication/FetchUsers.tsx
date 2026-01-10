import React from "react";
import { cookies } from "next/headers";
import EmptyState from "@/components/EmptyState";
import type { Employee } from "@/types/employees.types";
import SetPassword from "./SetPassword";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchUsersProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

// Fetch users from API with caching
async function fetchUsers(
  params: FetchUsersProps["searchParams"]
): Promise<{ employees: Employee[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
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
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/admin/employees?${queryParams.toString()}`,
      {
        next: {
          revalidate: 60, // Cache for 5 min
          tags: ["employees"], // Revalidation tag
        },
        headers: {
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();

    const employees = (data.employees || []).map((emp: any) => ({
      ...emp,
      imageUrl: emp.imageUrl || null,
    }));

    return {
      employees,
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return {
      employees: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchUsers({
  searchParams,
}: FetchUsersProps) {
  const { employees, totalPages, currentPage } = await fetchUsers(searchParams);

  if (employees.length === 0) {
    return <EmptyState message="No employees found" />;
  }

  return (
    <SetPassword
      employees={employees}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
