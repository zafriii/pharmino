import React from "react";
import { Suspense } from "react";
import PageContainer from "@/components/shared ui/PageContainer";
import MenuTabs from "@/components/Admin/Product Management/ProductTabs";
import CategoryWrapper from "@/components/Admin/Product Management/Category/CategoryWrapper";
import FetchCategories from "@/components/Admin/Product Management/Category/FetchCategories";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Category Management">
      <MenuTabs />
      
      <CategoryWrapper />
      <FetchCategories searchParams={resolvedParams} />
      
      {/* <Suspense fallback={<Load message="Loading categories" />}>
        <FetchCategories searchParams={resolvedParams} />
      </Suspense> */}
    </PageContainer>
  );
}