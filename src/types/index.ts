// Base types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  businessId: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Form Data types
export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  businessId: string;
}

// Component Props
export interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export interface ProductFormProps {
  businessId: string;
  initialData?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: () => void;
}
