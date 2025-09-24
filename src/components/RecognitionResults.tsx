import React from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { RecognizedItem } from '@/types';
import { cn } from '@/lib/utils';

interface RecognitionResultsProps {
  items: RecognizedItem[];
  isVisible: boolean;
}

export const RecognitionResults: React.FC<RecognitionResultsProps> = ({
  items,
  isVisible,
}) => {
  if (!isVisible || items.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-lg p-4 max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h3 className="font-semibold text-foreground">Productos reconocidos</h3>
        </div>
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.sku}-${index}`}
              className="flex items-center justify-between p-2 bg-accent/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    SKU: {item.sku} • Cant: {item.qty}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    item.confianza >= 0.9
                      ? "bg-success/20 text-success"
                      : item.confianza >= 0.8
                      ? "bg-warning/20 text-warning"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {(item.confianza * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};