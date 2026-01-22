export interface InventoryItem {
  id: number;
  product: {
    id: number;
    itemName: string;
    brand?: string | null;
    genericName?: string | null;
    imageUrl?: string | null;
    category: {
      id: number;
      name: string;
    };
    lowStockThreshold: number;
    rackLocation?: string | null;
    tabletsPerStrip?: number;
  };
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  batches?: ProductBatch[];
}

export interface ProductBatch {
  id: number;
  batchNumber: string;
  expiryDate?: string | null;
  quantity: number;
  remainingTablets?: number | null; // For tablet tracking: NULL = complete strips, 0-N = tablets in opened strip
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | 'EXPIRED';
  damageQuantity?: number; // Total damage quantity (sum of counts)
  damageDisplay?: string; // Formatted damage string (e.g., "2 tablets")
  createdAt: string;
  updatedAt: string;
  item?: {
    id: number;
    itemName: string;
    brand?: string | null;
    genericName?: string | null;
    category: {
      id: number;
      name: string;
    };
  };
}

export interface BatchSummary {
  totalStock: number;
  totalDamageQuantity: number;
  activeBatchesCount: number;
  inactiveBatchesCount: number;
  soldOutBatchesCount: number;
  expiredBatchesCount: number;
}

export interface InventoryFilters {
  search?: string;
  stockStatus?: string;
  itemStatus?: string;
  page?: string;
}

export interface InventoryFormData {
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate?: string;
}