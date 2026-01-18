import { cookies } from 'next/headers';
import PurchaseHistoryList from '../PurchaseHistory/PurchaseHistoryList';
import EmptyState from '@/components/EmptyState';
import { PurchaseOrder } from '@/types/purchase.types';
import PurchaseStats from '../PurchaseStats';
import { getSessionToken } from '@/lib/cookie-utils';

interface FetchReceivedItemsProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

async function fetchReceivedItems(
  params: FetchReceivedItemsProps["searchParams"]
): Promise<{ purchases: PurchaseOrder[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    status: 'RECEIVED',
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
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/purchases?${queryParams}`, {
      next: {
        revalidate: 60, // 5 minutes
        tags: ["purchases", "received-items"],
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch received items: ${response.status}`);
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
    };
  } catch (error) {
    console.error("Fetch Received Items Error:", error);
    return {
      purchases: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchReceivedItems({ searchParams }: FetchReceivedItemsProps) {
  const { purchases, totalPages, currentPage } = await fetchReceivedItems(searchParams);

  if (purchases.length === 0) {
    return <EmptyState message="No received items found" />;
  }

  return (
    <>
      <PurchaseStats purchases={purchases} />
      <PurchaseHistoryList
        purchases={purchases}
        totalPages={totalPages}
        currentPage={currentPage}
        tab="received"
      />
    </>
  );
}