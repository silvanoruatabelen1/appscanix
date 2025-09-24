import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, TrendingUp, Receipt, Package, Filter } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket } from '@/types';
import { dataProvider } from '@/services/dataProvider';
import { useDepositStore } from '@/store/depositStore';
import { exportToCSV } from '@/utils/exportCsv';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface StockMovement {
  id: string;
  depositoId: string;
  productId: string;
  producto: string;
  tipo: string;
  delta: number;
  motivo: string;
  fechaISO: string;
  referencia?: string;
}

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const { deposits, fetchDeposits } = useDepositStore();
  
  // Estados para filtros
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDeposit, setSelectedDeposit] = useState('all');
  const [movementType, setMovementType] = useState('all');
  
  // Estados para datos
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // KPIs del sistema
  const [systemKpis, setSystemKpis] = useState<any>(null);
  
  // KPIs calculados para reportes
  const [kpis, setKpis] = useState({
    totalVentas: 0,
    cantidadTickets: 0,
    topProductos: [] as { productId: string; nombre: string; cantidad: number }[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateKPIs();
  }, [tickets, dateFrom, dateTo]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, selectedDeposit, movementType]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchDeposits();
      
      // Cargar KPIs del sistema
      const kpisData = await dataProvider.getKPIs();
      setSystemKpis(kpisData);
      
      // Cargar reporte de ventas
      const salesReport = await dataProvider.getSalesReport(dateFrom, dateTo, selectedDeposit !== 'all' ? selectedDeposit : undefined);
      setTickets(salesReport.tickets);
      setKpis({
        totalVentas: salesReport.totalVentas,
        cantidadTickets: salesReport.cantidadTickets,
        topProductos: salesReport.productosMasVendidos
      });
      
      // Cargar reporte de stock
      const stockReport = await dataProvider.getStockReport(
        selectedDeposit !== 'all' ? selectedDeposit : undefined,
        dateFrom,
        dateTo,
        movementType !== 'all' ? movementType : undefined
      );
      setMovements(stockReport.movimientos);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: 'Error',
        description: 'Error cargando datos de reportes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateKPIs = () => {
    const filteredTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.fechaISO);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      return ticketDate >= fromDate && ticketDate <= toDate;
    });

    const totalVentas = filteredTickets.reduce((sum, ticket) => sum + ticket.total, 0);
    const cantidadTickets = filteredTickets.length;

    // Calcular top productos
    const productSales: Record<string, { nombre: string; cantidad: number }> = {};
    
    filteredTickets.forEach(ticket => {
      ticket.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { nombre: item.nombre, cantidad: 0 };
        }
        productSales[item.productId].cantidad += item.qty;
      });
    });

    const topProductos = Object.entries(productSales)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    setKpis({ totalVentas, cantidadTickets, topProductos });
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.fechaISO);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      return ticketDate >= fromDate && ticketDate <= toDate;
    });
  };

  const getFilteredMovements = () => {
    return movements.filter(movement => {
      const movDate = new Date(movement.fechaISO);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      
      const dateMatch = movDate >= fromDate && movDate <= toDate;
      const depositMatch = selectedDeposit === 'all' || movement.depositoId === selectedDeposit;
      const typeMatch = movementType === 'all' || movement.tipo === movementType;
      
      return dateMatch && depositMatch && typeMatch;
    });
  };

  const exportSalesCSV = () => {
    const filteredTickets = getFilteredTickets();
    const csvData = filteredTickets.map(ticket => ({
      ID: ticket.id,
      Fecha: format(new Date(ticket.fechaISO), 'dd/MM/yyyy HH:mm'),
      Total: ticket.total.toFixed(2),
      'Cantidad Items': ticket.items.reduce((sum, item) => sum + item.qty, 0),
      Depósito: deposits.find(d => d.id === ticket.depositoId)?.nombre || ticket.depositoId
    }));

    exportToCSV(csvData, `ventas_${dateFrom}_${dateTo}.csv`);
    toast({ title: 'CSV exportado exitosamente' });
  };

  const exportStockCSV = () => {
    const filteredMovements = getFilteredMovements();
    const csvData = filteredMovements.map(movement => ({
      ID: movement.id,
      Fecha: format(new Date(movement.fechaISO), 'dd/MM/yyyy HH:mm'),
      Depósito: deposits.find(d => d.id === movement.depositoId)?.nombre || movement.depositoId,
      Producto: movement.producto || movement.productId,
      Tipo: movement.tipo,
      Delta: movement.delta,
      Motivo: movement.motivo || '',
      Referencia: movement.referencia || ''
    }));

    exportToCSV(csvData, `stock_movimientos_${dateFrom}_${dateTo}.csv`);
    toast({ title: 'CSV exportado exitosamente' });
  };

  const getDepositName = (depositId: string) => {
    return deposits.find(d => d.id === depositId)?.nombre || depositId;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileBarChart className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Cargando reportes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <FileBarChart className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard de Reportes</h1>
      </div>

      {/* KPIs del Sistema */}
      {systemKpis && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">KPIs del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemKpis.productos?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemKpis.productos?.stockBajo || 0} con stock bajo
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Depósitos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemKpis.depositos?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Activos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${systemKpis.ventasDelMes?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {systemKpis.ventasDelMes?.cantidad || 0} tickets
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transferencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemKpis.transferenciasDelMes?.cantidad || 0}</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${systemKpis.inventario?.valorTotal || 0}</div>
                <p className="text-xs text-muted-foreground">Valor total</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* KPIs de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.totalVentas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Período: {format(new Date(dateFrom), 'dd/MM')} - {format(new Date(dateTo), 'dd/MM')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.cantidadTickets}</div>
            <p className="text-xs text-muted-foreground">
              Transacciones realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {kpis.topProductos.slice(0, 3).map((product, index) => (
                <div key={product.productId} className="flex justify-between text-sm">
                  <span className="truncate">{index + 1}. {product.nombre}</span>
                  <Badge variant="secondary">{product.cantidad}</Badge>
                </div>
              ))}
              {kpis.topProductos.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Fecha */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateFrom">Fecha Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Fecha Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Reportes */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>

        {/* Tab de Ventas */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Reporte de Ventas</CardTitle>
                  <CardDescription>
                    Historial de tickets y transacciones
                  </CardDescription>
                </div>
                <Button onClick={exportSalesCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredTickets().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay tickets en el período seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-right p-2">Items</th>
                          <th className="text-left p-2">Depósito</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredTickets().map((ticket) => (
                          <tr key={ticket.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-mono text-sm">{ticket.id}</td>
                            <td className="p-2 text-sm">
                              {format(new Date(ticket.fechaISO), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${ticket.total.toFixed(2)}
                            </td>
                            <td className="p-2 text-right">
                              {ticket.items.reduce((sum, item) => sum + item.qty, 0)}
                            </td>
                            <td className="p-2 text-sm">
                              {getDepositName(ticket.depositoId)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Stock */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Movimientos de Stock</CardTitle>
                  <CardDescription>
                    Historial de entradas, salidas y transferencias
                  </CardDescription>
                </div>
                <Button onClick={exportStockCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtros adicionales para stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Depósito</Label>
                  <Select value={selectedDeposit} onValueChange={setSelectedDeposit}>
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label>Tipo de Movimiento</Label>
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                {getFilteredMovements().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos en el período seleccionado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-left p-2">Depósito</th>
                          <th className="text-left p-2">Producto</th>
                          <th className="text-center p-2">Tipo</th>
                          <th className="text-right p-2">Delta</th>
                          <th className="text-left p-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredMovements().map((movement) => (
                          <tr key={movement.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-sm">
                              {format(new Date(movement.fechaISO), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="p-2 text-sm">
                              {getDepositName(movement.depositoId)}
                            </td>
                            <td className="p-2 text-sm">
                              {movement.producto || movement.productId}
                            </td>
                            <td className="p-2 text-center">
                              <Badge 
                                variant={
                                  movement.tipo === 'entrada' ? 'default' :
                                  movement.tipo === 'salida' ? 'destructive' :
                                  movement.tipo === 'transferencia' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {movement.tipo}
                              </Badge>
                            </td>
                            <td className={`p-2 text-right font-medium ${
                              movement.delta > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {movement.delta > 0 ? '+' : ''}{movement.delta}
                            </td>
                            <td className="p-2 text-sm text-muted-foreground">
                              {movement.motivo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;