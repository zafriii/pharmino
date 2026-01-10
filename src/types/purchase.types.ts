export interface PurchaseItem {
  id: number;
  purchaseOrderId: string;
  itemId: number;
  supplier: string;
  quantity: number;
  totalAmount: number;
  puchasePrice: number,
  status: PurchaseStatus;
  createdAt: string;
  updatedAt: string;
  item: {
    id: number;
    itemName: string;
    brand?: string | null;
    category: {
      id: number;
      name: string;
    };
  };
}

export interface PurchaseOrder {
  id: string;
  totalAmount: number;
  status: PurchaseStatus;
  puchasePrice: number,
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}

export type PurchaseStatus = "LISTED" | "ORDERED" | "RECEIVED";

export interface PurchaseFormItem {
  itemId: number;
  itemName?: string;
  supplier: string;
  quantity: number;
  puchasePrice: number;
}

export interface PurchaseFormValues {
  items: PurchaseFormItem[];
}

export interface PurchaseFilters {
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export interface PurchaseResponse {
  purchaseOrders: PurchaseOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreatePurchaseRequest {
  items: Array<{
    itemId: number;
    supplier: string;
    quantity: number;
    puchasePrice: number;
  }>;
}

export interface UpdatePurchaseStatusRequest {
  status: PurchaseStatus;
}