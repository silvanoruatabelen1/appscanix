import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, hasRole } from '@/store/authStore';
import { UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
    resourceData?: any;
  };
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermission,
  fallback
}) => {
  const { user, isAuthenticated, hasPermission } = useAuthStore();

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles requeridos
  if (requiredRoles.length > 0 && !hasRole(user, requiredRoles)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para acceder a esta sección.
            <br />
            <span className="text-sm text-muted-foreground">
              Tu rol: <strong>{user.role}</strong> | Requerido: <strong>{requiredRoles.join(', ')}</strong>
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificar permisos específicos
  if (requiredPermission) {
    const { resource, action, resourceData } = requiredPermission;
    if (!hasPermission(resource, action, resourceData)) {
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para realizar esta acción.
              <br />
              <span className="text-sm text-muted-foreground">
                Acción requerida: <strong>{resource}:{action}</strong>
              </span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
