// Reglas de negocio centralizadas y validaciones
import { Tier, ValidationResult, ValidationError, Product } from '@/types';

/**
 * Validar tiers de precios según reglas de negocio
 * Reglas:
 * - sin solapamientos
 * - min >= 1
 * - max = null o max >= min
 * - precio > 0
 * - sin gaps entre tiers consecutivos
 */
export function validateTiers(tiers: Tier[]): ValidationResult<Tier[]> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (tiers.length === 0) {
    return { isValid: true, errors, warnings };
  }

  // Ordenar tiers por cantidad mínima
  const sortedTiers = [...tiers].sort((a, b) => a.min - b.min);

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    const tierIndex = `tier[${i}]`;

    // Validar min >= 1
    if (tier.min < 1) {
      errors.push({
        field: `${tierIndex}.min`,
        code: 'MIN_QUANTITY_INVALID',
        message: 'La cantidad mínima debe ser mayor o igual a 1',
        value: tier.min
      });
    }

    // Validar precio > 0
    if (tier.precio <= 0) {
      errors.push({
        field: `${tierIndex}.precio`,
        code: 'PRICE_INVALID',
        message: 'El precio debe ser mayor a 0',
        value: tier.precio
      });
    }

    // Validar max >= min (si max no es null)
    if (tier.max !== null && tier.max < tier.min) {
      errors.push({
        field: `${tierIndex}.max`,
        code: 'MAX_LESS_THAN_MIN',
        message: 'La cantidad máxima debe ser mayor o igual a la mínima',
        value: { min: tier.min, max: tier.max }
      });
    }

    // Validar solapamientos con tier siguiente
    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1];
      
      // Si el tier actual tiene max definido
      if (tier.max !== null) {
        if (tier.max >= nextTier.min) {
          errors.push({
            field: `${tierIndex}.max`,
            code: 'TIER_OVERLAP',
            message: `Solapamiento detectado: tier ${i} (max: ${tier.max}) con tier ${i + 1} (min: ${nextTier.min})`,
            value: { currentMax: tier.max, nextMin: nextTier.min }
          });
        }

        // Advertencia si hay gap entre tiers
        if (tier.max + 1 < nextTier.min) {
          warnings.push({
            field: `${tierIndex}.max`,
            code: 'TIER_GAP',
            message: `Gap detectado entre tier ${i} (max: ${tier.max}) y tier ${i + 1} (min: ${nextTier.min}). Las cantidades ${tier.max + 1}-${nextTier.min - 1} usarán precio base.`,
            value: { gapStart: tier.max + 1, gapEnd: nextTier.min - 1 }
          });
        }
      }
    }

    // El último tier debería tener max = null (advertencia)
    if (i === sortedTiers.length - 1 && tier.max !== null) {
      warnings.push({
        field: `${tierIndex}.max`,
        code: 'LAST_TIER_HAS_MAX',
        message: 'El último tier debería tener cantidad máxima ilimitada (null) para cubrir todas las cantidades superiores',
        value: tier.max
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? sortedTiers : undefined
  };
}

/**
 * Seleccionar tier apropiado para una cantidad
 */
export function selectTier(tiers: Tier[], qty: number): Tier | null {
  if (!tiers || tiers.length === 0 || qty < 1) {
    return null;
  }

  // Buscar el tier apropiado
  for (const tier of tiers) {
    const meetsMin = qty >= tier.min;
    const meetsMax = tier.max === null || qty <= tier.max;
    
    if (meetsMin && meetsMax) {
      return tier;
    }
  }

  return null;
}

/**
 * Calcular precio para una cantidad específica
 */
export function priceForQty(product: { precioBase: number; tiers?: Tier[] }, qty: number): number {
  if (qty <= 0) return 0;

  const selectedTier = selectTier(product.tiers || [], qty);
  return selectedTier ? selectedTier.precio : product.precioBase;
}

/**
 * Calcular subtotal para una línea
 */
export function computeSubtotal(qty: number, unitPrice: number): number {
  if (qty <= 0 || unitPrice < 0) return 0;
  return Math.round(qty * unitPrice * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcular total general
 */
export function computeTotal(lines: { qty: number; precioAplicado: number; subtotal: number }[]): number {
  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
  return Math.round(total * 100) / 100; // Redondear a 2 decimales
}

/**
 * Validar stock suficiente para una operación
 */
export function validateStockOperation(
  currentStock: number, 
  requestedQty: number, 
  operation: 'withdraw' | 'add'
): ValidationResult<number> {
  const errors: ValidationError[] = [];
  
  if (operation === 'withdraw') {
    if (requestedQty > currentStock) {
      errors.push({
        field: 'quantity',
        code: 'INSUFFICIENT_STOCK',
        message: `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${requestedQty}`,
        value: { available: currentStock, requested: requestedQty }
      });
    }
    
    if (currentStock - requestedQty < 0) {
      errors.push({
        field: 'quantity',
        code: 'NEGATIVE_STOCK',
        message: 'La operación resultaría en stock negativo',
        value: { resultingStock: currentStock - requestedQty }
      });
    }
  }

  const newStock = operation === 'withdraw' 
    ? currentStock - requestedQty 
    : currentStock + requestedQty;

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    data: errors.length === 0 ? newStock : undefined
  };
}

/**
 * Validar datos de transferencia
 */
export function validateTransfer(transfer: {
  origenId: string;
  destinoId: string;
  items: { productId: string; cantidad: number }[];
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validar que origen y destino sean diferentes
  if (transfer.origenId === transfer.destinoId) {
    errors.push({
      field: 'destinoId',
      code: 'SAME_ORIGIN_DESTINATION',
      message: 'El depósito origen y destino deben ser diferentes',
      value: { origenId: transfer.origenId, destinoId: transfer.destinoId }
    });
  }

  // Validar que tenga al menos un item
  if (!transfer.items || transfer.items.length === 0) {
    errors.push({
      field: 'items',
      code: 'NO_ITEMS',
      message: 'La transferencia debe incluir al menos un producto',
      value: transfer.items
    });
  }

  // Validar cantidades de items
  transfer.items?.forEach((item, index) => {
    if (item.cantidad <= 0) {
      errors.push({
        field: `items[${index}].cantidad`,
        code: 'INVALID_QUANTITY',
        message: 'La cantidad debe ser mayor a 0',
        value: item.cantidad
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Validar producto antes de crear/actualizar
 */
export function validateProduct(product: Partial<Product>): ValidationResult<Product> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validar campos requeridos
  if (!product.sku || product.sku.trim() === '') {
    errors.push({
      field: 'sku',
      code: 'REQUIRED_FIELD',
      message: 'El SKU es requerido',
      value: product.sku
    });
  }

  if (!product.nombre || product.nombre.trim() === '') {
    errors.push({
      field: 'nombre',
      code: 'REQUIRED_FIELD',
      message: 'El nombre es requerido',
      value: product.nombre
    });
  }

  if (typeof product.precioBase !== 'number' || product.precioBase <= 0) {
    errors.push({
      field: 'precioBase',
      code: 'INVALID_PRICE',
      message: 'El precio base debe ser un número mayor a 0',
      value: product.precioBase
    });
  }

  // Validar formato de SKU (solo letras, números y guiones)
  if (product.sku && !/^[A-Za-z0-9\-_]+$/.test(product.sku)) {
    errors.push({
      field: 'sku',
      code: 'INVALID_FORMAT',
      message: 'El SKU solo puede contener letras, números, guiones y guiones bajos',
      value: product.sku
    });
  }

  // Validar tiers si están presentes
  if (product.tiers && product.tiers.length > 0) {
    const tierValidation = validateTiers(product.tiers);
    errors.push(...tierValidation.errors);
    warnings.push(...tierValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? product as Product : undefined
  };
}
