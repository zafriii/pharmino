import React from 'react';
import PageContainer from "@/components/shared ui/PageContainer";
import ProductWrapper from '@/components/Product Management/Products/ProductWrapper';
import FetchProducts from '@/components/Product Management/Products/FetchProducts';
import { fetchCategoriesAction } from '@/actions/product.actions';
import MenuTabs from '@/components/Product Management/ProductTabs';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    categoryId?: string;
    status?: string;
    stockStatus?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  // Fetch categories using server action
  const categoriesResult = await fetchCategoriesAction();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <PageContainer title="Product Management">
      <div className="space-y-6">

        <MenuTabs/>
        {/* Product Controls */}
        <ProductWrapper categories={categories} />

        {/* Products List */}
        <FetchProducts searchParams={resolvedParams} categories={categories} />
      </div>
    </PageContainer>
  );
}




