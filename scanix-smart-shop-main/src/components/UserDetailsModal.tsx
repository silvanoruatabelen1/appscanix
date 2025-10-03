import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  MapPin, 
  Clock, 
  Copy, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UserDetailsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType | null;
  isAdmin?: boolean;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  open, 
  onClose, 
  user,
  isAdmin = false 
}) => {
  const { toast } = useToast();
  const [showTempPassword, setShowTempPassword] = useState(false);

  if (!user) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: '📋 Copiado',
        description: `${label} copiado al portapapeles`,
        duration: 2000,
      });
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'operador': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cajero': return 'bg-green-100 text-green-800 border-green-200';
      case 'vendedor': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'operador': return '⚙️';
      case 'cajero': return '💰';
      case 'vendedor': return '🛒';
      default: return '👤';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Detalles del Usuario</DialogTitle>
              <DialogDescription>
                Información completa de {user.nombre} {user.apellido}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-4 h-4" />
              Información Personal
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.nombre}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Apellido</label>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.apellido}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{user.email}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Información de Cuenta */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Información de Cuenta
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{user.username}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(user.username, 'Usuario')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Rol</label>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="flex items-center gap-2">
                  {user.isActive ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contraseña Temporal (solo para admins y si requiere cambio) */}
              {isAdmin && user.requiresPasswordChange && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Contraseña Temporal</label>
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium mb-1">Usuario debe cambiar contraseña</p>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded text-sm">
                              {showTempPassword ? (user.temporaryPassword || '••••••••') : '••••••••'}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setShowTempPassword(!showTempPassword)}
                            >
                              {showTempPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(user.temporaryPassword || '', 'Contraseña temporal')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          {/* Información de Fechas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historial
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Fecha de Creación
                </label>
                <p className="text-sm">{formatDate(user.fechaCreacion)}</p>
              </div>

              {user.ultimoAcceso && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Último Acceso
                  </label>
                  <p className="text-sm">{formatDate(user.ultimoAcceso)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Depósitos Asignados */}
          {user.depositosAsignados && user.depositosAsignados.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Depósitos Asignados
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.depositosAsignados.map((deposito, index) => (
                  <Badge key={index} variant="outline">
                    {deposito}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
