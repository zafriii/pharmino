"use client";

import React from "react";
import { TabletSaleConfig } from "../../../../types/tablet-sale.types";

interface TabletSellSectionProps {
  product: {
    id: number;
    itemName: string;
    tabletsPerStrip?: number | null;
    pricePerUnit?: number | null;
    baseUnit: string;
  };
  tabletConfig: TabletSaleConfig;
  onConfigChange: (config: TabletSaleConfig) => void;
  availableTablets: number;
}

const TabletSellSection: React.FC<TabletSellSectionProps> = ({
  product,
  tabletConfig,
  onConfigChange,
  availableTablets,
}) => {
  // Only show for products with tabletsPerStrip and pricePerUnit
  if (!product.tabletsPerStrip || !product.pricePerUnit || product.baseUnit !== "TABLET") {
    return null;
  }

  const handleCheckboxChange = (enabled: boolean) => {
    onConfigChange({
      enabled,
      quantity: enabled ? Math.min(1, availableTablets) : 0
    });
  };

  const handleQuantityChange = (quantity: number) => {
    const validQuantity = Math.max(1, Math.min(quantity, availableTablets));
    onConfigChange({
      ...tabletConfig,
      quantity: validQuantity
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-blue-50">
      <div className="flex items-center gap-3 mb-2">
        {/* Custom circular checkbox */}
        <div className="flex items-center">
          <button
            onClick={() => handleCheckboxChange(!tabletConfig.enabled)}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              tabletConfig.enabled
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300 hover:border-blue-400"
            }`}
          >
            {tabletConfig.enabled && (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
        </div>
        <label className="text-sm font-medium text-gray-700">
          Sell Individual Tablets
        </label>
      </div>

      {tabletConfig.enabled && (
        <div className="ml-8 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Quantity:</label>
            <input
              type="number"
              value={tabletConfig.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
              className="w-20 text-center text-sm border border-gray-300 rounded px-2 py-1"
              min="1"
              max={availableTablets}
            />
            <span className="text-xs text-gray-500">
              tablets (Max: {availableTablets})
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Price per tablet: ₹{product.pricePerUnit.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabletSellSection;