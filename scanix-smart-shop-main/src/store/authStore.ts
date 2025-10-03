import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, UserRole } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (resource: string, action: string, resourceData?: any) => boolean;
  token: string | null;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  depositosAsignados?: string[];
}

// Función helper para hacer requests autenticados
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(errorData.error || 'Error en la petición');
  }

  return response.json();
};

// Definición de permisos por rol
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'products:create', 'products:read', 'products:update', 'products:delete',
    'deposits:create', 'deposits:read', 'deposits:update', 'deposits:delete',
    'stock:create', 'stock:read', 'stock:update', 'stock:delete',
    'transfers:create', 'transfers:read', 'transfers:update', 'transfers:delete',
    'tickets:create', 'tickets:read', 'tickets:update', 'tickets:delete',
    'reports:read', 'reports:export',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'settings:read', 'settings:update',
    'scan:create', 'scan:read',
    'cart:create', 'cart:read', 'cart:update', 'cart:delete'
  ],
  operador: [
    'products:read',
    'deposits:read', 'deposits:update', 'deposits:create', // Solo depósitos asignados
    'stock:create', 'stock:read', 'stock:update',
    'transfers:create', 'transfers:read', 'transfers:update',
    'tickets:read'
  ],
  cajero: [
    'products:read',
    'tickets:create', 'tickets:read',
    'scan:create', 'scan:read',
    'cart:create', 'cart:read', 'cart:update', 'cart:delete'
  ]
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al iniciar sesión');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al registrar usuario');
          }

          const data = await response.json();
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          });
          
          return data.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await makeAuthenticatedRequest('/auth/logout', {
              method: 'POST',
            });
          }
        } catch (error) {
          console.warn('Error al cerrar sesión en el servidor:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...userData }
          });
        }
      },

      hasPermission: (resource: string, action: string, resourceData?: any) => {
        const { user } = get();
        if (!user) return false;
        
        const permission = `${resource}:${action}`;
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        
        // Verificar permiso básico
        if (!userPermissions.includes(permission)) {
          return false;
        }
        
        // Verificaciones específicas por rol
        if (user.role === 'operador') {
          // Los operadores solo pueden acceder a sus depósitos asignados
          if (resource === 'deposits' || resource === 'stock' || resource === 'transfers') {
            if (resourceData?.depositoId && user.depositosAsignados) {
              return user.depositosAsignados.includes(resourceData.depositoId);
            }
            if (resourceData?.depositoOrigenId && user.depositosAsignados) {
              return user.depositosAsignados.includes(resourceData.depositoOrigenId);
            }
            if (resourceData?.depositoDestinoId && user.depositosAsignados) {
              return user.depositosAsignados.includes(resourceData.depositoDestinoId);
            }
          }
        }
        
        return true;
      }
    }),
    {
      name: 'scanix-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Función helper para verificar roles
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

// Función helper para verificar si es admin
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ['admin']);
};

// Función helper para verificar si es operador
export const isOperador = (user: User | null): boolean => {
  return hasRole(user, ['operador']);
};

// Función helper para verificar si es cajero
export const isCajero = (user: User | null): boolean => {
  return hasRole(user, ['cajero']);
};
