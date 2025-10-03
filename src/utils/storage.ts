// Sistema de persistencia mejorado con fallbacks y validación
import { handleStorageError, logError, createAppError, ERROR_CODES } from './errorHandling';

// Claves de almacenamiento estandarizadas
export const STORAGE_KEYS = {
  CART: 'scanix:cart',
  TICKETS: 'scanix:tickets',
  PRODUCTS: 'scanix:products',
  DEPOSITS: 'scanix:deposits',
  TRANSFERS: 'scanix:transfers',
  STOCK_MOVEMENTS: 'scanix:stock_movs',
  SIDEBAR_STATE: 'scanix:sidebarOpen',
  TIERS: 'scanix:tiers',
  // Stock por depósito usa patrón: scanix:stock:{depositId}
  getStockKey: (depositId: string) => `scanix:stock:${depositId}`,
} as const;

/**
 * Interfaz para operaciones de almacenamiento
 */
interface StorageOperation<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Wrapper seguro para localStorage con manejo de errores
 */
export class SafeStorage {
  private static instance: SafeStorage;
  
  static getInstance(): SafeStorage {
    if (!SafeStorage.instance) {
      SafeStorage.instance = new SafeStorage();
    }
    return SafeStorage.instance;
  }

  /**
   * Obtener datos del localStorage con validación
   */
  get<T>(key: string, defaultValue?: T): StorageOperation<T> {
    try {
      const item = localStorage.getItem(key);
      
      if (item === null) {
        return {
          success: true,
          data: defaultValue
        };
      }

      const parsedData = JSON.parse(item);
      
      // Validación básica de integridad
      if (this.isValidData(parsedData)) {
        return {
          success: true,
          data: parsedData
        };
      } else {
        logError(createAppError(
          ERROR_CODES.DATA_CORRUPTION,
          `Datos corruptos en clave: ${key}`,
          { key, rawData: item }
        ));
        
        return {
          success: false,
          data: defaultValue,
          error: 'Datos corruptos'
        };
      }
      
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, `SafeStorage.get(${key})`);
      
      return {
        success: false,
        data: defaultValue,
        error: appError.message
      };
    }
  }

  /**
   * Guardar datos en localStorage con validación de espacio
   */
  set<T>(key: string, value: T): StorageOperation<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      // Verificar si hay espacio suficiente (aproximado)
      if (this.getStorageUsage() > 0.9) { // 90% del límite
        const appError = createAppError(
          ERROR_CODES.STORAGE_FULL,
          'Almacenamiento casi lleno',
          { usage: this.getStorageUsage(), key }
        );
        logError(appError);
        
        // Intentar limpiar datos antiguos
        this.cleanupOldData();
      }

      localStorage.setItem(key, serialized);
      
      return { success: true, data: true };
      
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, `SafeStorage.set(${key})`);
      
      return {
        success: false,
        data: false,
        error: appError.message
      };
    }
  }

  /**
   * Eliminar datos del localStorage
   */
  remove(key: string): StorageOperation<boolean> {
    try {
      localStorage.removeItem(key);
      return { success: true, data: true };
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, `SafeStorage.remove(${key})`);
      
      return {
        success: false,
        data: false,
        error: appError.message
      };
    }
  }

  /**
   * Limpiar todos los datos de SCANIX
   */
  clearAll(): StorageOperation<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS).filter(key => typeof key === 'string');
      
      for (const key of keys) {
        localStorage.removeItem(key as string);
      }
      
      // Limpiar claves de stock (patrón scanix:stock:*)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('scanix:stock:')) {
          localStorage.removeItem(key);
          i--; // Ajustar índice después de eliminar
        }
      }
      
      return { success: true, data: true };
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, 'SafeStorage.clearAll()');
      
      return {
        success: false,
        data: false,
        error: appError.message
      };
    }
  }

  /**
   * Obtener uso aproximado del localStorage (0.0 - 1.0)
   */
  private getStorageUsage(): number {
    try {
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // Límite aproximado de localStorage (5MB en la mayoría de navegadores)
      const maxSize = 5 * 1024 * 1024;
      return totalSize / maxSize;
    } catch {
      return 0.5; // Asumir 50% si no se puede calcular
    }
  }

  /**
   * Limpiar datos antiguos para liberar espacio
   */
  private cleanupOldData(): void {
    try {
      // Limpiar tickets antiguos (más de 30 días)
      const tickets = this.get(STORAGE_KEYS.TICKETS, []);
      if (tickets.success && tickets.data) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        const recentTickets = (tickets.data as any[]).filter((ticket: any) => {
          return new Date(ticket.fechaISO) > cutoffDate;
        });
        
        if (recentTickets.length < (tickets.data as any[]).length) {
          this.set(STORAGE_KEYS.TICKETS, recentTickets);
        }
      }

      // Limpiar movimientos de stock antiguos (más de 60 días)
      const movements = this.get(STORAGE_KEYS.STOCK_MOVEMENTS, []);
      if (movements.success && movements.data) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 60);
        
        const recentMovements = (movements.data as any[]).filter((movement: any) => {
          return new Date(movement.fechaISO) > cutoffDate;
        });
        
        if (recentMovements.length < (movements.data as any[]).length) {
          this.set(STORAGE_KEYS.STOCK_MOVEMENTS, recentMovements);
        }
      }
    } catch (error) {
      logError(handleStorageError(error), 'SafeStorage.cleanupOldData()');
    }
  }

  /**
   * Validar que los datos no estén corruptos
   */
  private isValidData(data: any): boolean {
    // Validaciones básicas
    if (data === null || data === undefined) {
      return false;
    }

    // Si es un array, verificar que tenga estructura válida
    if (Array.isArray(data)) {
      return data.every(item => 
        item && typeof item === 'object' && 
        (item.id || item.productId || item.sku) // Debe tener algún identificador
      );
    }

    // Si es un objeto, verificar que no esté vacío maliciosamente
    if (typeof data === 'object') {
      return Object.keys(data).length > 0;
    }

    return true;
  }

  /**
   * Exportar todos los datos para backup
   */
  exportData(): StorageOperation<Record<string, any>> {
    try {
      const exportData: Record<string, any> = {};
      
      // Exportar datos principales
      const mainKeys = Object.values(STORAGE_KEYS).filter(key => typeof key === 'string') as string[];
      
      for (const key of mainKeys) {
        const result = this.get(key);
        if (result.success && result.data !== undefined) {
          exportData[key] = result.data;
        }
      }
      
      // Exportar datos de stock
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('scanix:stock:')) {
          const result = this.get(key);
          if (result.success && result.data !== undefined) {
            exportData[key] = result.data;
          }
        }
      }
      
      return {
        success: true,
        data: {
          ...exportData,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        }
      };
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, 'SafeStorage.exportData()');
      
      return {
        success: false,
        error: appError.message
      };
    }
  }

  /**
   * Importar datos desde backup
   */
  importData(backupData: Record<string, any>): StorageOperation<boolean> {
    try {
      if (!backupData || typeof backupData !== 'object') {
        return {
          success: false,
          error: 'Datos de backup inválidos'
        };
      }

      // Validar versión si está disponible
      if (backupData.version && backupData.version !== '1.0') {
        return {
          success: false,
          error: 'Versión de backup no compatible'
        };
      }

      // Importar cada clave
      let importedCount = 0;
      for (const [key, value] of Object.entries(backupData)) {
        if (key.startsWith('scanix:') && key !== 'exportedAt' && key !== 'version') {
          const result = this.set(key, value);
          if (result.success) {
            importedCount++;
          }
        }
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      const appError = handleStorageError(error);
      logError(appError, 'SafeStorage.importData()');
      
      return {
        success: false,
        error: appError.message
      };
    }
  }
}

// Instancia singleton
export const safeStorage = SafeStorage.getInstance();

// Funciones de conveniencia para tipos específicos
export function getTickets(): any[] {
  const result = safeStorage.get(STORAGE_KEYS.TICKETS, []);
  return result.data || [];
}

export function saveTickets(tickets: any[]): boolean {
  const result = safeStorage.set(STORAGE_KEYS.TICKETS, tickets);
  return result.success;
}

export function getProducts(): any[] {
  const result = safeStorage.get(STORAGE_KEYS.PRODUCTS, []);
  return result.data || [];
}

export function saveProducts(products: any[]): boolean {
  const result = safeStorage.set(STORAGE_KEYS.PRODUCTS, products);
  return result.success;
}

export function getStock(depositId: string): Record<string, number> {
  const result = safeStorage.get(STORAGE_KEYS.getStockKey(depositId), {});
  return result.data || {};
}

export function saveStock(depositId: string, stock: Record<string, number>): boolean {
  const result = safeStorage.set(STORAGE_KEYS.getStockKey(depositId), stock);
  return result.success;
}
