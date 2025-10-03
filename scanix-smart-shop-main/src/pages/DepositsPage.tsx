import React, { useState, useEffect } from 'react';
import { Warehouse, Plus, Edit, Trash2, MapPin, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useDepositStore } from '@/store/depositStore';
import { dataProvider } from '@/services/dataProvider';
import { Deposit } from '@/types';
import { format } from 'date-fns';

const DepositsPage: React.FC = () => {
  const { toast } = useToast();
  const { deposits, fetchDeposits, createDeposit, updateDeposit, deleteDeposit } = useDepositStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stockData, setStockData] = useState<any[]>([]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    activo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchDeposits();
      await loadStockData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error cargando datos de depósitos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockData = async () => {
    try {
      const stockPromises = deposits.map(async (deposit) => {
        const stock = await dataProvider.getStock(deposit.id);
        const totalProducts = stock.length;
        const totalQuantity = stock.reduce((sum, item) => sum + item.cantidad, 0);
        const lowStockItems = stock.filter(item => item.cantidad < 10).length;
        
        return {
          depositId: deposit.id,
          totalProducts,
          totalQuantity,
          lowStockItems
        };
      });
      
      const stockResults = await Promise.all(stockPromises);
      setStockData(stockResults);
    } catch (error) {
      console.error('Error cargando datos de stock:', error);
    }
  };

  const handleCreate = () => {
    setFormData({ nombre: '', direccion: '', activo: true });
    setIsEditing(false);
    setSelectedDeposit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (deposit: Deposit) => {
    setFormData({
      nombre: deposit.nombre,
      direccion: deposit.direccion || '',
      activo: deposit.activo
    });
    setIsEditing(true);
    setSelectedDeposit(deposit);
    setIsModalOpen(true);
  };

  const handleDelete = async (deposit: Deposit) => {
    if (window.confirm(`¿Estás seguro de eliminar el depósito "${deposit.nombre}"?`)) {
      try {
        await deleteDeposit(deposit.id);
        toast({ title: 'Depósito eliminado correctamente' });
        await loadData();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error eliminando depósito',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedDeposit) {
        await updateDeposit(selectedDeposit.id, formData);
        toast({ title: 'Depósito actualizado correctamente' });
      } else {
        await createDeposit(formData);
        toast({ title: 'Depósito creado correctamente' });
      }
      
      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: isEditing ? 'Error actualizando depósito' : 'Error creando depósito',
        variant: 'destructive',
      });
    }
  };

  const getStockInfo = (depositId: string) => {
    return stockData.find(s => s.depositId === depositId) || {
      totalProducts: 0,
      totalQuantity: 0,
      lowStockItems: 0
    };
  };

  const filteredDeposits = deposits.filter(deposit =>
    deposit.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deposit.direccion && deposit.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando depósitos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Depósitos</h1>
            <p className="text-muted-foreground">
              Administra tus depósitos y controla el inventario
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Depósito
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredDeposits.length} depósito{filteredDeposits.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Grid de Depósitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeposits.map((deposit) => {
          const stockInfo = getStockInfo(deposit.id);
          return (
            <Card key={deposit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{deposit.nombre}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(deposit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(deposit)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {deposit.direccion && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{deposit.direccion}</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant={deposit.activo ? "default" : "secondary"}>
                      {deposit.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Información de Stock */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span>{stockInfo.totalProducts} productos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{stockInfo.totalQuantity} unidades</span>
                    </div>
                  </div>

                  {/* Alerta de Stock Bajo */}
                  {stockInfo.lowStockItems > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        {stockInfo.lowStockItems} producto{stockInfo.lowStockItems !== 1 ? 's' : ''} con stock bajo
                      </span>
                    </div>
                  )}

                  {/* Fecha de Creación */}
                  <div className="text-xs text-muted-foreground">
                    Creado: {format(new Date(deposit.fechaCreacion), 'dd/MM/yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Creación/Edición */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Depósito' : 'Nuevo Depósito'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Depósito Principal"
                required
              />
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ej: Av. Libertador 1234, San Francisco"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activo">Estado activo</Label>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepositsPage;