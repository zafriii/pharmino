export interface SaleItem {
  id?: number;
  itemId: number;
  sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  item?: {
    id: number;
    itemName: string;
    imageUrl?: string | null;
    // category:string,
    brand?: string | null;
    strength?: string | null;
    tabletsPerStrip?: number | null;
    baseUnit: string;
    sellingPrice: number;
    pricePerUnit?: number | null;
    batches?: Array<{
      id: number;
      quantity: number;
      remainingTablets?: number | null;
      expiryDate: string;
      status: "ACTIVE" | "INACTIVE" | "SOLD_OUT" | "EXPIRED";
    }>;
  };
  batches?: {
    id: number;
    saleItemId: number;
    batchId: number;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    batch: {
      id: number;
      batchNumber: string;
      expiryDate: string | null;
    };
  }[];
}

export interface Sale {
  id: number;
  customerId?: number | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD";
  paymentStatus: "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
  status: "COMPLETED" | "RETURNED";
  returnReason?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    name: string;
    phone?: string | null;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  saleItems: SaleItem[];
  payments?: {
    id: number;
    amount: number;
    method: "CASH" | "CARD";
    status: "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
    refundedAmount?: number | null;
  }[];
}

export interface CreateSaleRequest {
  customerId?: number | null;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: "CASH" | "CARD";
  items: {
    itemId: number;
    sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML";
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface ProductForSale {
  id: number;
  itemName: string;
  imageUrl?: string | null;
  brand?: string | null;
  strength?: string | null;
  tabletsPerStrip?: number | null;
  baseUnit: string;
  sellingPrice: number;
  pricePerUnit?: number | null;
  status: "ACTIVE" | "INACTIVE";
  category?: {
    id: number;
    name: string;
  };
  batches?: Array<{
    id: number;
    quantity: number;
    remainingTablets?: number | null;
    expiryDate: string;
    status: "ACTIVE" | "INACTIVE" | "SOLD_OUT" | "EXPIRED";
  }>;
  totalStock?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface SaleFilters {
  search?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
}