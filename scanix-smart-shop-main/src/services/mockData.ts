// Datos mock para el sistema SCANIX
import { Product, Tier } from '@/types';

export const mockProductCatalog: Product[] = [
  // Productos reconocibles por IA (3 productos específicos)
  { productId: 'SAL-CELUSAL', sku: 'SAL-CELUSAL', nombre: 'Sal Celusal', descripcion: 'Sal de Mesa - Celusal', precioBase: 450, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 450 }, { id: '2', minQty: 6, maxQty: 12, precio: 419 }, { id: '3', minQty: 13, maxQty: null, precio: 383 }] },
  { productId: 'LECHE-SERENISIMA', sku: 'LECHE-SERENISIMA', nombre: 'Leche La Serenísima', descripcion: 'Leche Entera - La Serenísima', precioBase: 800, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 800 }, { id: '2', minQty: 6, maxQty: 12, precio: 744 }, { id: '3', minQty: 13, maxQty: null, precio: 680 }] },
  { productId: 'MAYONESA-HELLMANNS', sku: 'MAYONESA-HELLMANNS', nombre: 'Mayonesa Hellmann\'s', descripcion: 'Mayonesa - Hellmann\'s', precioBase: 1200, tiers: [{ id: '1', minQty: 1, maxQty: 5, precio: 1200 }, { id: '2', minQty: 6, maxQty: 12, precio: 1116 }, { id: '3', minQty: 13, maxQty: null, precio: 1020 }] },
  
  // Productos adicionales para completar el catálogo
  {
    productId: 'P001',
    sku: 'LAP-DELL-001',
    nombre: 'Laptop Dell Inspiron 15',
    precioBase: 899.99,
  },
  {
    productId: 'P002',
    sku: 'MON-LG-27',
    nombre: 'Monitor LG 27" 4K',
    precioBase: 349.99,
  },
  {
    productId: 'P003',
    sku: 'MOU-LOG-MX',
    nombre: 'Mouse Logitech MX Master 3',
    precioBase: 99.99,
  },
  {
    productId: 'P004',
    sku: 'KEY-MECH-RGB',
    nombre: 'Teclado Mecánico RGB',
    precioBase: 149.99,
  },
  {
    productId: 'P005',
    sku: 'CAM-WEB-1080',
    nombre: 'Webcam HD 1080p',
    precioBase: 79.99,
  },
  {
    productId: 'P006',
    sku: 'HDD-EXT-2TB',
    nombre: 'Disco Duro Externo 2TB',
    precioBase: 89.99,
  },
  {
    productId: 'P007',
    sku: 'USB-HUB-7P',
    nombre: 'Hub USB 7 Puertos',
    precioBase: 29.99,
  },
  {
    productId: 'P008',
    sku: 'HDMI-CBL-2M',
    nombre: 'Cable HDMI 2m',
    precioBase: 14.99,
  },
];

export const mockTiers: Record<string, Tier[]> = {
  'P001': [
    { min: 1, max: 2, precio: 899.99 },
    { min: 3, max: 5, precio: 849.99 },
    { min: 6, max: null, precio: 799.99 },
  ],
  'P002': [
    { min: 1, max: 3, precio: 349.99 },
    { min: 4, max: 10, precio: 329.99 },
    { min: 11, max: null, precio: 299.99 },
  ],
  'P003': [
    { min: 1, max: 5, precio: 99.99 },
    { min: 6, max: 20, precio: 94.99 },
    { min: 21, max: null, precio: 89.99 },
  ],
  'P004': [
    { min: 1, max: 4, precio: 149.99 },
    { min: 5, max: 15, precio: 139.99 },
    { min: 16, max: null, precio: 129.99 },
  ],
  'P005': [
    { min: 1, max: 10, precio: 79.99 },
    { min: 11, max: 50, precio: 74.99 },
    { min: 51, max: null, precio: 69.99 },
  ],
  'P006': [
    { min: 1, max: 5, precio: 89.99 },
    { min: 6, max: 20, precio: 84.99 },
    { min: 21, max: null, precio: 79.99 },
  ],
  'P007': [
    { min: 1, max: 10, precio: 29.99 },
    { min: 11, max: 50, precio: 27.99 },
    { min: 51, max: null, precio: 24.99 },
  ],
  'P008': [
    { min: 1, max: 20, precio: 14.99 },
    { min: 21, max: 100, precio: 12.99 },
    { min: 101, max: null, precio: 9.99 },
  ],
};

// Función helper para obtener producto por SKU o nombre
export function findProductBySku(sku: string): Product | undefined {
  return mockProductCatalog.find(p => p.sku.toLowerCase() === sku.toLowerCase());
}

export function findProductByName(nombre: string): Product | undefined {
  return mockProductCatalog.find(p => 
    p.nombre.toLowerCase().includes(nombre.toLowerCase())
  );
}