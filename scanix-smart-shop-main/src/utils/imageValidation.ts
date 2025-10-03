// Utilidades para validación y procesamiento de imágenes
import { ImageValidationResult, ImageValidationConfig } from '@/types';

// Configuración por defecto - optimizada para reconocimiento con TensorFlow.js
const DEFAULT_CONFIG: ImageValidationConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  minWidth: 200, // ✅ REDUCIDO: TensorFlow.js funciona bien con imágenes pequeñas
  minHeight: 200, // ✅ REDUCIDO: Suficiente para reconocimiento de productos
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  compressionQuality: 0.9
};

// Configuración flexible
let currentConfig = { ...DEFAULT_CONFIG };

export function setImageValidationConfig(config: Partial<ImageValidationConfig>) {
  currentConfig = { ...currentConfig, ...config };
}

export async function validateImage(file: File): Promise<ImageValidationResult> {
  const warnings: string[] = [];
  
  // Validar formato
  if (!currentConfig.allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no válido. Formatos permitidos: ${currentConfig.allowedFormats.join(', ')}`,
    };
  }

  // Validar tamaño
  if (file.size > currentConfig.maxFileSize) {
    const maxSizeMB = Math.round(currentConfig.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      error: `La imagen supera el tamaño permitido (máx. ${maxSizeMB}MB)`,
    };
  }

  // Advertencia si el archivo es muy pequeño (puede ser de baja calidad)
  if (file.size < 100 * 1024) { // < 100KB
    warnings.push('La imagen es muy pequeña, esto puede afectar la calidad del reconocimiento');
  }

  // Validar resolución
  try {
    const dimensions = await getImageDimensions(file);
    
    if (dimensions.width < currentConfig.minWidth || dimensions.height < currentConfig.minHeight) {
      return {
        valid: false,
        error: `Resolución mínima requerida: ${currentConfig.minWidth}x${currentConfig.minHeight}px. Actual: ${dimensions.width}x${dimensions.height}px`,
      };
    }

    // Advertencia si la resolución es muy alta (procesamiento lento)
    if (dimensions.width > 4096 || dimensions.height > 4096) {
      warnings.push('Imagen de muy alta resolución, el procesamiento puede ser lento');
    }

  } catch (error) {
    return {
      valid: false,
      error: 'No se pudo validar la imagen. Archivo corrupto o formato no soportado.',
    };
  }

  return { 
    valid: true, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error loading image'));
    };

    img.src = url;
  });
}

export async function compressImage(file: File, maxWidth = 1920): Promise<File> {
  const dimensions = await getImageDimensions(file);
  
  // Si la imagen es pequeña, no comprimir
  if (dimensions.width <= maxWidth) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Calcular nuevo tamaño manteniendo aspect ratio
      const aspectRatio = img.height / img.width;
      const newWidth = maxWidth;
      const newHeight = newWidth * aspectRatio;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.9 // Calidad de compresión
      );
    };

    img.src = url;
  });
}