import React from "react";
import { Package, TrendingUp } from "lucide-react";

interface TopProduct {
  id: number;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  growth: number;
}

interface TopSellingProductsProps {
  products: TopProduct[];
}

export default function TopSellingProducts({ products }: TopSellingProductsProps) {
  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const getGrowthBg = (growth: number) => {
    return growth >= 0 ? "bg-green-100" : "bg-red-100";
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
      </div>

      {products.length > 0 ? (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{product.quantitySold}</p>
                  <p className="text-xs text-gray-500">Units Sold</p>
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>

                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getGrowthBg(product.growth)}`}>
                  <TrendingUp className={`w-3 h-3 ${getGrowthColor(product.growth)}`} />
                  <span className={`text-xs font-medium ${getGrowthColor(product.growth)}`}>
                    {product.growth >= 0 ? '+' : ''}{product.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No product sales data available</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {products.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {products.reduce((sum, p) => sum + p.quantitySold, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {products.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {(products.reduce((sum, p) => sum + p.growth, 0) / products.length).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Avg Growth</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}