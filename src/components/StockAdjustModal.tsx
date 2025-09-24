import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/custom-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Product, StockEntry } from '@/types';
import { useDepositStore } from '@/store/depositStore';

interface StockAdjustModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  currentStock: number;
  type: 'entrada' | 'salida';
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  open,
  onClose,
  product,
  currentStock,
  type,
}) => {
  const { toast } = useToast();
  const { adjustStock } = useDepositStore();
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    if (cantidad <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'salida') {
      const newStock = currentStock - cantidad;
      if (newStock < 0) {
        toast({
          title: 'Error',
          description: 'No se puede tener stock negativo',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const finalQuantity = type === 'entrada' 
        ? currentStock + cantidad 
        : currentStock - cantidad;
      
      await adjustStock(product.productId, finalQuantity, 'ajuste', motivo);
      
      toast({
        title: 'Stock actualizado',
        description: `${type === 'entrada' ? 'Entrada' : 'Salida'} de ${cantidad} unidades registrada`,
      });
      
      onClose();
      setCantidad(0);
      setMotivo('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al ajustar stock',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'entrada' ? 'Entrada de Stock' : 'Salida de Stock (Ajuste)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium">{product.nombre}</p>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              <p className="text-sm mt-1">Stock actual: <strong>{currentStock}</strong> unidades</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad *</Label>
            <Input
              id="cantidad"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
              placeholder="0"
              required
            />
            {type === 'salida' && cantidad > 0 && (
              <p className="text-sm text-muted-foreground">
                Stock después del ajuste: {currentStock - cantidad}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo / Observaciones</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingrese el motivo del ajuste..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant={type === 'entrada' ? 'gradient' : 'destructive'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : type === 'entrada' ? 'Registrar Entrada' : 'Registrar Salida'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};