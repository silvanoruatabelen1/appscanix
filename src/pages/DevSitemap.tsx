import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ScanLine, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  ArrowLeftRight, 
  FileBarChart,
  Receipt,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/custom-button';

const DevSitemap: React.FC = () => {
  const routes = [
    {
      category: 'Operaciones',
      items: [
        { path: '/scan', name: 'Escanear Productos', icon: ScanLine, description: 'Página principal de escaneo' },
        { path: '/cart', name: 'Carrito de Compras', icon: ShoppingCart, description: 'Carrito con tiers de precios' },
        { path: '/ticket/DEMO-001', name: 'Ticket (DEMO)', icon: Receipt, description: 'Ejemplo de ticket generado' },
      ]
    },
    {
      category: 'Administración',
      items: [
        { path: '/products', name: 'Gestión de Productos', icon: Package, description: 'CRUD de productos y stock' },
        { path: '/deposits', name: 'Gestión de Depósitos', icon: Warehouse, description: 'Administrar depósitos y ubicaciones' },
        { path: '/transfers', name: 'Transferencias', icon: ArrowLeftRight, description: 'Wizard de transferencias entre depósitos' },
        { path: '/transfers/DEMO-TRANSFER', name: 'Detalle Transferencia (DEMO)', icon: ArrowLeftRight, description: 'Ejemplo de remito de transferencia' },
      ]
    },
    {
      category: 'Reportes',
      items: [
        { path: '/reports', name: 'Dashboard de Reportes', icon: FileBarChart, description: 'KPIs, ventas y movimientos de stock' },
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Map className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Sitemap de Desarrollo</h1>
          <p className="text-muted-foreground">Navegación rápida a todas las páginas de SCANIX</p>
        </div>
      </div>

      <div className="grid gap-8">
        {routes.map((category) => (
          <div key={category.category} className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-primary">{category.category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.items.map((route) => (
                <Link 
                  key={route.path} 
                  to={route.path}
                  className="group block"
                >
                  <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <route.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {route.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {route.description}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {route.path}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">Información de Desarrollo</h3>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p>• Esta página solo está visible en modo desarrollo (DEV)</p>
          <p>• Los elementos marcados como "DEMO" usan datos de ejemplo</p>
          <p>• Usa Ctrl+B para alternar el sidebar</p>
          <p>• El estado del sidebar se persiste en localStorage</p>
        </div>
      </div>
    </div>
  );
};

export default DevSitemap;
