import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2, ScanLine } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/custom-button';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/store/cartStore';
import { dataProvider } from '@/services/dataProvider';
import { RecognizedItem, AppState } from '@/types';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<AppState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const { lines, addLinesFromRecognition } = useCartStore();

  const handleImageSelect = async (file: File) => {
    setState('loading');
    setError(null);
    
    try {
      // Llamar al servicio de reconocimiento
      const result = await dataProvider.recognize(file);
      
      if (result.items.length === 0) {
        setState('empty');
        toast({
          title: "Sin resultados",
          description: "No se pudieron reconocer productos en la imagen",
          variant: "destructive",
        });
        return;
      }
      
      // Agregar productos al carrito
      await addLinesFromRecognition(result.items);
      
      setState('success');
      
      toast({
        title: "¡Productos reconocidos!",
        description: `${result.items.length} producto(s) agregado(s) al carrito`,
      });
      
      
    } catch (err) {
      setState('error');
      const errorMessage = err instanceof Error ? err.message : 'Error procesando imagen';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <ScanLine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">SCANIX</h1>
          <p className="text-muted-foreground">
            Sistema de Reconocimiento de Productos
          </p>
        </div>

        {/* Main Content - Single Upload Interface */}
        <div className="bg-card rounded-2xl shadow-card-hover p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Reconocimiento Inteligente de Productos
            </h2>
            <p className="text-muted-foreground">
              Sube una imagen y nuestro sistema de IA reconocerá automáticamente los productos
            </p>
          </div>
          
          <ImageUpload
            onImageSelect={handleImageSelect}
            isLoading={state === 'loading'}
            error={error}
          />
          
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center mt-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analizando imagen con IA...</p>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {lines.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Carrito actual</h3>
                <p className="text-sm text-muted-foreground">
                  {lines.length} producto(s) • {lines.reduce((sum, l) => sum + l.qty, 0)} unidad(es)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/cart')}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Gestionar
                </Button>
              <Button
                variant="gradient"
                  size="sm"
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2"
              >
                  Generar Ticket
              </Button>
              </div>
            </div>
            
            {/* Lista rápida de productos */}
            <div className="space-y-2">
              {lines.slice(0, 3).map((line, index) => (
                <div key={index} className="flex items-center justify-between bg-accent/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{line.qty}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{line.nombre}</p>
                      <p className="text-xs text-muted-foreground">${line.precioAplicado.toFixed(2)} c/u</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${line.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {lines.length > 3 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{lines.length - 3} producto(s) más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {state === 'idle' && lines.length === 0 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">¿Cómo funciona?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="text-3xl mb-2">📸</div>
                <h3 className="font-medium mb-1">1. Captura</h3>
                <p className="text-sm text-muted-foreground">
                  Toma o sube una foto de los productos
                </p>
              </div>
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-medium mb-1">2. Análisis IA</h3>
                <p className="text-sm text-muted-foreground">
                  Nuestro sistema de IA identifica automáticamente los productos
                </p>
              </div>
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🛒</div>
                <h3 className="font-medium mb-1">3. Carrito</h3>
                <p className="text-sm text-muted-foreground">
                  Productos agregados automáticamente al carrito
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ScanPage;