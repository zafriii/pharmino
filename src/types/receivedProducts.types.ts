export interface ReceivedItem {
  id: number;
  receivedQuantity: number;
  receivedAt: string;
  remainingQuantity: number;
  isFullyProcessed: boolean;
  canAddToInventory: boolean;
  createdAt: string;
  updatedAt: string;
  purchaseItem: {
    id: number;
    itemId: number;
    supplier: string;
    quantity: number;
    puchasePrice: number;
    totalAmount: number;
    item: {
      id: number;
      itemName: string;
      brand?: string | null;
      genericName?: string | null;
      imageUrl?: string | null;
      sellingPrice?: number | null;
      category: {
        id: number;
        name: string;
      };
    };
    purchaseOrder: {
      id: string;
      totalAmount: number;
      status: string;
      createdAt: string;
    };
  };
  batches: Array<{
    id: number;
    batchNumber: string;
    quantity: number;
    status: string;
  }>;
}

export interface ReceivedProductsFilters {
  search?: string;
  page?: string;
}

export interface ReceivedProductsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReceivedProductsResponse {
  receivedItems: ReceivedItem[];
  pagination: ReceivedProductsPagination;
}