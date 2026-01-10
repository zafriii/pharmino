import { TabletCalculationResult } from '../types/tablet-sale.types';

/**
 * Calculate price for tablet sales
 * @param product - Product information
 * @param quantity - Number of tablets requested
 * @param sellType - Type of sale (SINGLE_TABLET or FULL_STRIP)
 * @returns Calculation result with pricing information
 */
export function calculateTabletPrice(
  product: {
    pricePerUnit?: number | null;
    sellingPrice: number;
    tabletsPerStrip?: number | null;
  },
  quantity: number,
  sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML"
): TabletCalculationResult {
  const isTabletSale = sellType === "SINGLE_TABLET" && product.tabletsPerStrip && product.pricePerUnit;
  
  if (isTabletSale) {
    // Calculate price for individual tablets
    const unitPrice = product.pricePerUnit!;
    const totalPrice = unitPrice * quantity;
    
    return {
      totalPrice,
      unitPrice,
      isTabletSale: true,
      tabletsRequested: quantity
    };
  } else {
    // Regular strip/unit sale
    const unitPrice = product.sellingPrice;
    const totalPrice = unitPrice * quantity;
    
    return {
      totalPrice,
      unitPrice,
      isTabletSale: false,
      tabletsRequested: 0
    };
  }
}

/**
 * Calculate available tablets from inventory
 * @param totalStrips - Total strips in inventory
 * @param tabletsPerStrip - Number of tablets per strip
 * @returns Total available tablets
 */
export function calculateAvailableTablets(
  totalStrips: number,
  tabletsPerStrip: number
): number {
  return totalStrips * tabletsPerStrip;
}

/**
 * Calculate how many strips are affected by tablet deduction
 * @param tabletsToDeduct - Number of tablets to deduct
 * @param tabletsPerStrip - Number of tablets per strip
 * @returns Object with strips affected and remaining tablets
 */
export function calculateStripImpact(
  tabletsToDeduct: number,
  tabletsPerStrip: number
): {
  stripsAffected: number;
  remainingTabletsInLastStrip: number;
  completeStripsUsed: number;
} {
  const completeStripsUsed = Math.floor(tabletsToDeduct / tabletsPerStrip);
  const remainingTablets = tabletsToDeduct % tabletsPerStrip;
  const stripsAffected = completeStripsUsed + (remainingTablets > 0 ? 1 : 0);
  
  const result = {
    stripsAffected,
    remainingTabletsInLastStrip: remainingTablets > 0 ? tabletsPerStrip - remainingTablets : 0,
    completeStripsUsed
  };
  
  console.log("calculateStripImpact:", { tabletsToDeduct, tabletsPerStrip, result });
  
  return result;
}