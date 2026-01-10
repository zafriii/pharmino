import { BatchDeduction } from "@/lib/inventory-utils";

export interface TabletSaleConfig {
  enabled: boolean;
  quantity: number;
}

export interface EnhancedSaleItem {
  id?: number;
  itemId: number;
  sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tabletConfig?: TabletSaleConfig;
  item?: {
    id: number;
    itemName: string;
    imageUrl?: string | null;
    brand?: string | null;
    strength?: string | null;
    tabletsPerStrip?: number | null;
    baseUnit: string;
    sellingPrice: number;
    pricePerUnit?: number | null;
  };
}

export interface TabletInventoryDeduction {
  batchId: number;
  tabletsDeducted: number;
  stripsAffected: number;
  remainingTabletsInStrip: number;
}

export interface TabletInventoryUpdateResult {
  success: boolean;
  batchDeductions: BatchDeduction[];
  tabletDeductions: TabletInventoryDeduction[];
  remainingQuantity: number;
  error?: string;
}

export interface BatchWithTablets {
  id: number;
  quantity: number;
  remainingTablets?: number | null;
  status: string;
  itemId: number;
}

export interface TabletCalculationResult {
  totalPrice: number;
  unitPrice: number;
  isTabletSale: boolean;
  tabletsRequested: number;
}