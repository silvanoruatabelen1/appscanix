import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader2, ScanLine, Zap } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { RecognitionResults } from '@/components/RecognitionResults';
import { BeverageRecognition } from '@/components/ai/BeverageRecognition';
import { Button } from '@/components/ui/custom-button';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/store/cartStore';
import { dataProvider } from '@/services/dataProvider';
import { RecognizedItem, AppState } from '@/types';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<AppState>('idle');
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { lines, addLinesFromRecognition } = useCartStore();

  const handleImageSelect = async (file: File) => {
    setState('loading');
    setError(null);
    setShowResults(false);
    
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
      
      // Agregar al carrito
      await addLinesFromRecognition(result.items);
      
      setRecognizedItems(result.items);
      setShowResults(true);
      setState('success');
      
      toast({
        title: "¡Productos reconocidos!",
        description: `${result.items.length} producto(s) agregado(s) al carrito`,
      });
      
      // Ocultar resultados después de 3 segundos
      setTimeout(() => {
        setShowResults(false);
      }, 3000);
      
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

        {/* Main Content */}
        <div className="bg-card rounded-2xl shadow-card-hover p-8 mb-6">
          <ImageUpload
            onImageSelect={handleImageSelect}
            isLoading={state === 'loading'}
            error={error}
          />
          
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center mt-8 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Analizando imagen...</p>
            </div>
          )}
        </div>

        {/* YOLO Recognition Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-card-hover p-8 mb-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-900">Reconocimiento YOLO</h3>
              <p className="text-sm text-blue-700">Detecta bebidas argentinas con inteligencia artificial</p>
            </div>
          </div>
          
          <BeverageRecognition 
            onItemsRecognized={(items) => {
              console.log('Productos reconocidos con YOLO:', items);
              setRecognizedItems(items);
              setShowResults(true);
              setState('success');
            }}
          />
        </div>

        {/* Cart Summary */}
        {lines.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Carrito actual</h3>
                <p className="text-sm text-muted-foreground">
                  {lines.length} producto(s) • {lines.reduce((sum, l) => sum + l.qty, 0)} unidad(es)
                </p>
              </div>
              <Button
                variant="gradient"
                size="lg"
                onClick={() => navigate('/cart')}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Ver Carrito
              </Button>
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
                <h3 className="font-medium mb-1">2. Reconocimiento</h3>
                <p className="text-sm text-muted-foreground">
                  IA identifica automáticamente los productos
                </p>
              </div>
              <div className="bg-accent/50 rounded-lg p-4">
                <div className="text-3xl mb-2">🛒</div>
                <h3 className="font-medium mb-1">3. Carrito</h3>
                <p className="text-sm text-muted-foreground">
                  Productos agregados listos para comprar
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recognition Results Overlay */}
      <RecognitionResults items={recognizedItems} isVisible={showResults} />
    </div>
  );
};

export default ScanPage;