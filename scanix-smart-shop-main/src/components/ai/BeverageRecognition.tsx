/**
 * SCANIX - Beverage Recognition Component
 * Componente para reconocimiento de bebidas con YOLO
 */

import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/store/cartStore';
import { RecognizedItem } from '@/types';

interface BeverageRecognitionProps {
  onItemsRecognized?: (items: RecognizedItem[]) => void;
  className?: string;
}

export const BeverageRecognition: React.FC<BeverageRecognitionProps> = ({
  onItemsRecognized,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addLinesFromRecognition } = useCartStore();

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    setIsLoading(true);
    setIsProcessing(true);
    setError(null);
    setRecognizedItems([]);
    
    try {
      console.log('🤖 Iniciando reconocimiento YOLO...');
      
      // Crear FormData
      const formData = new FormData();
      formData.append('image', file);
      
      // Llamar al backend que hace proxy al AI service
      const response = await fetch('/api/recognition/recognize', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error en reconocimiento');
      }
      
      if (!result.success) {
        throw new Error(result.message || 'No se pudieron reconocer productos');
      }
      
      console.log('✅ Productos reconocidos:', result.items);
      
      if (result.items && result.items.length > 0) {
        setRecognizedItems(result.items);
        
        // Agregar al carrito automáticamente
        await addLinesFromRecognition(result.items);
        
        // Callback opcional
        if (onItemsRecognized) {
          onItemsRecognized(result.items);
        }
        
        toast({
          title: "¡Bebidas reconocidas!",
          description: `${result.items.length} producto(s) agregado(s) al carrito`,
        });
      } else {
        toast({
          title: "Sin resultados",
          description: "No se detectaron bebidas en la imagen",
          variant: "destructive",
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error procesando imagen';
      setError(errorMessage);
      
      console.error('❌ Error en reconocimiento:', err);
      
      toast({
        title: "Error en reconocimiento",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Reconocimiento YOLO
        </h2>
        <p className="text-muted-foreground">
          Detecta bebidas argentinas con inteligencia artificial
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isLoading ? 'pointer-events-none opacity-50' : 'hover:border-primary/50 cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {isLoading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Analizando imagen...</h3>
              <p className="text-sm text-muted-foreground">
                YOLO está detectando bebidas en tu imagen
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Camera className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Arrastra una imagen o haz clic para seleccionar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sube una foto de bebidas para reconocimiento automático
              </p>
              
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Seleccionar Imagen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <h4 className="font-medium text-destructive">Error en reconocimiento</h4>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {recognizedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {recognizedItems.length} producto(s) reconocido(s)
            </span>
          </div>
          
          <div className="grid gap-3">
            {recognizedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-green-900">{item.nombre}</h4>
                  <p className="text-sm text-green-700">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-900">
                    ${item.precio?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-green-600">
                    Confianza: {Math.round((item.confianza || 0) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Procesando con YOLO...</span>
        </div>
      )}
    </div>
  );
};
