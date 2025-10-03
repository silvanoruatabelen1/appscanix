import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield, Settings, Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { User, UserRole } from '@/types';
import { UserDetailsModal } from '@/components/UserDetailsModal';

interface CreateUserData {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  role: UserRole;
  depositosAsignados: string[];
}

const UsersPage: React.FC = () => {
  const { user: currentUser, token } = useAuthStore();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    role: 'operador' as UserRole,
    depositosAsignados: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error cargando usuarios');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error cargando usuarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!createUserData.username || !createUserData.email || !createUserData.nombre || 
        !createUserData.apellido || !createUserData.role) {
      setError('Todos los campos son requeridos');
      return;
    }

    // Generar contraseña temporal si no se especificó
    const finalUserData = { ...createUserData };
    if (!finalUserData.password) {
      finalUserData.password = generateTemporaryPassword();
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalUserData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando usuario');
      }

      const data = await response.json();
      
      toast({
        title: '✅ Usuario creado exitosamente',
        description: `🔐 Credenciales para ${finalUserData.nombre} ${finalUserData.apellido}:\n👤 Usuario: ${finalUserData.username}\n🔑 Contraseña: ${data.temporaryPassword || finalUserData.password}\n\n⚠️ Debe cambiar la contraseña en el primer login`,
        duration: 10000, // 10 segundos para que tenga tiempo de copiar
      });

      // Limpiar formulario
      setCreateUserData({
        username: '',
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        role: 'operador' as UserRole,
        depositosAsignados: []
      });
      setShowCreateDialog(false);
      loadUsers();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error creando usuario');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error desactivando usuario');
      }

      toast({
        title: 'Usuario desactivado',
        description: 'El usuario ha sido desactivado exitosamente',
      });

      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error desactivando usuario',
        variant: 'destructive',
      });
    }
  };

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
      case 'cajero': return <Users className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra empleados y sus permisos</p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Crea una cuenta para un nuevo empleado. Se generará una contraseña temporal.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={createUserData.nombre}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={createUserData.apellido}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, apellido: e.target.value }))}
                    placeholder="Apellido"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  value={createUserData.username}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Nombre de usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña Temporal</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={createUserData.password}
                    onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Dejar vacío para generar automáticamente"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreateUserData(prev => ({ ...prev, password: generateTemporaryPassword() }))}
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={createUserData.role} 
                  onValueChange={(value) => setCreateUserData(prev => ({ ...prev, role: value as UserRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Vendedor</div>
                          <div className="text-xs text-muted-foreground">Solo escaneo y ventas</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="operador">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Operador</div>
                          <div className="text-xs text-muted-foreground">Gestión de depósitos</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Administrador</div>
                          <div className="text-xs text-muted-foreground">Acceso completo</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Usuario
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de usuarios */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.nombre} {user.apellido}</h3>
                      <Badge 
                        className={`${getRoleBadgeColor(user.role)} text-white text-xs px-2 py-0 h-5 flex items-center gap-1`}
                      >
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </Badge>
                      {!user.isActive && (
                        <Badge variant="destructive">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username} • {user.email}</p>
                    {user.depositosAsignados && user.depositosAsignados.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Depósitos: {user.depositosAsignados.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(user)}
                    title="Ver detalles del usuario"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser?.id && user.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivateUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay usuarios</h3>
            <p className="text-muted-foreground">Crea el primer usuario del sistema</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalles de usuario */}
      <UserDetailsModal
        open={showDetailsModal}
        onClose={handleCloseDetails}
        user={selectedUser}
        isAdmin={currentUser?.role === 'admin'}
      />
    </div>
  );
};

export default UsersPage;
