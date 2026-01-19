"use client";

import React, { useEffect } from "react";
import { ProductForSale } from "@/types/sale.types";
import { useSaleStore } from "@/stores/saleStore";
import { useSaleContext } from "@/contexts/SaleContext";
import ProductPagination from "../../Product Management/Products/ProductPagination";
import { hasAvailableBatches } from "@/lib/batch-utils";
import { useTimezone } from "@/hooks/useTimezone";

interface ProductCardsProps {
  products: ProductForSale[];
  totalPages: number;
  currentPage: number;
}

const ProductCards: React.FC<ProductCardsProps> = ({ products, totalPages, currentPage }) => {
  const addProduct = useSaleStore((state) => state.addProduct);
  const { setProducts } = useSaleContext();
  
  // Get user timezone for expiration checks
  const userTimezone = useTimezone();

  // Update products in context when they change
  useEffect(() => {
    setProducts(products);
  }, [products, setProducts]);

  const handleProductClick = (product: ProductForSale) => {
    // Check if product is out of stock
    if ((product.totalStock || 0) === 0) {
      return; // Don't add out of stock products
    }
    
    // Check if product has active batches
    const hasActiveBatches = product.batches?.some(batch => 
      batch.status === "ACTIVE" && (batch.quantity > 0 || (batch.remainingTablets && batch.remainingTablets > 0))
    );
    
    if (!hasActiveBatches) {
      return; // Don't add products with no active batches
    }
    
    // Check if product has non-expired active batches
    if (!hasAvailableBatches(product, userTimezone)) {
      return; // Don't add products with only expired batches
    }
    
    addProduct(product);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <h3 className="mb-2 text-lg font-medium">No Products Available</h3>
        <p className="text-sm text-center">
          No active products with stock are available for sale.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isOutOfStock = (product.totalStock || 0) === 0;
          const hasActiveBatches = product.batches?.some(batch => 
            batch.status === "ACTIVE" && (batch.quantity > 0 || (batch.remainingTablets && batch.remainingTablets > 0))
          );
          const hasNonExpiredBatches = hasAvailableBatches(product, userTimezone);
          
          const isUnavailable = isOutOfStock || !hasActiveBatches || !hasNonExpiredBatches;
          
          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`group rounded-lg border p-4 transition-all duration-200 ${
                isUnavailable 
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60" 
                  : "border-gray-300 cursor-pointer hover:border-blue-500 hover:bg-blue-500 hover:shadow-md"
              }`}
            >
              {/* Product Image */}
              <div className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.itemName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-4xl text-gray-400">📦</div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                {/* Name + Price */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`line-clamp-1 text-sm font-medium ${
                    isUnavailable 
                      ? "text-gray-500" 
                      : "text-gray-900 group-hover:text-white"
                  }`}>
                    {product.itemName}
                  </h3>

                  <div className={`whitespace-nowrap text-sm font-semibold ${
                    isUnavailable 
                      ? "text-gray-400" 
                      : "text-blue-600 group-hover:text-white"
                  }`}>
                    {product.sellingPrice}
                    {product.baseUnit === "TABLET" && product.tabletsPerStrip && (
                      <span className="ml-1 text-xs text-gray-200">/strip</span>
                    )}
                  </div>
                </div>

                {/* Brand + Strength */}
                {(product.brand || product.strength) && (
                  <p className={`line-clamp-1 text-xs ${
                    isUnavailable 
                      ? "text-gray-400" 
                      : "text-gray-600 group-hover:text-gray-100"
                  }`}>
                    {product.brand}
                    {product.brand && product.strength && " • "}
                    {product.strength}
                  </p>
                )}

                {/* Stock Status */}
                {isOutOfStock && (
                  <p className="text-xs text-red-500 font-medium">
                    Out of Stock
                  </p>
                )}
                {!isOutOfStock && !hasActiveBatches && (
                  <p className="text-xs text-red-500 font-medium">
                    No Active Batches
                  </p>
                )}
                {!isOutOfStock && hasActiveBatches && !hasNonExpiredBatches && (
                  <p className="text-xs text-red-500 font-medium">
                    Expired
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center">
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};

export default ProductCards;
