import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ScanLine, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  ArrowLeftRight,
  FileBarChart,
  Home,
  PlusCircle,
  Shield,
  Settings,
  User
} from 'lucide-react';
import { useAuthStore, hasRole } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

// Roles válidos del sistema
const VALID_ROLES = ['admin', 'operador', 'cajero'];

// Definir elementos del menú con permisos
const getMenuItems = (userRole: string) => {
  console.log('🔍 Generando menú para rol:', userRole);
  
  // Validar que el rol sea válido
  if (!VALID_ROLES.includes(userRole)) {
    console.error('❌ Rol inválido detectado:', userRole);
    console.warn('⚠️ Roles válidos:', VALID_ROLES);
    return []; // Retornar vacío si el rol no es válido
  }
  const baseItems = [];

  // Operaciones (Cajeros y Admins)
  if (['cajero', 'admin'].includes(userRole)) {
    baseItems.push({
      title: 'Operaciones',
      items: [
        {
          title: 'Escanear',
          url: '/scan',
          icon: ScanLine,
          badge: userRole === 'cajero' ? 'Principal' : undefined,
        },
        {
          title: 'Carrito',
          url: '/cart',
          icon: ShoppingCart,
        },
      ],
    });
  }

  // Administración (Operadores y Admins)
  if (['operador', 'admin'].includes(userRole)) {
    console.log('✅ Usuario tiene acceso a Administración');
    const adminItems = [];
    
    // Productos (Operadores y Admins)
    adminItems.push({
      title: 'Productos',
      url: '/products',
      icon: Package,
      badge: userRole === 'operador' ? 'Principal' : undefined,
    });
    
    adminItems.push(
      {
        title: 'Depósitos',
        url: '/deposits',
        icon: Warehouse,
      },
      {
        title: 'Transferencias',
        url: '/transfers',
        icon: ArrowLeftRight,
      },
      {
        title: 'Reportes',
        url: '/reports',
        icon: FileBarChart,
      }
    );

    baseItems.push({
      title: 'Administración',
      items: adminItems,
    });
  }

  // Sistema (Solo Admins)
  if (userRole === 'admin') {
    baseItems.push({
      title: 'Sistema',
      items: [
        {
          title: 'Usuarios',
          url: '/users',
          icon: User,
          badge: 'Admin',
        },
      ],
    });
  }

  console.log('📋 Items del menú generados:', baseItems.length, 'grupos');
  return baseItems;
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user, logout } = useAuthStore();
  const isCollapsed = state === 'collapsed';
  
  // Efecto para detectar roles inválidos y forzar logout
  useEffect(() => {
    if (user && !VALID_ROLES.includes(user.role)) {
      console.error('🚨 ROL INVÁLIDO DETECTADO:', user.role);
      console.warn('🔄 Limpiando sesión y forzando logout...');
      
      // Limpiar localStorage completamente
      localStorage.clear();
      
      // Hacer logout
      logout();
      
      // Redirigir al login
      navigate('/login', { replace: true });
      
      // Recargar la página para limpiar cualquier estado residual
      window.location.reload();
    }
  }, [user, logout, navigate]);
  
  // Si no hay usuario, retornar array vacío
  if (!user) {
    return null;
  }
  
  const menuItems = getMenuItems(user.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ScanLine className="w-6 h-6 text-primary" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg">SCANIX</h2>
                <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
              </div>
            )}
          </div>
        </div>

        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? 'bg-primary/10 text-primary font-medium flex items-center justify-between w-full'
                            : 'hover:bg-accent/50 flex items-center justify-between w-full'
                        }
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </div>
                        {!isCollapsed && item.badge && (
                          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};