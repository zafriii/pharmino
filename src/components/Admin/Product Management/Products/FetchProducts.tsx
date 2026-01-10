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
): Promise<{ products: Product[]; totalPages: number; currentPage: number }> {
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
      };
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/admin/products?${queryParams}`, {
      //  Cache strategy 
      next: {
        revalidate: 60, // 5 minutes
        // tags: ["products"], // For instant revalidation on mutations
        tags: [`products-${params.status || "ALL"}-${params.stockStatus || "ALL"}-${params.categoryId || "ALL"}`]
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

export default async function FetchProducts({ searchParams, categories }: FetchProductsProps) {
  // Fetch products only
  const { products, totalPages, currentPage } = await fetchProducts(searchParams);

  return (
    <>
      <ProductStats products={products} />
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








