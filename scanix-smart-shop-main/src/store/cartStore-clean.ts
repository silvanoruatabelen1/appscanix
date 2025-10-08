import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartLine } from '@/types';
import { dataProvider } from '@/services/dataProvider';
import { mockProductCatalog } from '@/services/mockData';

// Funciones auxiliares para cálculo de precios
function priceForQty(product: any, qty: number): number {
  if (!product.tiers || product.tiers.length === 0) {
    return product.precioBase;
  }
  
  // Ordenar tiers por cantidad mínima
  const sortedTiers = [...product.tiers].sort((a, b) => a.minQty - b.minQty);
  
  // Encontrar el tier aplicable
  for (const tier of sortedTiers) {
    if (qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty)) {
      return tier.precio;
    }
  }
  
  return product.precioBase;
}

function computeSubtotal(qty: number, precio: number): number {
  return qty * precio;
}

function computeTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotal, 0);
}

interface CartState {
  lines: CartLine[];
  total: number;
  depositoId: string;
  
  // Actions
  addManualLine: (input: string) => Promise<boolean>;
  updateQty: (sku: string, qty: number) => Promise<void>;
  removeLine: (sku: string) => void;
  clear: () => void;
  setDepositoId: (id: string) => void;
  refreshPricing: () => Promise<void>;
  
  // Nuevas funciones de gestión
  incrementQty: (sku: string) => Promise<void>;
  decrementQty: (sku: string) => void;
  setQty: (sku: string, qty: number) => Promise<void>;
  getLineBySku: (sku: string) => CartLine | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      total: 0,
      depositoId: 'DEP001', // Depósito por defecto

      addManualLine: async (input: string) => {
        const { lines } = get();
        
        // Buscar producto por SKU o nombre
        const product = mockProductCatalog.find(p => 
          p.sku.toLowerCase() === input.toLowerCase() || 
          p.nombre.toLowerCase().includes(input.toLowerCase())
        );
        
        if (!product) {
          return false;
        }
        
        // Obtener tiers de precio
        const { tiers } = await dataProvider.getPricingTiers(product.productId);
        const productWithTiers = { ...product, tiers };
        
        // Buscar si ya existe la línea
        const existingIndex = lines.findIndex(l => l.sku === product.sku);
        
        if (existingIndex >= 0) {
          // Incrementar cantidad
          await get().updateQty(product.sku, lines[existingIndex].qty + 1);
        } else {
          // Nueva línea
          const precioAplicado = priceForQty(productWithTiers, 1);
          const subtotal = computeSubtotal(1, precioAplicado);
          
          const newLine: CartLine = {
            productId: product.productId,
            sku: product.sku,
            nombre: product.nombre,
            qty: 1,
            precioAplicado,
            subtotal,
          };
          
          set(state => ({
            lines: [...state.lines, newLine]
          }));
        }
        
        await get().refreshPricing();
        return true;
      },

      updateQty: async (sku: string, qty: number) => {
        const { lines } = get();
        const lineIndex = lines.findIndex(l => l.sku === sku);
        
        if (lineIndex === -1) return;
        
        const line = lines[lineIndex];
        const product = mockProductCatalog.find(p => p.productId === line.productId);
        
        if (!product) return;
        
        // Obtener tiers de precio
        const { tiers } = await dataProvider.getPricingTiers(product.productId);
        const productWithTiers = { ...product, tiers };
        
        const precioAplicado = priceForQty(productWithTiers, qty);
        const subtotal = computeSubtotal(qty, precioAplicado);
        
        const newLines = [...lines];
        newLines[lineIndex] = {
          ...line,
          qty,
          precioAplicado,
          subtotal,
        };
        
        set({ lines: newLines });
        await get().refreshPricing();
      },

      removeLine: (sku: string) => {
        set(state => ({
          lines: state.lines.filter(l => l.sku !== sku)
        }));
        get().refreshPricing();
      },

      clear: () => {
        set({ lines: [], total: 0 });
      },

      setDepositoId: (id: string) => {
        set({ depositoId: id });
      },

      refreshPricing: async () => {
        const { lines } = get();
        if (lines.length === 0) {
          set({ total: 0 });
          return;
        }
        
        const newLines = [...lines];
        
        for (let i = 0; i < newLines.length; i++) {
          const line = newLines[i];
          const product = mockProductCatalog.find(p => p.productId === line.productId);
          
          if (!product) continue;
          
          // Obtener tiers de precio
          const { tiers } = await dataProvider.getPricingTiers(product.productId);
          const productWithTiers = { ...product, tiers };
          
          const precioAplicado = priceForQty(productWithTiers, line.qty);
          const subtotal = computeSubtotal(line.qty, precioAplicado);
          
          newLines[i] = {
            ...line,
            precioAplicado,
            subtotal,
          };
        }
        
        const total = computeTotal(newLines);
        set({ lines: newLines, total });
      },

      // Nuevas funciones de gestión
      incrementQty: async (sku: string) => {
        const { lines } = get();
        const line = lines.find(l => l.sku === sku);
        if (line) {
          await get().updateQty(sku, line.qty + 1);
        }
      },

      decrementQty: (sku: string) => {
        const { lines } = get();
        const line = lines.find(l => l.sku === sku);
        if (line && line.qty > 1) {
          get().updateQty(sku, line.qty - 1);
        } else if (line && line.qty === 1) {
          get().removeLine(sku);
        }
      },

      setQty: async (sku: string, qty: number) => {
        if (qty <= 0) {
          get().removeLine(sku);
        } else {
          await get().updateQty(sku, qty);
        }
      },

      getLineBySku: (sku: string) => {
        const { lines } = get();
        return lines.find(l => l.sku === sku);
      },
    }),
    {
      name: 'scanix:cart',
      partialize: (state) => ({
        lines: state.lines,
        total: state.total,
        depositoId: state.depositoId,
      }),
    }
  )
);
