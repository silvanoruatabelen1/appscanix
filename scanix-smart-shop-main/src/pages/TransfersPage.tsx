import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Plus, Eye, Calendar, Package, Filter } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transfer } from '@/types';
import { dataProvider } from '@/services/dataProvider';
import { useDepositStore } from '@/store/depositStore';
import { TransferWizard } from '@/components/TransferWizard';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const TransfersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deposits, fetchDeposits } = useDepositStore();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [filterDeposit, setFilterDeposit] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchDeposits();
      const transfersData = await dataProvider.getTransfers();
      setTransfers(transfersData.sort((a, b) => 
        new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime()
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error cargando transferencias',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWizardComplete = async (transferId: string) => {
    await loadData();
    navigate(`/transfers/${transferId}`);
  };

  const getDepositName = (depositId: string) => {
    return deposits.find(d => d.id === depositId)?.nombre || depositId;
  };

  const getFilteredTransfers = () => {
    return transfers.filter(transfer => {
      // Filtro por fecha
      if (dateFrom && new Date(transfer.fechaISO) < new Date(dateFrom)) return false;
      if (dateTo && new Date(transfer.fechaISO) > new Date(dateTo)) return false;
      
      // Filtro por depósito (origen o destino)
      if (filterDeposit !== 'all') {
        if (transfer.depositoOrigenId !== filterDeposit && transfer.depositoDestinoId !== filterDeposit) {
          return false;
        }
      }
      
      // Filtro por estado
      if (filterStatus !== 'all' && transfer.estado !== filterStatus) return false;
      
      return true;
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando transferencias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Transferencias</h1>
        </div>
        <Button variant="gradient" onClick={() => setShowWizard(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Transferencia
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg p-4 mb-6 border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="dateFrom">Desde</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="dateTo">Hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filterDeposit">Depósito</Label>
            <Select value={filterDeposit} onValueChange={setFilterDeposit}>
              <SelectTrigger id="filterDeposit">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los depósitos</SelectItem>
                {deposits.map(deposit => (
                  <SelectItem key={deposit.id} value={deposit.id}>
                    {deposit.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filterStatus">Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filterStatus">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {getFilteredTransfers().length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center">
          <ArrowLeftRight className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay transferencias</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera transferencia entre depósitos
          </p>
          <Button variant="gradient" onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transferencia
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {getFilteredTransfers().map((transfer) => (
            <div key={transfer.id} className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ArrowLeftRight className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{transfer.id}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(transfer.fechaISO), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    transfer.estado === 'completado' 
                      ? 'bg-green-100 text-green-700' 
                      : transfer.estado === 'pendiente'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transfer.estado.charAt(0).toUpperCase() + transfer.estado.slice(1)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/transfers/${transfer.id}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Origen</p>
                  <p className="font-medium">{getDepositName(transfer.depositoOrigenId)}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Destino</p>
                  <p className="font-medium">{getDepositName(transfer.depositoDestinoId)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {transfer.items.length} producto{transfer.items.length !== 1 ? 's' : ''} transferido{transfer.items.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Total: {transfer.items.reduce((sum, item) => sum + item.cantidad, 0)} unidades
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <TransferWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleWizardComplete}
      />
    </div>
  );
};

export default TransfersPage;