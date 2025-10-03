// DTOs y tipos principales del sistema SCANIX

// Resultado del reconocimiento de productos por IA
export interface RecognizedItem {
  productId: string;
  sku: string;
  nombre: string;
  qty: number;
  confianza: number; // 0.0 - 1.0
}

// Tier de precios por cantidad
export interface Tier {
  min: number; // Cantidad mínima (>=1)
  max: number | null; // Cantidad máxima (null = sin límite)
  precio: number; // Precio por unidad (>0)
}

// Resultado de validación de imágenes
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[]; // Advertencias no bloqueantes
}

export interface CartLine {
  productId: string;
  sku: string;
  nombre: string;
  qty: number;
  precioAplicado: number;
  subtotal: number;
}

export interface Ticket {
  id: string;
  fechaISO: string;
  items: CartLine[];
  total: number;
  depositoId: string;
}

export interface Product {
  productId: string;
  sku: string;
  nombre: string;
  precioBase: number;
  tiers?: Tier[];
  stockActual?: number;
}

export type AppState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

// Estados de errores más específicos
export interface AppError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

// Tipos para gestión de depósitos
export interface Deposit {
  id: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  fechaCreacion: string;
}

// Tipos para transferencias
export interface Transfer {
  id: string;
  depositoOrigenId: string;
  depositoDestinoId: string;
  fechaISO: string;
  items: TransferItem[];
  estado: 'pendiente' | 'completado' | 'cancelado';
}

export interface TransferItem {
  productId: string;
  sku: string;
  nombre: string;
  cantidad: number;
}

// Tipos para stock
export interface StockEntry {
  depositoId: string;
  productId: string;
  cantidad: number;
  ultimaActualizacion: string;
}

export interface StockMovement {
  id: string;
  depositoId: string;
  productId: string;
  producto?: string; // Nombre del producto para reportes
  tipo: 'entrada' | 'salida' | 'ajuste' | 'transferencia' | 'venta';
  delta: number; // Cambio en stock (+ entrada, - salida)
  stockAnterior?: number; // Stock antes del movimiento
  stockActual?: number; // Stock después del movimiento
  fechaISO: string;
  motivo: string; // Descripción del motivo
  referencia?: string; // ID de ticket o transferencia
  userId?: string; // Usuario que realizó el movimiento
}

// Tipos para reportes
export interface SalesReport {
  tickets: Ticket[];
  totalVentas: number;
  cantidadTickets: number;
  productosMasVendidos: { productId: string; nombre: string; cantidad: number }[];
}

export interface StockReport {
  movimientos: StockMovement[];
  stockActual: { depositoId: string; items: StockEntry[] }[];
}

// Validaciones de negocio
export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  data?: T;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

// Configuración de reconocimiento
export interface RecognitionConfig {
  minConfidence: number; // Confianza mínima para aceptar producto
  maxItems: number; // Máximo de productos por reconocimiento
  allowDuplicates: boolean; // Permitir productos duplicados
}

// Configuración de validación de imágenes
export interface ImageValidationConfig {
  maxFileSize: number; // en bytes
  minWidth: number;
  minHeight: number;
  allowedFormats: string[];
  compressionQuality: number; // 0.0 - 1.0
}

// Sistema de Usuarios y Roles
export type UserRole = 'admin' | 'operador' | 'cajero';

export interface User {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  isActive: boolean;
  depositosAsignados?: string[]; // Para operadores
  fechaCreacion: string;
  ultimoAcceso?: string;
  requiresPasswordChange?: boolean;
  temporaryPassword?: string; // Solo visible para admins
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  condition?: (user: User, resource?: any) => boolean;
}

export interface RolePermissions {
  [key: string]: Permission[];
}