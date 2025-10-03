import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/custom-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Map, Settings, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

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
  const { user, logout } = useAuthStore();
  const currentTitle = routeTitles[location.pathname] || 'SCANIX';

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'operador': return 'bg-blue-500';
      case 'cajero': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'operador': return <Settings className="h-3 w-3" />;
      case 'cajero': return <User className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

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
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.nombre}</span>
                  <Badge 
                    className={`${getRoleBadgeColor(user.role)} text-white text-xs px-2 py-0 h-5 flex items-center gap-1`}
                  >
                    {getRoleIcon(user.role)}
                    <span className="capitalize">{user.role}</span>
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.nombre} {user.apellido}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {user.role === 'operador' && user.depositosAsignados && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Depósitos asignados:
                    </DropdownMenuLabel>
                    {user.depositosAsignados.map(depositId => (
                      <DropdownMenuItem key={depositId} className="text-xs pl-6">
                        {depositId}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
    </header>
  );
};