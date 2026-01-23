import { cookies } from 'next/headers';
import PurchaseHistoryList from '../PurchaseHistory/PurchaseHistoryList';
import EmptyState from '@/components/EmptyState';
import { PurchaseOrder } from '@/types/purchase.types';
import PurchaseStats from '../PurchaseStats';
import { getSessionToken } from '@/lib/cookie-utils';

interface FetchOrderedItemsProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

async function fetchOrderedItems(
  params: FetchOrderedItemsProps["searchParams"]
): Promise<{ purchases: PurchaseOrder[]; totalPages: number; currentPage: number; stats: { totalOrders: number; totalAmount: number; listedOrders: number; totalItems: number } }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    status: 'ORDERED',
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
        tags: ["purchases", "ordered-items"],
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ordered items: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle new paginated response format (same as products API)
    const items = data.items || [];
    
    // Sort purchases by updatedAt in descending order (newest first)
    const sortedPurchases = (items as PurchaseOrder[]).sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return {
      purchases: sortedPurchases,
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
      stats: data.stats || { totalOrders: 0, totalAmount: 0, listedOrders: 0, totalItems: 0 },
    };
  } catch (error) {
    console.error("Fetch Ordered Items Error:", error);
    return {
      purchases: [],
      totalPages: 1,
      currentPage: 1,
      stats: { totalOrders: 0, totalAmount: 0, listedOrders: 0, totalItems: 0 },
    };
  }
}

export default async function FetchOrderedItems({ searchParams }: FetchOrderedItemsProps) {
  const { purchases, totalPages, currentPage, stats } = await fetchOrderedItems(searchParams);

  if (purchases.length === 0) {
    return <EmptyState message="No ordered items found" />;
  }

  return (
    <>
      <PurchaseStats stats={stats} />
      <PurchaseHistoryList
        purchases={purchases}
        totalPages={totalPages}
        currentPage={currentPage}
        tab="ordered"
      />
    </>
  );
}