import { AlertTriangle, Package, PackageX, Clock } from 'lucide-react';
import type { InventoryAlertsProps } from "@/types/dashboard.types";

export default function InventoryAlerts({
  expiringProducts,
  lowStockProducts,
  outOfStockProducts
}: InventoryAlertsProps) {
  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getExpiryUrgency = (days: number) => {
    if (days <= 0) return 'text-red-600 bg-red-50';
    if (days === 1) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Inventory Alerts</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Products */}
        <div className="bg-white rounded-lg border border-gray-200 ">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-medium text-gray-900">Expiring Soon</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {expiringProducts.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Products expiring within 2 days</p>
          </div>
          <div className="p-4">
            {expiringProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No products expiring soon</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {expiringProducts.map((product) => (
                  <div key={`${product.id}-${product.batchNumber}`} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{product.itemName}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getExpiryUrgency(product.daysUntilExpiry)}`}>
                        {product.daysUntilExpiry <= 0 ? 'Expired' : `${product.daysUntilExpiry}d left`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Batch: {product.batchNumber}</div>
                      <div>Qty: {product.quantity}</div>
                      <div>Expires: {formatExpiryDate(product.expiryDate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg border border-gray-200 ">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-yellow-500" />
              <h3 className="font-medium text-gray-900">Low Stock</h3>
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                {lowStockProducts.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Products below threshold</p>
          </div>
          <div className="p-4">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All products well stocked</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{product.itemName}</h4>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        Low
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Current: {product.totalQuantity}</div>
                      <div>Threshold: {product.lowStockThreshold}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min((product.totalQuantity / product.lowStockThreshold) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-lg border border-gray-200 ">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <PackageX className="w-5 h-5 text-red-500" />
              <h3 className="font-medium text-gray-900">Out of Stock</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                {outOfStockProducts.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Products with zero stock</p>
          </div>
          <div className="p-4">
            {outOfStockProducts.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No out of stock products</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{product.itemName}</h4>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        Out
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Stock: {product.totalQuantity}</div>
                      <div>Threshold: {product.lowStockThreshold}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full w-0"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}