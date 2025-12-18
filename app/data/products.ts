export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  shipping: {
    free: boolean;
    days: number;
  };
  // Phase 4: 3D Viewer support
  model_3d_url?: string;
  model_3d_type?: 'glb';
  videos?: string[];
  // Seller information
  seller?: {
    id: number;
    name: string;
    rating?: number;
  };
  // Product properties
  material?: string;
  gold_karat?: string;
  gold_weight_grams?: number;
  properties?: Record<string, string>;
}
