import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/custom-button';
import { User, LogOut, Map } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/scan': 'Escanear Productos',
  '/cart': 'Carrito de Compras',
  '/products': 'Gestión de Productos',
  '/deposits': 'Gestión de Depósitos',
  '/transfers': 'Transferencias',
  '/reports': 'Dashboard de Reportes',
  '/dev/sitemap': 'Sitemap de Desarrollo',
};

export const AppHeader: React.FC = () => {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || 'SCANIX';

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold text-foreground">{currentTitle}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {import.meta.env.DEV && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dev/sitemap">
              <Map className="h-4 w-4 mr-2" />
              Sitemap
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <User className="h-4 w-4 mr-2" />
          Admin
        </Button>
        <Button variant="ghost" size="icon">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};