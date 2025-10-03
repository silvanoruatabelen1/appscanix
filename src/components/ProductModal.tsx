import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/custom-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Product } from '@/types';
import { useProductStore } from '@/store/productStore';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU es requerido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  unidad: z.string().min(1, 'Unidad es requerida'),
  precioBase: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  activo: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ open, onClose, product }) => {
  const { toast } = useToast();
  const { createProduct, updateProduct, products } = useProductStore();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      nombre: '',
      unidad: 'unidad',
      precioBase: 0,
      activo: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        nombre: product.nombre,
        unidad: (product as any).unidad || 'unidad',
        precioBase: product.precioBase,
        activo: (product as any).activo !== false,
      });
    } else {
      reset({
        sku: '',
        nombre: '',
        unidad: 'unidad',
        precioBase: 0,
        activo: true,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Validar SKU único si es creación o si cambió
      if (!isEditing || (isEditing && data.sku !== product.sku)) {
        const skuExists = products.some(p => p.sku.toLowerCase() === data.sku.toLowerCase());
        if (skuExists) {
          toast({
            title: 'Error',
            description: 'El SKU ya existe',
            variant: 'destructive',
          });
          return;
        }
      }

      if (isEditing) {
        await updateProduct(product.productId, data);
        toast({ title: 'Producto actualizado correctamente' });
      } else {
        await createProduct(data as any);
        toast({ title: 'Producto creado correctamente' });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing ? 'Error al actualizar producto' : 'Error al crear producto',
        variant: 'destructive',
      });
    }
  };

  const activo = watch('activo');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              {...register('sku')}
              disabled={isEditing}
              placeholder="LAP-001"
            />
            {errors.sku && (
              <p className="text-sm text-destructive mt-1">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Laptop Dell Inspiron"
            />
            {errors.nombre && (
              <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="unidad">Unidad *</Label>
            <Input
              id="unidad"
              {...register('unidad')}
              placeholder="unidad, kg, metro, etc."
            />
            {errors.unidad && (
              <p className="text-sm text-destructive mt-1">{errors.unidad.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="precioBase">Precio Base *</Label>
            <Input
              id="precioBase"
              type="number"
              step="0.01"
              {...register('precioBase', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.precioBase && (
              <p className="text-sm text-destructive mt-1">{errors.precioBase.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="activo">Estado activo</Label>
            <Switch
              id="activo"
              checked={activo}
              onCheckedChange={(checked) => setValue('activo', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};