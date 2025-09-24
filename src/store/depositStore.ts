import { create } from 'zustand';
import { Deposit, StockEntry } from '@/types';
import { dataProvider } from '@/services/dataProvider';

interface DepositState {
  deposits: Deposit[];
  activeDeposit: Deposit | null;
  stock: StockEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDeposits: () => Promise<void>;
  createDeposit: (deposit: Omit<Deposit, 'id' | 'fechaCreacion'>) => Promise<void>;
  updateDeposit: (id: string, deposit: Partial<Deposit>) => Promise<void>;
  setActiveDeposit: (deposit: Deposit) => void;
  fetchStock: (depositId: string) => Promise<void>;
  adjustStock: (productId: string, cantidad: number, tipo: 'entrada' | 'ajuste', motivo?: string) => Promise<void>;
}

export const useDepositStore = create<DepositState>((set, get) => ({
  deposits: [],
  activeDeposit: null,
  stock: [],
  isLoading: false,
  error: null,

  fetchDeposits: async () => {
    set({ isLoading: true, error: null });
    try {
      const deposits = await dataProvider.getDeposits();
      const active = deposits.find(d => d.activo) || deposits[0] || null;
      set({ deposits, activeDeposit: active, isLoading: false });
      
      if (active) {
        await get().fetchStock(active.id);
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error cargando depósitos', 
        isLoading: false 
      });
    }
  },

  createDeposit: async (deposit) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.createDeposit(deposit);
      await get().fetchDeposits();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error creando depósito', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateDeposit: async (id, deposit) => {
    set({ isLoading: true, error: null });
    try {
      await dataProvider.updateDeposit(id, deposit);
      await get().fetchDeposits();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error actualizando depósito', 
        isLoading: false 
      });
      throw error;
    }
  },

  setActiveDeposit: (deposit) => {
    set({ activeDeposit: deposit });
    if (deposit) {
      get().fetchStock(deposit.id);
    }
  },

  fetchStock: async (depositId) => {
    try {
      const stock = await dataProvider.getStock(depositId);
      set({ stock });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error cargando stock', 
      });
    }
  },

  adjustStock: async (productId, cantidad, tipo, motivo = '') => {
    const { activeDeposit } = get();
    if (!activeDeposit) return;
    
    set({ isLoading: true, error: null });
    try {
      await dataProvider.adjustStock(activeDeposit.id, productId, cantidad, tipo);
      
      // Registrar movimiento
      const movements = JSON.parse(localStorage.getItem('scanix:stock_movs') || '[]');
      movements.push({
        id: `MOV${String(movements.length + 1).padStart(6, '0')}`,
        depositoId: activeDeposit.id,
        productId,
        tipo,
        cantidad: tipo === 'entrada' ? cantidad : cantidad - (get().stock.find(s => s.productId === productId)?.cantidad || 0),
        fechaISO: new Date().toISOString(),
        motivo,
      });
      localStorage.setItem('scanix:stock_movs', JSON.stringify(movements));
      
      await get().fetchStock(activeDeposit.id);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error ajustando stock', 
        isLoading: false 
      });
      throw error;
    }
  },
}));