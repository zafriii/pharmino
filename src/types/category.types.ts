export interface Category {
  id: number;
  name: string;
  imageUrl?: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  categories: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryFilters {
  page?: string;
  limit?: string;
  search?: string;
  archived?: string;
}

