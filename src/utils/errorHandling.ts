// Sistema centralizado de manejo de errores
import { AppError } from '@/types';

// Códigos de error estándar
export const ERROR_CODES = {
  // Errores de validación
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_IMAGE: 'INVALID_IMAGE',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_TIER_CONFIG: 'INVALID_TIER_CONFIG',
  
  // Errores de reconocimiento
  RECOGNITION_FAILED: 'RECOGNITION_FAILED',
  NO_PRODUCTS_FOUND: 'NO_PRODUCTS_FOUND',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  
  // Errores de datos
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_SKU: 'DUPLICATE_SKU',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  
  // Errores de sistema
  CAMERA_ACCESS_DENIED: 'CAMERA_ACCESS_DENIED',
  STORAGE_FULL: 'STORAGE_FULL',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Crear error estructurado
 */
export function createAppError(
  code: string, 
  message: string, 
  details?: any, 
  recoverable: boolean = true
): AppError {
  return {
    code,
    message,
    details,
    recoverable
  };
}

/**
 * Manejar errores de cámara
 */
export function handleCameraError(error: any): AppError {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return createAppError(
      ERROR_CODES.CAMERA_ACCESS_DENIED,
      'Acceso a la cámara denegado. Por favor, permite el acceso en la configuración del navegador.',
      error,
      true
    );
  }
  
  if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return createAppError(
      ERROR_CODES.CAMERA_ACCESS_DENIED,
      'No se encontró ninguna cámara disponible en este dispositivo.',
      error,
      false
    );
  }
  
  if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return createAppError(
      ERROR_CODES.CAMERA_ACCESS_DENIED,
      'La cámara está siendo usada por otra aplicación.',
      error,
      true
    );
  }

  return createAppError(
    ERROR_CODES.UNKNOWN_ERROR,
    'Error desconocido al acceder a la cámara.',
    error,
    true
  );
}

/**
 * Manejar errores de reconocimiento
 */
export function handleRecognitionError(error: any): AppError {
  if (error.message?.includes('No se pudieron reconocer productos')) {
    return createAppError(
      ERROR_CODES.NO_PRODUCTS_FOUND,
      'No se reconocieron productos en la imagen. Intenta con una imagen más clara o con mejor iluminación.',
      error,
      true
    );
  }

  if (error.message?.includes('confianza')) {
    return createAppError(
      ERROR_CODES.LOW_CONFIDENCE,
      'Los productos reconocidos tienen baja confianza. Revisa los resultados antes de continuar.',
      error,
      true
    );
  }

  return createAppError(
    ERROR_CODES.RECOGNITION_FAILED,
    'Error en el reconocimiento de productos. Inténtalo nuevamente.',
    error,
    true
  );
}

/**
 * Manejar errores de stock
 */
export function handleStockError(error: any): AppError {
  if (error.message?.includes('Stock insuficiente') || error.message?.includes('insufficient')) {
    return createAppError(
      ERROR_CODES.INSUFFICIENT_STOCK,
      'Stock insuficiente para completar la operación.',
      error,
      false
    );
  }

  return createAppError(
    ERROR_CODES.UNKNOWN_ERROR,
    'Error en la gestión de stock.',
    error,
    true
  );
}

/**
 * Manejar errores de localStorage
 */
export function handleStorageError(error: any): AppError {
  if (error.name === 'QuotaExceededError') {
    return createAppError(
      ERROR_CODES.STORAGE_FULL,
      'Almacenamiento local lleno. Algunos datos podrían no guardarse correctamente.',
      error,
      true
    );
  }

  return createAppError(
    ERROR_CODES.DATA_CORRUPTION,
    'Error al acceder a los datos almacenados.',
    error,
    true
  );
}

/**
 * Convertir error genérico a AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof Error) {
    // Detectar tipo de error por mensaje o propiedades
    if (error.message.includes('cámara') || error.message.includes('camera')) {
      return handleCameraError(error);
    }
    
    if (error.message.includes('reconoc') || error.message.includes('recognition')) {
      return handleRecognitionError(error);
    }
    
    if (error.message.includes('stock') || error.message.includes('Stock')) {
      return handleStockError(error);
    }
    
    if (error.message.includes('storage') || error.message.includes('localStorage')) {
      return handleStorageError(error);
    }

    return createAppError(
      ERROR_CODES.UNKNOWN_ERROR,
      error.message,
      error,
      true
    );
  }

  if (typeof error === 'string') {
    return createAppError(
      ERROR_CODES.UNKNOWN_ERROR,
      error,
      null,
      true
    );
  }

  return createAppError(
    ERROR_CODES.UNKNOWN_ERROR,
    'Error desconocido',
    error,
    true
  );
}

/**
 * Logger de errores para debugging
 */
export function logError(error: AppError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    context: context || 'Unknown',
    code: error.code,
    message: error.message,
    recoverable: error.recoverable,
    details: error.details
  };

  console.error('SCANIX Error:', logData);
  
  // En producción, aquí se enviaría a un servicio de logging
  // como Sentry, LogRocket, etc.
}

/**
 * Obtener mensaje de error amigable para el usuario
 */
export function getUserFriendlyMessage(error: AppError): string {
  const friendlyMessages: Record<string, string> = {
    [ERROR_CODES.CAMERA_ACCESS_DENIED]: 'No se puede acceder a la cámara. Verifica los permisos en tu navegador.',
    [ERROR_CODES.NO_PRODUCTS_FOUND]: 'No se reconocieron productos. Intenta con una imagen más clara.',
    [ERROR_CODES.INSUFFICIENT_STOCK]: 'No hay suficiente stock disponible.',
    [ERROR_CODES.INVALID_IMAGE]: 'La imagen no es válida o está corrupta.',
    [ERROR_CODES.STORAGE_FULL]: 'El almacenamiento está lleno. Limpia algunos datos.',
    [ERROR_CODES.DUPLICATE_SKU]: 'Ya existe un producto con este SKU.',
    [ERROR_CODES.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet.',
  };

  return friendlyMessages[error.code] || error.message || 'Ha ocurrido un error inesperado.';
}

/**
 * Determinar si un error permite reintento
 */
export function canRetry(error: AppError): boolean {
  const retryableErrors = [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.RECOGNITION_FAILED,
    ERROR_CODES.UNKNOWN_ERROR
  ];

  return error.recoverable && retryableErrors.includes(error.code);
}
