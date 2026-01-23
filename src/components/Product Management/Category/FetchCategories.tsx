import React from "react";
import { cookies } from "next/headers";
import CategoryList from "./CategoryList";
import EmptyState from "@/components/EmptyState";
import type { Category } from "@/types/category.types";
import { getSessionToken } from "@/lib/cookie-utils";

interface FetchCategoriesProps {
  searchParams: {
    search?: string;
  };
}

// Fetch categories from API with caching
export async function fetchCategories(
  params: FetchCategoriesProps["searchParams"] = {}
): Promise<Category[]> {
  try {
    // Get session token 
    const sessionToken = await getSessionToken();
    const baseUrl = process.env.BETTER_AUTH_URL;

    if (!sessionToken) {
      console.log('No session token found');
      return [];
    }

    // For server-to-server calls, we need to pass all cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/categories`, {
      //  Cache strategy 
      next: {
        revalidate: 60, // 5 minutes
        tags: ["categories"], // For instant revalidation on mutations
      },
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    let categories = data || [];
    
    // Filter categories based on search if provided
    if (params.search) {
      categories = categories.filter((cat: Category) =>
        cat.name.toLowerCase().includes(params.search!.toLowerCase())
      );
    }

    return categories as Category[];
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    return [];
  }
}

export default async function FetchCategories({ searchParams }: FetchCategoriesProps) {
  const categories = await fetchCategories(searchParams);

  if (categories.length === 0) {
    return <EmptyState message="No categories found" />;
  }

  return <CategoryList categories={categories} />;
}