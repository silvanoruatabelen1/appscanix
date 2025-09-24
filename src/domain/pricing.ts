// Lógica de negocio pura para precios y cálculos
import { Tier, CartLine } from '@/types';

/**
 * Selecciona el tier apropiado según la cantidad
 */
export function selectTier(tiers: Tier[], qty: number): Tier | null {
  if (!tiers || tiers.length === 0) return null;
  
  return tiers.find(tier => {
    const inRange = qty >= tier.min && (tier.max === null || qty <= tier.max);
    return inRange;
  }) || null;
}

/**
 * Calcula el precio unitario aplicando tiers si existen
 */
export function priceForQty(
  product: { precioBase: number; tiers?: Tier[] },
  qty: number
): number {
  if (!product.tiers || product.tiers.length === 0) {
    return product.precioBase;
  }
  
  const tier = selectTier(product.tiers, qty);
  return tier ? tier.precio : product.precioBase;
}

/**
 * Calcula el subtotal de una línea
 */
export function computeSubtotal(qty: number, unitPrice: number): number {
  return Math.round(qty * unitPrice * 100) / 100; // Redondeo a 2 decimales
}

/**
 * Calcula el total del carrito
 */
export function computeTotal(lines: CartLine[]): number {
  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
  return Math.round(total * 100) / 100; // Redondeo a 2 decimales
}