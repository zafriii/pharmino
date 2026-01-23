import React from "react";
import { cookies } from "next/headers";
import PayrollList from "./PayrollList";
import EmptyState from "@/components/EmptyState";
import type { Payroll } from "@/types/payroll.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchPayrollProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    month?: string;
  };
}

/* Fetch Payrolls from API with caching*/
async function fetchPayrolls(
  params: FetchPayrollProps["searchParams"]
): Promise<{
  payrolls: Payroll[];
  totalPages: number;
  currentPage: number;
}> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.month && { month: params.month }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        payrolls: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/payrolls?${queryParams.toString()}`,
      {
        next: {
          revalidate: 60,
          tags: ["payrolls"],
        },
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch payrolls: ${response.status}`);
    }

    const data = await response.json();

    return {
      payrolls: data.payrolls || [],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Payrolls Error:", error);

    return {
      payrolls: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchPayroll({
  searchParams,
}: FetchPayrollProps) {
  const { payrolls, totalPages, currentPage } =
    await fetchPayrolls(searchParams);

  if (payrolls.length === 0) {
    return <EmptyState message="No Payroll Records Found" />;
  }

  return (
    <PayrollList
      payrolls={payrolls}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
