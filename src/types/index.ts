// Catalog types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  createdAt?: Date;
}

// Contact/Leads types
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  productId?: string;
  status: 'new' | 'contacted' | 'completed';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
