// Store global del carrito usando Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartLine, RecognizedItem } from '@/types';
import { priceForQty, computeSubtotal, computeTotal } from '@/domain/pricing';
import { dataProvider } from '@/services/dataProvider';
import { mockProductCatalog, findProductBySku, findProductByName } from '@/services/mockData';

interface CartState {
  lines: CartLine[];
  total: number;
  depositoId: string;
  
  // Actions
  addLinesFromRecognition: (items: RecognizedItem[]) => Promise<void>;
  addManualLine: (input: string) => Promise<boolean>;
  updateQty: (sku: string, qty: number) => Promise<void>;
  removeLine: (sku: string) => void;
  clear: () => void;
  setDepositoId: (id: string) => void;
  refreshPricing: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      total: 0,
      depositoId: 'DEP001', // Depósito por defecto

      addLinesFromRecognition: async (items: RecognizedItem[]) => {
        const { lines } = get();
        const newLines = [...lines];

        for (const item of items) {
          // Obtener tiers de precio
          const { tiers } = await dataProvider.getPricingTiers(item.productId);
          const product = mockProductCatalog.find(p => p.productId === item.productId);
          
          if (!product) continue;

          const productWithTiers = { ...product, tiers };
          
          // Buscar si ya existe la línea
          const existingIndex = newLines.findIndex(l => l.sku === item.sku);
          
          if (existingIndex >= 0) {
            // Merge: sumar cantidades
            const newQty = Math.min(newLines[existingIndex].qty + item.qty, 999);
            const precioAplicado = priceForQty(productWithTiers, newQty);
            const subtotal = computeSubtotal(newQty, precioAplicado);
            
            newLines[existingIndex] = {
              ...newLines[existingIndex],
              qty: newQty,
              precioAplicado,
              subtotal,
            };
          } else {
            // Nueva línea
            const precioAplicado = priceForQty(productWithTiers, item.qty);
            const subtotal = computeSubtotal(item.qty, precioAplicado);
            
            newLines.push({
              productId: item.productId,
              sku: item.sku,
              nombre: item.nombre,
              qty: item.qty,
              precioAplicado,
              subtotal,
            });
          }
        }

        const total = computeTotal(newLines);
        set({ lines: newLines, total });
      },

      addManualLine: async (input: string) => {
        // Buscar por SKU o nombre
        let product = findProductBySku(input) || findProductByName(input);
        
        if (!product) {
          return false;
        }

        const { lines } = get();
        const newLines = [...lines];
        
        // Obtener tiers
        const { tiers } = await dataProvider.getPricingTiers(product.productId);
        const productWithTiers = { ...product, tiers };
        
        const existingIndex = newLines.findIndex(l => l.sku === product!.sku);
        
        if (existingIndex >= 0) {
          // Ya existe, incrementar qty
          const newQty = Math.min(newLines[existingIndex].qty + 1, 999);
          const precioAplicado = priceForQty(productWithTiers, newQty);
          const subtotal = computeSubtotal(newQty, precioAplicado);
          
          newLines[existingIndex] = {
            ...newLines[existingIndex],
            qty: newQty,
            precioAplicado,
            subtotal,
          };
        } else {
          // Nueva línea con qty = 1
          const precioAplicado = priceForQty(productWithTiers, 1);
          const subtotal = computeSubtotal(1, precioAplicado);
          
          newLines.push({
            productId: product.productId,
            sku: product.sku,
            nombre: product.nombre,
            qty: 1,
            precioAplicado,
            subtotal,
          });
        }

        const total = computeTotal(newLines);
        set({ lines: newLines, total });
        return true;
      },

      updateQty: async (sku: string, qty: number) => {
        if (qty < 0 || qty > 999) return;
        
        const { lines } = get();
        const newLines = [...lines];
        const index = newLines.findIndex(l => l.sku === sku);
        
        if (index < 0) return;
        
        if (qty === 0) {
          // Eliminar línea
          newLines.splice(index, 1);
        } else {
          // Actualizar qty y recalcular precio
          const product = mockProductCatalog.find(p => p.productId === newLines[index].productId);
          if (!product) return;
          
          const { tiers } = await dataProvider.getPricingTiers(product.productId);
          const productWithTiers = { ...product, tiers };
          
          const precioAplicado = priceForQty(productWithTiers, qty);
          const subtotal = computeSubtotal(qty, precioAplicado);
          
          newLines[index] = {
            ...newLines[index],
            qty,
            precioAplicado,
            subtotal,
          };
        }

        const total = computeTotal(newLines);
        set({ lines: newLines, total });
      },

      removeLine: (sku: string) => {
        const { lines } = get();
        const newLines = lines.filter(l => l.sku !== sku);
        const total = computeTotal(newLines);
        set({ lines: newLines, total });
      },

      clear: () => {
        set({ lines: [], total: 0 });
      },

      setDepositoId: (id: string) => {
        set({ depositoId: id });
      },

      refreshPricing: async () => {
        const { lines } = get();
        const newLines = [...lines];
        
        for (let i = 0; i < newLines.length; i++) {
          const line = newLines[i];
          const product = mockProductCatalog.find(p => p.productId === line.productId);
          
          if (!product) continue;
          
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