import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Loader2 } from 'lucide-react';
import { CartTable } from '@/components/CartTable';
import { Button } from '@/components/ui/custom-button';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/store/cartStore';
import { dataProvider } from '@/services/dataProvider';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState('');
  
  const { 
    lines, 
    total, 
    depositoId,
    updateQty, 
    removeLine, 
    addManualLine,
    clear,
    incrementQty,
    decrementQty,
    setQty
  } = useCartStore();

  const handleAddManual = async () => {
    if (!manualInput.trim()) return;
    
    const success = await addManualLine(manualInput);
    if (success) {
      setManualInput('');
      toast({
        title: "Producto agregado",
        description: "El producto se agregó al carrito",
      });
    } else {
      toast({
        title: "Producto no encontrado",
        description: "No se encontró un producto con ese código o nombre",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    if (lines.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Crear ticket
      const ticket = await dataProvider.createTicket({
        items: lines,
        depositoId,
      });
      
      // Descontar stock
      await dataProvider.withdrawStock({
        depositoId,
        items: lines.map(l => ({ productId: l.productId, qty: l.qty })),
      });
      
      // Limpiar carrito
      clear();
      
      toast({
        title: "¡Compra confirmada!",
        description: `Ticket ${ticket.id} generado exitosamente`,
      });
      
      // Navegar al ticket
      navigate(`/ticket/${ticket.id}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error procesando compra';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/scan')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Carrito de Compras</h1>
              <p className="text-muted-foreground">
                {lines.length} producto(s) • Depósito: {depositoId}
              </p>
            </div>
          </div>
        </div>

        {/* Add Manual Product */}
        <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold mb-3">Agregar producto manual</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ingrese SKU o nombre del producto"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddManual()}
              className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button onClick={handleAddManual} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>

        {/* Cart Table */}
        <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
        <CartTable
          lines={lines}
          onUpdateQty={updateQty}
          onRemoveLine={removeLine}
          onIncrementQty={incrementQty}
          onDecrementQty={decrementQty}
          onSetQty={setQty}
          isLoading={isProcessing}
        />
        </div>

        {/* Total and Actions */}
        {lines.length > 0 && (
          <div className="bg-card rounded-xl shadow-sm p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resumen del carrito */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resumen del carrito</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos:</span>
                    <span className="font-medium">{lines.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidades:</span>
                    <span className="font-medium">{lines.reduce((sum, l) => sum + l.qty, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depósito:</span>
                    <span className="font-medium">{depositoId}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Acciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Acciones</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/scan')}
                    className="w-full"
                  >
                    Seguir escaneando
                  </Button>
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Generar Ticket
                    </>
                  )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clear();
                      toast({
                        title: "Carrito vaciado",
                        description: "Se eliminaron todos los productos del carrito",
                      });
                    }}
                    className="w-full"
                  >
                    Vaciar carrito
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;