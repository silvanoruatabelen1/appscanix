import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartLine } from '@/types';
import { Button } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

interface CartTableProps {
  lines: CartLine[];
  onUpdateQty: (sku: string, qty: number) => void;
  onRemoveLine: (sku: string) => void;
  isLoading?: boolean;
}

export const CartTable: React.FC<CartTableProps> = ({
  lines,
  onUpdateQty,
  onRemoveLine,
  isLoading = false,
}) => {
  const handleQtyChange = (sku: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, Math.min(999, currentQty + delta));
    if (newQty === 0) {
      onRemoveLine(sku);
    } else {
      onUpdateQty(sku, newQty);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">El carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">SKU</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Producto</th>
            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Cantidad</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Precio Unit.</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Subtotal</th>
            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr
              key={line.sku}
              className={cn(
                "border-b border-border hover:bg-accent/50 transition-colors",
                isLoading && "opacity-50"
              )}
            >
              <td className="py-4 px-4 font-mono text-sm">{line.sku}</td>
              <td className="py-4 px-4">{line.nombre}</td>
              <td className="py-4 px-4">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQtyChange(line.sku, line.qty, -1)}
                    disabled={isLoading}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    value={line.qty}
                    onChange={(e) => {
                      const newQty = parseInt(e.target.value) || 0;
                      onUpdateQty(line.sku, newQty);
                    }}
                    className="w-16 text-center border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    min="1"
                    max="999"
                    disabled={isLoading}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQtyChange(line.sku, line.qty, 1)}
                    disabled={isLoading}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </td>
              <td className="py-4 px-4 text-right font-mono">
                ${line.precioAplicado.toFixed(2)}
              </td>
              <td className="py-4 px-4 text-right font-mono font-semibold">
                ${line.subtotal.toFixed(2)}
              </td>
              <td className="py-4 px-4 text-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveLine(line.sku)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};