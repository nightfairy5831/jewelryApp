import { create } from 'zustand';
import { filterTree, type FilterConfig } from '../data/filterConfig';
import type { Product } from '../data/products';
import type { Review } from '../data/reviews';
import type { Notification } from '../data/notifications';
import { productApi, authApi, cartApi, orderApi, type User, type CartResponse, type Order } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CatalogMode = 'browse' | 'detail';

interface AppState {
  // Auth State - ULTRA SIMPLIFIED: Only token!
  authToken: string | null;
  isAuthLoading: boolean;

  // App State
  products: Product[];
  reviews: Review[];
  notifications: Notification[];
  followedUsers: string[];
  likedReviews: string[];
  savedProducts: string[];
  isLoading: boolean;
  error: string | null;

  // Phase 5: Shopping & Payments State
  cart: CartResponse | null;
  cartItemsCount: number;
  orders: Order[];

  // Catalog State
  catalogMode: CatalogMode;
  currentProductIndex: number;
  selectedFilters: string[];
  currentFilterSet: FilterConfig[];
  filteredProducts: Product[];
  selectedMediaIndex: number;

  // Auth Actions
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string, phone?: string, role?: 'buyer' | 'seller', avatar_url?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAuthToken: (token: string) => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; avatar_url?: string }) => Promise<void>;

  // Actions
  toggleFollow: (userId: string) => void;
  toggleLike: (reviewId: string) => void;
  toggleSave: (productId: string) => void;
  loadProducts: () => Promise<void>;

  // Catalog Actions
  setCatalogMode: (mode: CatalogMode) => void;
  nextProduct: () => void;
  previousProduct: () => void;
  selectFilter: (filterId: string) => void;
  goBackFilter: () => void;
  resetFilters: () => void;
  setSelectedMediaIndex: (index: number) => void;

  // Phase 5: Shopping & Payments Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number, clearFirst?: boolean) => Promise<void>;
  updateCartQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchOrders: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth initial state - ULTRA SIMPLIFIED
  authToken: null,
  isAuthLoading: false,

  // App initial state
  products: [],
  reviews: [],
  notifications: [],
  followedUsers: [],
  likedReviews: [],
  savedProducts: [],
  isLoading: true,
  error: null,

  // Phase 5 initial state
  cart: null,
  cartItemsCount: 0,
  orders: [],

  // Catalog initial state
  catalogMode: 'browse',
  currentProductIndex: 0,
  selectedFilters: [],
  currentFilterSet: filterTree.root,
  filteredProducts: [],
  selectedMediaIndex: 0,

  // Auth actions
  login: async (email, password, remember = false) => {
    set({ isAuthLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);

      // Store token AND user data
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.user));
      if (remember) {
        await AsyncStorage.setItem('rememberMe', 'true');
      }

      set({
        authToken: response.token,
        isAuthLoading: false,
      });
    } catch (error: any) {
      set({ isAuthLoading: false, error: error.message });
      throw error;
    }
  },

  register: async (name, email, password, passwordConfirmation, phone, role = 'buyer', avatar_url) => {
    set({ isAuthLoading: true, error: null });
    try {
      await authApi.register(name, email, password, passwordConfirmation, phone, role, avatar_url);

      // Don't store token or log in automatically
      // User needs to log in after registration (sellers need approval)
      set({ isAuthLoading: false });
    } catch (error: any) {
      set({ isAuthLoading: false, error: error.message });
      throw error;
    }
  },

  logout: async () => {
    const { authToken } = get();

    // Clear local state first to ensure immediate UI update
    set({
      authToken: null,
      cart: null,
      cartItemsCount: 0,
      orders: [],
      isAuthLoading: false,
      error: null,
    });

    // Clear AsyncStorage
    await AsyncStorage.multiRemove(['authToken', 'currentUser', 'rememberMe']);

    // Invalidate token on server (non-blocking, fire-and-forget with timeout)
    if (authToken) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        );
        await Promise.race([authApi.logout(authToken), timeoutPromise]);
      } catch (error) {
        // Silently ignore - token is already cleared locally
        console.log('Server logout skipped:', error);
      }
    }
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        set({ authToken: token });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  },

  setAuthToken: async (token: string) => {
    await AsyncStorage.setItem('authToken', token);
    set({ authToken: token });
  },

  updateProfile: async (data) => {
    const { authToken } = get();
    if (!authToken) throw new Error('Not authenticated');
    const response = await authApi.updateProfile(authToken, data);
    await AsyncStorage.setItem('authToken', response.token);
    set({ authToken: response.token });
  },

  // Load products from API - PRODUCTION DATA ONLY
  loadProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productApi.getAll();

      const productsWithMedia = products.map((p) => {
        return {
          ...p,
          images: p.images?.slice(0, 3) || [],
          videos: p.videos?.length > 0 ? p.videos : [],
          model_3d_url: p.model_3d_url || null,
        };
      });

      set({
        products: productsWithMedia,
        filteredProducts: productsWithMedia,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Failed to load products:', error);

      // Check if it's an auth error - clear invalid token
      if (error.message?.includes('Invalid credentials') ||
          error.message?.includes('Unauthenticated') ||
          error.message?.includes('Session expired')) {
        console.log('🔑 Token invalid, clearing auth...');
        await get().logout(); // Clear auth data
      }

      set({
        isLoading: false,
        error: 'Failed to load products. Please check your connection.'
      });
    }
  },

  toggleFollow: (userId) =>
    set((state) => ({
      followedUsers: state.followedUsers.includes(userId)
        ? state.followedUsers.filter((id) => id !== userId)
        : [...state.followedUsers, userId],
    })),

  toggleLike: (reviewId) =>
    set((state) => ({
      likedReviews: state.likedReviews.includes(reviewId)
        ? state.likedReviews.filter((id) => id !== reviewId)
        : [...state.likedReviews, reviewId],
    })),

  toggleSave: (productId) =>
    set((state) => ({
      savedProducts: state.savedProducts.includes(productId)
        ? state.savedProducts.filter((id) => id !== productId)
        : [...state.savedProducts, productId],
    })),

  // Catalog actions
  setCatalogMode: (mode) => set({ catalogMode: mode }),

  nextProduct: () =>
    set((state) => ({
      currentProductIndex:
        state.currentProductIndex < state.filteredProducts.length - 1
          ? state.currentProductIndex + 1
          : 0, // Loop back to first product
    })),

  previousProduct: () =>
    set((state) => ({
      currentProductIndex:
        state.currentProductIndex > 0
          ? state.currentProductIndex - 1
          : state.filteredProducts.length - 1, // Loop to last product
    })),

  selectFilter: (filterId) =>
    set((state) => {
      // Check if this filter has sub-filters (parent category)
      const hasSubFilters = filterTree[filterId] && filterTree[filterId].length > 0;

      if (hasSubFilters) {
        // Parent category: Navigate to subcategory view AND filter by parent category
        const newSelectedFilters = [...state.selectedFilters, filterId];
        const newFilterSet = filterTree[filterId];

        // Filter products by parent category (exact match)
        const filtered = state.products.filter((product) => {
          return product.category === filterId;
        });

        return {
          selectedFilters: newSelectedFilters,
          currentFilterSet: newFilterSet,
          filteredProducts: filtered,
          currentProductIndex: 0,
        };
      } else {
        // Subcategory (leaf node): Filter products by parent category AND subcategory
        const parentCategory = state.selectedFilters[state.selectedFilters.length - 1];

        const filtered = state.products.filter((product) => {
          const categoryMatch = product.category === parentCategory;
          const subcategoryMatch = product.subcategory === filterId;
          return categoryMatch && subcategoryMatch;
        });

        return {
          filteredProducts: filtered,
          currentProductIndex: 0,
        };
      }
    }),

  goBackFilter: () =>
    set((state) => {
      if (state.selectedFilters.length === 0) return state;

      const newSelectedFilters = state.selectedFilters.slice(0, -1);
      const lastFilter =
        newSelectedFilters[newSelectedFilters.length - 1] || 'root';
      const newFilterSet = filterTree[lastFilter] || filterTree.root;

      return {
        selectedFilters: newSelectedFilters,
        currentFilterSet: newFilterSet,
        filteredProducts: state.products,
        currentProductIndex: 0,
      };
    }),

  resetFilters: () =>
    set((state) => ({
      selectedFilters: [],
      currentFilterSet: filterTree.root,
      filteredProducts: state.products,
      currentProductIndex: 0,
    })),

  setSelectedMediaIndex: (index) => set({ selectedMediaIndex: index }),

  // Phase 5: Shopping & Payments Actions
  fetchCart: async () => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      const cartResponse = await cartApi.getCart(authToken);
      set({
        cart: cartResponse,
        cartItemsCount: cartResponse.cart.items.length,
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  },

  addToCart: async (productId, quantity = 1, clearFirst = false) => {
    const { authToken } = get();
    if (!authToken) throw new Error('Not authenticated');

    try {
      // Clear cart first if requested (for buy-now flow)
      if (clearFirst) {
        await get().clearCart();
      }

      await cartApi.addItem(authToken, productId, quantity);
      await get().fetchCart(); // Refresh cart
    } catch (error: any) {
      // If session expired, clear auth state
      if (error.message?.includes('Session expired')) {
        set({
          authToken: null,
        });
      }
      throw new Error(error.message || 'Failed to add to cart');
    }
  },

  updateCartQuantity: async (itemId, quantity) => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      await cartApi.updateItem(authToken, itemId, quantity);
      await get().fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
    }
  },

  removeFromCart: async (itemId) => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      await cartApi.removeItem(authToken, itemId);
      await get().fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  },

  clearCart: async () => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      await cartApi.clearCart(authToken);
      set({ cart: null, cartItemsCount: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  fetchOrders: async () => {
    const { authToken } = get();
    if (!authToken) return;

    try {
      const response = await orderApi.getOrders(authToken);
      set({ orders: response.data });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  },
}));
