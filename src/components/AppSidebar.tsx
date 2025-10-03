import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  ScanLine, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  ArrowLeftRight,
  FileBarChart,
  Home,
  PlusCircle
} from 'lucide-react';
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

const menuItems = [
  {
    title: 'Operaciones',
    items: [
      { title: 'Escanear', url: '/scan', icon: ScanLine },
      { title: 'Carrito', url: '/cart', icon: ShoppingCart },
    ],
  },
  {
    title: 'Administración',
    items: [
      { title: 'Productos', url: '/products', icon: Package },
      { title: 'Depósitos', url: '/deposits', icon: Warehouse },
      { title: 'Transferencias', url: '/transfers', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { title: 'Dashboard', url: '/reports', icon: FileBarChart },
    ],
  },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

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
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-accent/50'
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
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