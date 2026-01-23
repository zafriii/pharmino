import { cookies } from 'next/headers';
import PurchaseList from './PurchaseList';
import PurchaseStats from '../PurchaseStats';
import EmptyState from '@/components/EmptyState';
import { PurchaseOrder } from '@/types/purchase.types';
import { getSessionToken } from '@/lib/cookie-utils';

interface FetchPurchasesProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
  };
}

async function fetchPurchases(
  params: FetchPurchasesProps["searchParams"]
): Promise<{ purchases: PurchaseOrder[]; totalPages: number; currentPage: number; stats: { totalOrders: number; totalAmount: number; listedOrders: number; totalItems: number } }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    status: 'LISTED', // Only show listed items
    ...(params.search && { search: params.search }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        purchases: [],
        totalPages: 1,
        currentPage: 1,
        stats: { totalOrders: 0, totalAmount: 0, listedOrders: 0, totalItems: 0 },
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/purchases?${queryParams}`, {
      next: {
        revalidate: 60, // 5 minutes
        tags: ["purchases"],
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchases: ${response.status}`);
    }

    const data = await response.json();
    
    const items = data.items || [];
    
    return {
      purchases: items as PurchaseOrder[],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
      stats: data.stats || { totalOrders: 0, totalAmount: 0, listedOrders: 0, totalItems: 0 },
    };
  } catch (error) {
    console.error("Fetch Purchases Error:", error);
    return {
      purchases: [],
      totalPages: 1,
      currentPage: 1,
      stats: { totalOrders: 0, totalAmount: 0, listedOrders: 0, totalItems: 0 },
    };
  }
}

export default async function FetchPurchases({ searchParams }: FetchPurchasesProps) {
  const { purchases, totalPages, currentPage, stats } = await fetchPurchases(searchParams);

  return (
    <>
      <PurchaseStats stats={stats} />
      {purchases.length === 0 ? (
        <EmptyState message="No purchase lists found" />
      ) : (
        <PurchaseList
          purchases={purchases}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
}