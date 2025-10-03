import React, { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Product, Tier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useProductStore } from '@/store/productStore';
import { dataProvider } from '@/services/dataProvider';

interface TiersDrawerProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export const TiersDrawer: React.FC<TiersDrawerProps> = ({ open, onClose, product }) => {
  const { toast } = useToast();
  const { updateProductTiers } = useProductStore();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      loadTiers();
    }
  }, [product]);

  const loadTiers = async () => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      const response = await dataProvider.getPricingTiers(product.productId);
      setTiers(response.tiers || []);
      setErrors([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error cargando tiers de precios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMin = lastTier ? (lastTier.max || lastTier.min) + 1 : 1;
    const newTier = { min: newMin, max: null, precio: 0 };
    setTiers([...tiers, newTier]);
  };

  const updateTier = (index: number, field: keyof Tier, value: number | null) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-ajustar tiers para evitar solapamientos
    if (field === 'max' && value !== null) {
      // Si se cambió el máximo, ajustar el mínimo del siguiente tier
      const nextTierIndex = index + 1;
      if (nextTierIndex < updated.length) {
        updated[nextTierIndex] = {
          ...updated[nextTierIndex],
          min: value + 1
        };
      }
    } else if (field === 'min') {
      // Si se cambió el mínimo, ajustar el máximo del tier anterior
      const prevTierIndex = index - 1;
      if (prevTierIndex >= 0) {
        updated[prevTierIndex] = {
          ...updated[prevTierIndex],
          max: value - 1
        };
      }
    }
    
    setTiers(updated);
    validateTiers(updated);
  };

  const removeTier = (index: number) => {
    const updated = tiers.filter((_, i) => i !== index);
    
    // Reajustar mínimos de todos los tiers después del eliminado
    for (let i = index; i < updated.length; i++) {
      if (i === 0) {
        updated[i].min = 1;
      } else {
        const prevTier = updated[i - 1];
        updated[i].min = (prevTier.max || prevTier.min) + 1;
      }
    }
    
    setTiers(updated);
    validateTiers(updated);
  };

  const validateTiers = (tiersToValidate: Tier[]): boolean => {
    const newErrors: string[] = [];

    tiersToValidate.forEach((tier, index) => {
      // Validación 1: min >= 1
      if (tier.min < 1) {
        newErrors.push(`Tier ${index + 1}: min debe ser >= 1`);
      }

      // Validación 2: max = null o max >= min
      if (tier.max !== null && tier.max < tier.min) {
        newErrors.push(`Tier ${index + 1}: max debe ser >= min`);
      }

      // Validación 4: precio > 0
      if (tier.precio <= 0) {
        newErrors.push(`Tier ${index + 1}: precio debe ser > 0`);
      }
    });

    // Validación 3: sin solapamientos
    for (let i = 0; i < tiersToValidate.length; i++) {
      for (let j = i + 1; j < tiersToValidate.length; j++) {
        const tier1 = tiersToValidate[i];
        const tier2 = tiersToValidate[j];
        
        const tier1Max = tier1.max || Number.MAX_VALUE;
        const tier2Max = tier2.max || Number.MAX_VALUE;
        
        if (
          (tier1.min <= tier2.min && tier2.min <= tier1Max) ||
          (tier2.min <= tier1.min && tier1.min <= tier2Max)
        ) {
          newErrors.push(`Tiers ${i + 1} y ${j + 1} se solapan`);
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!product) return;
    
    if (!validateTiers(tiers)) {
      toast({
        title: 'Error',
        description: 'Corrige los errores antes de guardar',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateProductTiers(product.productId, tiers);
      toast({ title: 'Tiers de precios actualizados' });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar tiers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>⚡ Precios por Volumen - {product.nombre}</DrawerTitle>
          <DrawerDescription>
            SKU: {product.sku} | Configura descuentos automáticos según la cantidad comprada.
            <br/>Ejemplo: 1-5 unidades a $150, 6-12 unidades a $140 c/u, 13+ unidades a $130 c/u.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="space-y-1">
                  {errors.map((error, i) => (
                    <p key={i} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Precio base:</strong> ${(product?.precioBase || 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Se aplica cuando ningún tier coincide con la cantidad
              </p>
            </div>


            {tiers.map((tier, index) => (
              <div key={tier.id || `tier-${index}`} className="p-4 border rounded-lg space-y-3 bg-card">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Rango {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTier(index)}
                    title="Eliminar este rango"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Cantidad mínima</Label>
                    <Input
                      type="number"
                      min="1"
                      value={tier.min}
                      onChange={(e) => updateTier(index, 'min', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label>Cantidad máxima</Label>
                    <Input
                      type="number"
                      min={tier.min}
                      value={tier.max || ''}
                      placeholder="Sin límite"
                      onChange={(e) => {
                        const val = e.target.value;
                        updateTier(index, 'max', val === '' ? null : parseInt(val) || null);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Precio unitario</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={tier.precio}
                      onChange={(e) => updateTier(index, 'precio', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={addTier}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Rango de Descuento
            </Button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            onClick={handleSave}
            disabled={isLoading || errors.length > 0}
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};