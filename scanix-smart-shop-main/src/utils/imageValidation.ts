// Utilidades para validación y procesamiento de imágenes
import { ImageValidationResult, ImageValidationConfig } from '@/types';

// Configuración por defecto - MUY FLEXIBLE para aceptar cualquier imagen
const DEFAULT_CONFIG: ImageValidationConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB - Aumentado para fotos de celular
  minWidth: 50, // ✅ MUY REDUCIDO: Acepta imágenes muy pequeñas
  minHeight: 50, // ✅ MUY REDUCIDO: Acepta imágenes muy pequeñas
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
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

  // Validar resolución - MUY PERMISIVO
  try {
    const dimensions = await getImageDimensions(file);
    
    // Solo advertencias, nunca errores por resolución
    if (dimensions.width < 100 || dimensions.height < 100) {
      warnings.push(`Imagen pequeña (${dimensions.width}x${dimensions.height}px). El reconocimiento puede ser menos preciso.`);
    }

    // Advertencia si la resolución es muy alta (procesamiento lento)
    if (dimensions.width > 4096 || dimensions.height > 4096) {
      warnings.push('Imagen de muy alta resolución, el procesamiento puede ser lento');
    }

  } catch (error) {
    // Si no se puede leer la imagen, intentar procesarla de todas formas
    warnings.push('No se pudo validar las dimensiones de la imagen, pero se intentará procesar.');
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