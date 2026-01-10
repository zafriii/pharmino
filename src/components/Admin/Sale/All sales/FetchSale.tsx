import React from "react";
import { cookies } from "next/headers";
import AllSalesList from "./AllSalesList";
import SaleStats from "./SaleStats";
import EmptyState from "@/components/EmptyState";
import type { Sale } from "@/types/sale.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchSaleProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  };
}

// Fetch sales from API with caching
async function fetchSales(
  params: FetchSaleProps["searchParams"]
): Promise<{ sales: Sale[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
    ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
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
        sales: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/sales?${queryParams}`, {
      //  Cache strategy 
      next: {
        revalidate: 60, // 5 minutes
        tags: ["sales"], // For instant revalidation on mutations
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sales: ${response.status}`);
    }

    const data = await response.json();

    return {
      sales: data.sales || [],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Sales Error:", error);
    return {
      sales: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchSale({ searchParams }: FetchSaleProps) {
  const { sales, totalPages, currentPage } = await fetchSales(searchParams);

  return (
    <>
      <SaleStats sales={sales} />
      {sales.length === 0 ? (
        <EmptyState message="No sales found" />
      ) : (
        <AllSalesList
          sales={sales}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
}