import React from "react";
import { cookies } from "next/headers";
import ReceivedProductsList from "./ReceivedProductsList";
import EmptyState from "@/components/EmptyState";
import { ReceivedItem } from "@/types/receivedProducts.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchReceivedProductsProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

async function fetchReceivedProducts(
  params: FetchReceivedProductsProps["searchParams"]
): Promise<{ receivedItems: ReceivedItem[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    _t: Date.now().toString(), // Cache busting timestamp
    ...(params.search && { search: params.search }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        receivedItems: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/received-items?${queryParams}`,
      {
        // cache: 'no-store', // Force no caching
        next: {
        revalidate: 60, // 5 minutes
          tags: ["purchases"],
        },
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch received items: ${response.status}`);
    }

    const data = await response.json();

    return {
      receivedItems: data.receivedItems || [],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Received Products Error:", error);
    return {
      receivedItems: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchReceivedProducts({searchParams}: FetchReceivedProductsProps) {
  const { receivedItems, totalPages, currentPage } = await fetchReceivedProducts(searchParams);

  if (receivedItems.length === 0) {
    return (
        <EmptyState message="No received products found" />        
    );
  }

  return (
    <ReceivedProductsList
      receivedItems={receivedItems}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
