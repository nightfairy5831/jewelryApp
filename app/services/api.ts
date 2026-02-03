import { Product } from '../data/products';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'admin';
  avatar?: string;
  seller_status?: 'pending' | 'approved' | 'rejected' | 'inactive' | null;
  seller_approved?: boolean;
  mercadopago_connected?: boolean;
  mercadopago_user_id?: string | null;
  is_active?: boolean;
  createdAt?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

interface RegisterResponse {
  user: User;
  token: string;
  message?: string;
}

// Token refresh tracking
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

// Helper function for API calls with timeout and auto-refresh
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount = 0
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 Unauthorized - Token expired
    if (response.status === 401 && retryCount === 0) {
      const authHeader = options?.headers?.['Authorization'] as string;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const oldToken = authHeader.replace('Bearer ', '');

        // If already refreshing, wait for the new token
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((newToken: string) => {
              // Retry the request with new token
              const newOptions = {
                ...options,
                headers: {
                  ...options?.headers,
                  'Authorization': `Bearer ${newToken}`,
                },
              };
              apiCall<T>(endpoint, newOptions, retryCount + 1)
                .then(resolve)
                .catch(reject);
            });
          });
        }

        // Start token refresh
        isRefreshing = true;

        try {
          const refreshResponse = await authApi.refresh(oldToken);
          const newToken = refreshResponse.token;

          // Store new token directly in AsyncStorage
          await AsyncStorage.setItem('authToken', newToken);

          isRefreshing = false;
          onTokenRefreshed(newToken);

          // Retry original request with new token
          const newOptions = {
            ...options,
            headers: {
              ...options?.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          return apiCall<T>(endpoint, newOptions, retryCount + 1);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Refresh failed, clear auth and force logout
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('rememberMe');

          throw new Error('Session expired. Please login again.');
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} - ${response.statusText}`;

      try {
        const errorJson = await response.json();
        console.error('API Error Response:', errorJson);

        // Extract meaningful error message
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.errors) {
          // Validation errors
          const errors = Object.values(errorJson.errors).flat();
          errorMessage = errors.join(', ');
        }
      } catch (parseError) {
        // If response is not JSON, try to get text
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        if (errorText) {
          errorMessage = errorText.substring(0, 200); // Limit error length
        }
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Better error messages for debugging
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server took too long to respond');
    }
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Is Laravel running?`);
    }

    throw error;
  }
}

// Product API
export const productApi = {
  // Get all products (public endpoint) - Fetches ALL pages
  getAll: async (): Promise<Product[]> => {
    const allProducts: any[] = [];
    let currentPage = 1;
    let lastPage = 1;

    // Fetch all pages
    do {
      const response = await apiCall<PaginatedResponse<any>>(`/products?page=${currentPage}`);
      allProducts.push(...response.data);
      lastPage = response.last_page;
      currentPage++;
    } while (currentPage <= lastPage);

    // Transform Laravel response to match frontend Product interface
    return allProducts.map(transformProduct);
  },

  // Get single product (public endpoint)
  getById: async (id: string): Promise<Product> => {
    const response = await apiCall<any>(`/products/${id}`);
    return transformProduct(response);
  },

  // Create product (seller only)
  createProduct: async (token: string, productData: any): Promise<any> => {
    return await apiCall<any>('/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
  },

  // Update product (seller only)
  updateProduct: async (token: string, productId: number, productData: any): Promise<any> => {
    return await apiCall<any>(`/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
  },

  // Delete product (seller only)
  deleteProduct: async (token: string, productId: number): Promise<any> => {
    return await apiCall<any>(`/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Transform Laravel Product to Frontend Product interface
function transformProduct(apiProduct: any): Product {
  // Parse images - Laravel returns JSON string, need to parse it
  let images: string[] = [];
  if (typeof apiProduct.images === 'string') {
    try {
      images = JSON.parse(apiProduct.images);
    } catch (e) {
      images = [];
    }
  } else if (Array.isArray(apiProduct.images)) {
    images = apiProduct.images;
  }

  // Parse videos - same issue
  let videos: string[] = [];
  if (typeof apiProduct.videos === 'string') {
    try {
      videos = JSON.parse(apiProduct.videos);
    } catch (e) {
      videos = [];
    }
  } else if (Array.isArray(apiProduct.videos)) {
    videos = apiProduct.videos;
  }

  return {
    id: apiProduct.id.toString(),
    name: apiProduct.name,
    description: apiProduct.description || '',
    price: parseFloat(apiProduct.current_price || apiProduct.base_price),
    originalPrice: apiProduct.base_price ? parseFloat(apiProduct.base_price) : undefined,
    discount: calculateDiscount(parseFloat(apiProduct.base_price), parseFloat(apiProduct.current_price)),
    images: images,
    thumbnail: images[0] || '',
    category: apiProduct.category || 'Uncategorized',
    subcategory: apiProduct.subcategory,
    rating: 4.5, // TODO: Add rating system to backend
    reviewCount: 0, // TODO: Add reviews to backend
    featured: apiProduct.status === 'approved' && apiProduct.is_active,
    shipping: {
      free: true, // Default for now
      days: 5,
    },
    // 3D Model support (Phase 4) - Temporary fallback for all products
    model_3d_url: apiProduct.model_3d_url || 'https://jewelry-backend-main-wj7bry.laravel.cloud/jewelry.glb',
    model_3d_type: apiProduct.model_3d_type || 'glb',
    videos: videos,
    // Seller info
    seller: apiProduct.seller ? {
      id: apiProduct.seller.id,
      name: apiProduct.seller.name,
    } : undefined,
  };
}

// Calculate discount percentage
function calculateDiscount(basePrice?: number, currentPrice?: number): number | undefined {
  if (!basePrice || !currentPrice || basePrice === currentPrice) {
    return undefined;
  }
  return Math.round(((basePrice - currentPrice) / basePrice) * 100);
}

// Auth API
export const authApi = {
  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiCall<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  // Register
  register: async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    phone?: string,
    role: 'buyer' | 'seller' = 'buyer',
    avatar_url?: string
  ): Promise<RegisterResponse> => {
    const response = await apiCall<RegisterResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation,
        phone,
        role,
        avatar_url,
      }),
    });
    return response;
  },

  // Logout
  logout: async (token: string): Promise<void> => {
    await apiCall<void>('/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get current user
  getMe: async (token: string): Promise<User> => {
    const response = await apiCall<{ user: User }>('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.user;
  },

  // Refresh token
  refresh: async (token: string): Promise<LoginResponse> => {
    const response = await apiCall<LoginResponse>('/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  },
};

// Q&A Message API
export interface QAMessage {
  id: number;
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
}

export const messageApi = {
  getBySeller: async (sellerId: number, token?: string): Promise<QAMessage[]> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return await apiCall<QAMessage[]>(`/messages?seller_id=${sellerId}`, {
      headers,
    });
  },

  // Get all messages for the current user (when they are the seller)
  getMyMessages: async (token: string): Promise<QAMessage[]> => {
    return await apiCall<QAMessage[]>('/messages/my-questions', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  createQuestion: async (token: string, toUserId: number, question: string): Promise<QAMessage> => {
    return await apiCall<QAMessage>('/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to_user_id: toUserId, question }),
    });
  },

  answerQuestion: async (token: string, messageId: number, answer: string): Promise<QAMessage> => {
    return await apiCall<QAMessage>(`/messages/${messageId}/answer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answer }),
    });
  },

  delete: async (token: string, messageId: number): Promise<void> => {
    await apiCall<void>(`/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Cart API
export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  price_at_time_of_add: number;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  cart: Cart;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export const cartApi = {
  getCart: async (token: string): Promise<CartResponse> => {
    const response = await apiCall<CartResponse>('/cart', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Transform product data in cart items
    if (response.cart && response.cart.items) {
      response.cart.items = response.cart.items.map(item => ({
        ...item,
        product: item.product ? transformProduct(item.product) : undefined,
      }));
    }

    return response;
  },

  addItem: async (token: string, productId: number, quantity: number = 1): Promise<{ message: string; cart: Cart }> => {
    return await apiCall<{ message: string; cart: Cart }>('/cart/add-item', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  updateItem: async (token: string, itemId: number, quantity: number): Promise<{ message: string; cart: Cart }> => {
    return await apiCall<{ message: string; cart: Cart }>(`/cart/update-item/${itemId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
  },

  removeItem: async (token: string, itemId: number): Promise<{ message: string; cart: Cart }> => {
    return await apiCall<{ message: string; cart: Cart }>(`/cart/remove-item/${itemId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  clearCart: async (token: string): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>('/cart/clear', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Order API
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface RingCustomization {
  id: number;
  size?: number;
  size_1?: number;
  size_2?: number;
  name_1?: string;
  name_2?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  ring_customization_id?: number;
  product?: Product;
  ringCustomization?: RingCustomization;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  buyer_id: number;
  status: 'pending' | 'confirmed' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  tax_amount: number;
  shipping_amount: number;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  cancellation_reason?: string;
  paid_at?: string;
  accepted_at?: string;
  shipped_at?: string;
  items: OrderItem[];
  payment?: Payment;
  buyer?: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  gateway_response?: any;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  shipping_address: ShippingAddress;
  payment_method: 'pix' | 'credit_card' | 'boleto';
  cart_item_ids?: number[]; // Optional: specific cart item IDs to include in order
}

export const orderApi = {
  getOrders: async (token: string): Promise<{ data: Order[] }> => {
    const response = await apiCall<{ data: Order[] }>('/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Transform product data in order items
    if (response.data) {
      response.data = response.data.map(order => ({
        ...order,
        items: order.items?.map(item => ({
          ...item,
          product: item.product ? transformProduct(item.product as any) : undefined,
        })) || [],
      }));
    }

    return response;
  },

  getOrderById: async (token: string, id: number): Promise<Order> => {
    const order = await apiCall<Order>(`/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Transform product data in order items
    if (order.items) {
      order.items = order.items.map(item => ({
        ...item,
        product: item.product ? transformProduct(item.product as any) : undefined,
      }));
    }

    return order;
  },

  createOrder: async (token: string, orderData: CreateOrderData): Promise<{ message: string; order: Order; payment: Payment }> => {
    return await apiCall<{ message: string; order: Order; payment: Payment }>('/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
  },

  cancelOrder: async (token: string, id: number): Promise<{ message: string; order: Order }> => {
    return await apiCall<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  confirmDelivery: async (token: string, id: number): Promise<{ message: string; order: Order }> => {
    return await apiCall<{ message: string; order: Order }>(`/orders/${id}/confirm-delivery`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Shipping API
export interface ShippingEstimate {
  success: boolean;
  shipping_cost: number;
  estimated_days: number;
  carrier: string;
  error?: string;
}

export const shippingApi = {
  getEstimate: async (
    token: string,
    postalCode: string,
    cartItemIds?: number[]
  ): Promise<ShippingEstimate> => {
    return await apiCall<ShippingEstimate>('/shipping/estimate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        postal_code: postalCode,
        cart_item_ids: cartItemIds,
      }),
    });
  },
};

// Payment API - Destination Charges (per-seller payments)
export interface CardDetails {
  card_number: string;
  expiration_month: string;
  expiration_year: string;
  security_code: string;
  cardholder_name: string;
  cardholder_document?: string; // CPF
}

export interface SellerPayment {
  payment_id: number;
  seller_id: number;
  seller_name: string;
  amount: number;
  application_fee: number;
  status: 'pending' | 'completed' | 'failed';
  pix_qr_code?: string;
  pix_qr_code_base64?: string;
  init_point?: string;
}

export interface PaymentIntentResponse {
  order_id: number;
  status: 'pending' | 'completed' | 'partial_failure';
  payment_method: 'credit_card' | 'pix';
  payments: SellerPayment[];
  total_amount: number;
}

export interface OrderPaymentStatus {
  order_id: number;
  order_status: string;
  payments: {
    id: number;
    seller_id: number;
    seller_name: string;
    amount: number;
    application_fee: number;
    status: string;
    payment_method: string;
    paid_at: string | null;
  }[];
  all_completed: boolean;
}

export const paymentApi = {
  // Create payment intent with destination charges (per-seller)
  createPaymentIntent: async (
    token: string,
    orderId: number,
    paymentMethod: 'credit_card' | 'pix',
    cardDetails?: CardDetails
  ): Promise<PaymentIntentResponse> => {
    const body: any = {
      order_id: orderId,
      payment_method: paymentMethod,
    };

    if (paymentMethod === 'credit_card' && cardDetails) {
      body.card_number = cardDetails.card_number;
      body.expiration_month = cardDetails.expiration_month;
      body.expiration_year = cardDetails.expiration_year;
      body.security_code = cardDetails.security_code;
      body.cardholder_name = cardDetails.cardholder_name;
      body.cardholder_document = cardDetails.cardholder_document;
    }

    return await apiCall<PaymentIntentResponse>('/payments/create-intent', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  },

  // Get payment status for an order (shows all per-seller payments)
  getOrderPaymentStatus: async (token: string, orderId: number): Promise<OrderPaymentStatus> => {
    return await apiCall<OrderPaymentStatus>(`/payments/order/${orderId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Retry a failed payment
  retryPayment: async (token: string, paymentId: number): Promise<{ message: string; payment_id: number; order_id: number }> => {
    return await apiCall<{ message: string; payment_id: number; order_id: number }>(`/payments/${paymentId}/retry`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Refund Request API
export type RefundReason = 'defective_product' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'late_delivery' | 'other';

export interface RefundRequest {
  id: number;
  payment_id: number;
  order_number: string | null;
  seller_name: string;
  amount: number;
  reason: RefundReason;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  seller_response: string | null;
  responded_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface SellerRefundRequest extends RefundRequest {
  buyer_name: string;
  buyer_email: string | null;
  application_fee: number;
  return_platform_fee: boolean;
}

export const refundApi = {
  // Buyer: Get my refund requests
  getMyRefunds: async (token: string): Promise<{ refund_requests: RefundRequest[] }> => {
    return await apiCall<{ refund_requests: RefundRequest[] }>('/refunds', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Buyer: Create a refund request
  createRefundRequest: async (
    token: string,
    paymentId: number,
    reason: RefundReason,
    description?: string
  ): Promise<{ message: string; refund_request: RefundRequest }> => {
    return await apiCall<{ message: string; refund_request: RefundRequest }>('/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ payment_id: paymentId, reason, description }),
    });
  },

  // Seller: Get refund requests for my payments
  getSellerRefunds: async (token: string): Promise<{ refund_requests: SellerRefundRequest[] }> => {
    return await apiCall<{ refund_requests: SellerRefundRequest[] }>('/seller/refunds', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Seller: Approve a refund request
  approveRefund: async (
    token: string,
    refundId: number,
    response?: string
  ): Promise<{ message: string; refund_request: SellerRefundRequest }> => {
    return await apiCall<{ message: string; refund_request: SellerRefundRequest }>(`/seller/refunds/${refundId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ response }),
    });
  },

  // Seller: Reject a refund request
  rejectRefund: async (
    token: string,
    refundId: number,
    response: string
  ): Promise<{ message: string; refund_request: SellerRefundRequest }> => {
    return await apiCall<{ message: string; refund_request: SellerRefundRequest }>(`/seller/refunds/${refundId}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ response }),
    });
  },
};

// Seller API
export interface SellerDashboard {
  analytics: {
    products: {
      total: number;
      approved: number;
      pending: number;
      rejected: number;
    };
    orders: {
      total: number;
      revenue: number;
      by_status: Record<string, number>;
    };
  };
  recent_products: any[];
  recent_orders: any[];
}

export interface SellerAnalytics {
  sales_by_product: any[];
  revenue_by_month: any[];
}

export const sellerApi = {
  // Get seller dashboard data
  getDashboard: async (token: string): Promise<SellerDashboard> => {
    return await apiCall<SellerDashboard>('/seller/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get seller analytics
  getAnalytics: async (token: string): Promise<SellerAnalytics> => {
    return await apiCall<SellerAnalytics>('/seller/analytics', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get seller's products with filtering
  getProducts: async (
    token: string,
    filters?: {
      status?: string;
      is_active?: boolean;
      search?: string;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/seller/products?${queryString}` : '/seller/products';

    return await apiCall<any>(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get seller's orders
  getOrders: async (
    token: string,
    filters?: {
      status?: string;
      sort_by?: string;
      sort_order?: string;
    }
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.sort_order) params.append('sort_order', filters.sort_order);

    const queryString = params.toString();
    const endpoint = queryString ? `/seller/orders?${queryString}` : '/seller/orders';

    const response = await apiCall<any>(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Transform product data in order items
    if (response.data) {
      response.data = response.data.map((order: any) => ({
        ...order,
        items: order.items?.map((item: any) => ({
          ...item,
          product: item.product ? transformProduct(item.product) : undefined,
        })) || [],
      }));
    }

    return response;
  },

  // Accept order
  acceptOrder: async (
    token: string,
    orderId: number
  ): Promise<{ message: string; order: any }> => {
    return await apiCall<{ message: string; order: any }>(`/seller/orders/${orderId}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Reject order
  rejectOrder: async (
    token: string,
    orderId: number,
    reason: string
  ): Promise<{ message: string; order: any }> => {
    return await apiCall<{ message: string; order: any }>(`/seller/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
  },

  // Mark order as shipped
  markAsShipped: async (
    token: string,
    orderId: number,
    trackingNumber: string
  ): Promise<{ message: string; order: any }> => {
    return await apiCall<{ message: string; order: any }>(`/seller/orders/${orderId}/ship`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tracking_number: trackingNumber }),
    });
  },

  // Get Mercado Pago OAuth URL (works for both sandbox and production modes)
  getMercadoPagoOAuthUrl: async (token: string): Promise<{ mode: string; oauth_url: string }> => {
    return await apiCall<{ mode: string; oauth_url: string }>('/seller/mercadopago/oauth-url', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get Mercado Pago connection status
  getMercadoPagoStatus: async (token: string): Promise<{ connected: boolean; user_id: string | null }> => {
    return await apiCall<{ connected: boolean; user_id: string | null }>('/seller/mercadopago/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Disconnect Mercado Pago account
  disconnectMercadoPago: async (token: string): Promise<{ message: string }> => {
    return await apiCall<{ message: string }>('/seller/mercadopago/disconnect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Gold Price API
export interface GoldPriceData {
  price: number;
  price_24k: number;
  price_22k: number;
  price_21k: number;
  price_20k: number;
  price_18k: number;
  price_16k: number;
  price_14k: number;
  price_10k: number;
  source: string;
  updated_at: string;
}

export const goldPriceApi = {
  getCurrentPrice: async (): Promise<{ success: boolean; data: GoldPriceData }> => {
    return await apiCall<{ success: boolean; data: GoldPriceData }>('/gold-price/current');
  },
};

export const uploadApi = {
  // Upload avatar (public - no authentication required)
  uploadAvatar: async (file: { uri: string; type: string; name: string }): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file as any);

    const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        throw new Error(`Upload failed: ${response.status} - ${text.substring(0, 100)}`);
      }
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  },

  uploadFile: async (token: string, file: { uri: string; type: string; name: string }, fileType: 'image' | 'video' | '3d_model'): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file as any);
    formData.append('type', fileType);

    const headers: Record<string, string> = {};
    // Only add Authorization header if token is provided
    if (token && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/upload/r2`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let error;
      try {
        error = JSON.parse(text);
      } catch {
        throw new Error(`Upload failed: ${response.status} - ${text.substring(0, 100)}`);
      }
      throw new Error(error.message || 'Upload failed');
    }

    return await response.json();
  },
  deleteFile: async (token: string, key: string): Promise<void> => {
    await apiCall(`/upload/r2/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};

export default {
  productApi,
  authApi,
  messageApi,
  cartApi,
  orderApi,
  paymentApi,
  refundApi,
  sellerApi,
  goldPriceApi,
  uploadApi,
};
