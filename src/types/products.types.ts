export interface Product {
  id: number;
  categoryId: number;
  itemName: string;
  imageUrl?: string | null;
  genericName?: string | null;
  brand?: string | null;
  strength?: string | null;
  tabletsPerStrip?: number | null;
  unitPerBox?: number | null;
  baseUnit?: string | null;
  rackLocation?: string | null;
  lowStockThreshold: number;
  pricePerUnit?: number | null;
  sellingPrice: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
  batches?: Array<{
    id: number;
    quantity: number;
    expiryDate: string;
    status: string;
  }>;
  totalStock?: number;
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface Category {
  id: number;
  name: string;
  imageUrl?: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  categoryId: number;
  itemName: string;
  imageUrl?: string | null;
  genericName?: string | null;
  brand?: string | null;
  strength?: string | null;
  tabletsPerStrip?: number | null;
  unitPerBox?: number | null;
  baseUnit?: string | null;
  rackLocation?: string | null;
  lowStockThreshold: number;
  pricePerUnit?: number | null;
  sellingPrice: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  status?: string;
  stockStatus?: string;
  page?: string;
}