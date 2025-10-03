import { create } from 'zustand';
import { Product, Tier } from '@/types';
import { dataProvider } from '@/services/dataProvider';

interface ProductState {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  searchTerm: string;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: (page?: number) => Promise<void>;
  setSearchTerm: (term: string) => void;
  createProduct: (product: Omit<Product, 'productId'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateProductTiers: (productId: string, tiers: Tier[]) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  totalProducts: 0,
  currentPage: 1,
  searchTerm: '',
  isLoading: false,
  error: null,

  fetchProducts: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { searchTerm } = get();
      const result = await dataProvider.getProducts(page, 10, searchTerm);
      set({ 
        products: result.products, 
        totalProducts: result.total,
        currentPage: page,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error cargando productos', 
        isLoading: false 
      });
    }
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  createProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.createProduct(product);
      await get().fetchProducts(get().currentPage);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error creando producto', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id, product) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.updateProduct(id, product);
      await get().fetchProducts(get().currentPage);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error actualizando producto', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.deleteProduct(id);
      await get().fetchProducts(get().currentPage);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error eliminando producto', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateProductTiers: async (productId, tiers) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.saveProductTiers(productId, tiers);
      await get().fetchProducts(get().currentPage);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error actualizando tiers', 
        isLoading: false 
      });
      throw error;
    }
  },
}));