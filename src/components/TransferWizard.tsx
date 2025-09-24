import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/custom-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Plus, Trash2, Search, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Deposit, Product, TransferItem } from '@/types';
import { dataProvider } from '@/services/dataProvider';
import { useDepositStore } from '@/store/depositStore';
import { useProductStore } from '@/store/productStore';

interface TransferWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (transferId: string) => void;
}

export const TransferWizard: React.FC<TransferWizardProps> = ({ open, onClose, onComplete }) => {
  const { toast } = useToast();
  const { deposits } = useDepositStore();
  const { products } = useProductStore();
  const [step, setStep] = useState(1);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockOrigen, setStockOrigen] = useState<Record<string, number>>({});

  useEffect(() => {
    if (origenId) {
      loadStockOrigen();
    }
  }, [origenId]);

  const loadStockOrigen = async () => {
    try {
      const stock = await dataProvider.getStock(origenId);
      const stockMap: Record<string, number> = {};
      stock.forEach(s => {
        stockMap[s.productId] = s.cantidad;
      });
      setStockOrigen(stockMap);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error cargando stock del depósito origen',
        variant: 'destructive',
      });
    }
  };

  const handleAddProduct = (product: Product) => {
    const existing = items.find(i => i.productId === product.productId);
    if (existing) {
      toast({
        title: 'Producto ya agregado',
        description: 'Modifica la cantidad del producto existente',
        variant: 'destructive',
      });
      return;
    }

    setItems([...items, {
      productId: product.productId,
      sku: product.sku,
      nombre: product.nombre,
      cantidad: 1,
    }]);
  };

  const updateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].cantidad = Math.max(0, qty);
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleScanPhoto = async () => {
    try {
      // Mock recognition
      const mockResult = await dataProvider.recognize('mock-photo');
      
      mockResult.items.forEach(recognized => {
        const product = products.find(p => p.sku === recognized.sku);
        if (product) {
          const existing = items.find(i => i.productId === product.productId);
          if (!existing) {
            setItems(prev => [...prev, {
              productId: product.productId,
              sku: product.sku,
              nombre: product.nombre,
              cantidad: recognized.qty,
            }]);
          }
        }
      });
      
      toast({ title: `${mockResult.items.length} productos reconocidos` });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al reconocer productos',
        variant: 'destructive',
      });
    }
  };

  const validateStep1 = () => {
    if (!origenId || !destinoId) {
      toast({
        title: 'Error',
        description: 'Selecciona origen y destino',
        variant: 'destructive',
      });
      return false;
    }
    
    if (origenId === destinoId) {
      toast({
        title: 'Error',
        description: 'El origen y destino deben ser diferentes',
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un producto',
        variant: 'destructive',
      });
      return false;
    }

    // Validar stock suficiente
    for (const item of items) {
      const available = stockOrigen[item.productId] || 0;
      if (item.cantidad > available) {
        toast({
          title: 'Stock insuficiente',
          description: `${item.nombre}: disponible ${available}, solicitado ${item.cantidad}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleConfirm = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const transfer = await dataProvider.createTransfer({
        depositoOrigenId: origenId,
        depositoDestinoId: destinoId,
        items,
      });
      
      toast({ title: 'Transferencia creada exitosamente' });
      onComplete(transfer.id);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear transferencia',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia - Paso {step} de 2</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Depósito Origen *</Label>
                <Select value={origenId} onValueChange={setOrigenId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {deposits.map(dep => (
                      <SelectItem key={dep.id} value={dep.id}>
                        {dep.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Depósito Destino *</Label>
                <Select value={destinoId} onValueChange={setDestinoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {deposits.filter(d => d.id !== origenId).map(dep => (
                      <SelectItem key={dep.id} value={dep.id}>
                        {dep.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {origenId && destinoId && (
              <div className="p-4 bg-primary/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{deposits.find(d => d.id === origenId)?.nombre}</span>
                  <ArrowRight className="w-4 h-4 text-primary" />
                  <span className="font-medium">{deposits.find(d => d.id === destinoId)?.nombre}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                variant="gradient" 
                onClick={() => validateStep1() && setStep(2)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por SKU o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={handleScanPhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Desde Foto
              </Button>
            </div>

            {searchTerm && (
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                {filteredProducts.slice(0, 5).map(product => (
                  <button
                    key={product.productId}
                    onClick={() => handleAddProduct(product)}
                    className="w-full text-left p-2 hover:bg-accent rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{product.nombre}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <Plus className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.sku} | Stock disponible: {stockOrigen[item.productId] || 0}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Label>Cantidad:</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos agregados
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Anterior
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button 
                  variant="gradient" 
                  onClick={handleConfirm}
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Transferencia'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};