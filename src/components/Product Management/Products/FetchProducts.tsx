import React from "react";
import { cookies } from "next/headers";
import ProductList from "./ProductList";
import EmptyState from "@/components/EmptyState";
import type { Product, Category } from "@/types/products.types";
import ProductStats from "./ProductStats";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchProductsProps {
  searchParams: {
    page?: string;
    search?: string;
    categoryId?: string;
    status?: string;
    stockStatus?: string; 
  };
  categories: Category[];
}

// Fetch products from API with caching
async function fetchProducts(
  params: FetchProductsProps["searchParams"]
): Promise<{ products: Product[]; totalPages: number; currentPage: number; stats: { total: number; active: number; inactive: number } }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    ...(params.search && { search: params.search }),
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.status && { status: params.status }),
    ...(params.stockStatus && { stockStatus: params.stockStatus }),
  });

  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return {
        products: [],
        totalPages: 1,
        currentPage: 1,
        stats: { total: 0, active: 0, inactive: 0 },
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/products?${queryParams}`, {
      //  Cache strategy - optimized for instant loading
      // cache: "force-cache", // Aggressive caching
      next: {
        revalidate: 60, // Revalidate in background after 60 seconds
        tags: ["products"], // Simple static tag for better cache hits
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const data = await response.json();

    // Handle new paginated response format
    const items = data.items || [];

    const formattedProducts = items.map((product: any) => ({
      ...product,
      sellingPrice: Number(product.sellingPrice),
    }));

    return {
      products: formattedProducts as Product[],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
      stats: data.stats || { total: 0, active: 0, inactive: 0 },
    };
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return {
      products: [],
      totalPages: 1,
      currentPage: 1,
      stats: { total: 0, active: 0, inactive: 0 },
    };
  }
}

export default async function FetchProducts({ searchParams, categories }: FetchProductsProps) {
  // Fetch products only
  const { products, totalPages, currentPage, stats } = await fetchProducts(searchParams);

  return (
    <>
      <ProductStats stats={stats} />
      {products.length === 0 ? (
        <EmptyState message="No products found" />
      ) : (
        <ProductList
          products={products}
          categories={categories}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      )}
    </>
  );
}

