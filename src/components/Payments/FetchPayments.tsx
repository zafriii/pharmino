import React from "react";
import { cookies } from "next/headers";
// import AllPaymentsList from "./AllPaymentsList";
// import PaymentStats from "./PaymentStats";
import EmptyState from "@/components/EmptyState";
import type { Payment } from "@/types/payment.types";
import PaymentStats from "./PaymentStats";
import AllPaymentsList from "./AllPaymentsList";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchPaymentsProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    method?: string;
    dateFilter?: string;
    startDate?: string;
    endDate?: string;
  };
}

// Fetch payments from API with caching
async function fetchPayments(
  params: FetchPaymentsProps["searchParams"]
): Promise<{ payments: Payment[]; totalPages: number; currentPage: number; stats: {
  total: number;
  paid: number;
  refunded: number;
  partiallyRefunded: number;
  totalRevenue: number;
  totalRefunded: number;
  totalPartialRefunds: number;
} }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.method && { method: params.method }),
    ...(params.dateFilter && { dateFilter: params.dateFilter }),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        payments: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/payments?${queryParams}`, {
      //  Cache strategy 
      next: {
        revalidate: 60, // 5 minutes
        tags: ["payments"], // For instant revalidation on mutations
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.status}`);
    }

    const data = await response.json();

    return {
      payments: data.payments || [],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
      stats: data.stats || {
        total: 0,
        paid: 0,
        refunded: 0,
        partiallyRefunded: 0,
        totalRevenue: 0,
        totalRefunded: 0,
        totalPartialRefunds: 0,
      },
    };
  } catch (error) {
    console.error("Fetch Payments Error:", error);
    return {
      payments: [],
      totalPages: 1,
      currentPage: 1,
      stats: {
        total: 0,
        paid: 0,
        refunded: 0,
        partiallyRefunded: 0,
        totalRevenue: 0,
        totalRefunded: 0,
        totalPartialRefunds: 0,
      },
    };
  }
}

export default async function FetchPayments({ searchParams }: FetchPaymentsProps) {
  const { payments, totalPages, currentPage, stats } = await fetchPayments(searchParams);

  return (
    <>
      <PaymentStats stats={stats} />
      {payments.length === 0 ? (
        <EmptyState message="No payments found" />
      ) : (
        <AllPaymentsList
          payments={payments}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
} 