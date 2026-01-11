import React from "react";
import { cookies } from "next/headers";
import InventoryList from "./InventoryList";
import EmptyState from "@/components/EmptyState";
import { InventoryItem } from "@/types/inventory.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchInventoryProps {
  searchParams: {
    page?: string;
    search?: string;
    stockStatus?: string;
    itemStatus?: string;
  };
}

const baseUrl = process.env.BETTER_AUTH_URL;

async function fetchInventory(
  params: FetchInventoryProps["searchParams"]
): Promise<{ inventory: InventoryItem[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.stockStatus && { stockStatus: params.stockStatus }),
    ...(params.itemStatus && { itemStatus: params.itemStatus }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      console.log('No session token found');
      return {
        inventory: [],
        totalPages: 1,
        currentPage: 1,
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/admin/inventory?${queryParams}`,
      {
        next: {
          revalidate: 60, // 5 minutes
          tags: ["inventory"],
        },
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }

    const result = await response.json();

    const inventoryData = result.inventory || [];

    const transformedInventory: InventoryItem[] = inventoryData.map((item: any) => ({
      id: item.id,
      product: {
        id: item.id,
        itemName: item.itemName,
        brand: item.brand,
        genericName: item.genericName,
        imageUrl: item.imageUrl,
        category: item.category || { id: 0, name: "Uncategorized" },
        lowStockThreshold: item.lowStockThreshold,
        rackLocation: item.rackLocation,
        tabletsPerStrip: item.tabletsPerStrip, 
      },
      totalQuantity: item.totalStock || 0,
      availableQuantity: item.availableStock || 0,
      reservedQuantity: item.reservedStock || 0,
      lowStockThreshold: item.lowStockThreshold,
      status: item.stockStatus || "OUT_OF_STOCK",
      lastUpdated: item.updatedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // The API includes batches directly in the item, and also nested in inventory
      batches: item.inventory?.batches || item.batches || [],
    }));

    return {
      inventory: transformedInventory,
      totalPages: result.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Inventory Error:", error);
    return {
      inventory: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchInventory({ searchParams }: FetchInventoryProps) {
  const { inventory, totalPages, currentPage } = await fetchInventory(searchParams);

  if (inventory.length === 0) {
    return <EmptyState message="No inventory items found" />;
  }

  return (
    <InventoryList
      inventory={inventory}
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}





