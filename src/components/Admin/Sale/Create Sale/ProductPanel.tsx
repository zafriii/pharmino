import { fetchCategoriesAction } from "@/actions/product.actions";
import SaleProductWrapper from "./SaleProductWrapper";
import FetchSaleProducts from "./FetchSaleProducts";

interface ProductPanelProps {
  searchParams: {
    search?: string;
    categoryId?: string;
    page?: string;
  };
}

export default async function ProductPanel({ searchParams }: ProductPanelProps) {
  // Fetch categories using server action
  const categoriesResult = await fetchCategoriesAction();
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <div className="space-y-6">
      {/* Search and Filter Wrapper */}
      <SaleProductWrapper categories={categories} />

      {/* Products List */}
      <FetchSaleProducts searchParams={searchParams} />
    </div>
  );
}
