import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: (success: boolean) => void;
  isFirstLogin?: boolean;
  username: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  open, 
  onClose, 
  isFirstLogin = false,
  username 
}) => {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!passwords.new || !passwords.confirm) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (passwords.new.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (isFirstLogin && passwords.new === passwords.current) {
      setError('La nueva contraseña debe ser diferente a la temporal');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          currentPassword: passwords.current,
          newPassword: passwords.new
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar contraseña');
      }

      toast({
        title: '✅ Contraseña cambiada exitosamente',
        description: isFirstLogin 
          ? 'Ya puedes usar el sistema con tu nueva contraseña' 
          : 'Tu contraseña ha sido actualizada',
      });

      onClose(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <Dialog open={open} onOpenChange={() => !isFirstLogin && onClose(false)}>
      <DialogContent className="sm:max-w-[400px]" hideCloseButton={isFirstLogin}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isFirstLogin ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Lock className="w-5 h-5 text-primary" />
            )}
            <DialogTitle>
              {isFirstLogin ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isFirstLogin 
              ? 'Debes cambiar tu contraseña temporal antes de continuar usando el sistema.'
              : 'Ingresa tu contraseña actual y la nueva contraseña.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isFirstLogin && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Usuario:</strong> {username}<br />
                Ingresa tu contraseña temporal actual y define una nueva.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current">
              {isFirstLogin ? 'Contraseña Temporal' : 'Contraseña Actual'}
            </Label>
            <div className="relative">
              <Input
                id="current"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                placeholder={isFirstLogin ? 'Ingresa tu contraseña temporal' : 'Contraseña actual'}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => toggleShowPassword('current')}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="new"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new}
                onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => toggleShowPassword('new')}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="Repite la nueva contraseña"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => toggleShowPassword('confirm')}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {!isFirstLogin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className={isFirstLogin ? 'w-full' : 'flex-1'}
            >
              {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
