export interface DamageRecord {
  id: number;
  itemId: number;
  batchId: number;
  quantity: number;
  damageType: 'FULL_STRIP' | 'SINGLE_TABLET' | 'ML';
  reason: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  item: {
    id: number;
    itemName: string;
    genericName?: string | null;
    brand?: string | null;
  };
  batch: {
    id: number;
    batchNumber: string;
    expiryDate?: string | null;
    supplier: string;
  };
  creator: {
    id: number;
    name: string;
    email: string;
  };
}

export interface DamageFormData {
  batchId: number;
  quantity: number;
  damageType: 'FULL_STRIP' | 'SINGLE_TABLET' | 'ML';
  reason: string;
}

export interface DamageFilters {
  page?: string;
  limit?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

export interface DamagePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}