import React from "react";
import { cookies } from "next/headers";
import EmptyState from "@/components/EmptyState";
import ProductCards from "./ProductCards";
import { ProductForSale } from "@/types/sale.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchSaleProductsProps {
  searchParams: {
    page?: string;
    search?: string;
    categoryId?: string;
  };
}

// Fetch products from API with pagination
async function fetchProducts(
  params: FetchSaleProductsProps["searchParams"]
): Promise<{ products: ProductForSale[]; totalPages: number; currentPage: number }> {
  const page = Number(params.page) || 1;

  const queryParams = new URLSearchParams({
    page: String(page),
    status: "ACTIVE",
    ...(params.search && { search: params.search }),
    ...(params.categoryId &&
      params.categoryId !== "all" && { categoryId: params.categoryId }),
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
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(
      `${baseUrl}/api/products?${queryParams}`,
      {
        next: {
          revalidate: 60,
          tags: ["products-for-sale"],
        },
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products`);
    }

    const data = await response.json();
    const items = data.data?.items || data.items || [];

    return {
      products: items as ProductForSale[],
      totalPages: data.pagination?.totalPages || 1,
      currentPage: page,
    };
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return {
      products: [],
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export default async function FetchSaleProducts({
  searchParams,
}: FetchSaleProductsProps) {
  const { products, totalPages, currentPage } = await fetchProducts(searchParams);

  if (products.length === 0) {
    return <EmptyState message="No products found" />;
  }

  return (
    <ProductCards 
      products={products} 
      totalPages={totalPages}
      currentPage={currentPage}
    />
  );
}
