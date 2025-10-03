import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Transfer } from '@/types';
import { dataProvider } from '@/services/dataProvider';
import { useDepositStore } from '@/store/depositStore';
import { format } from 'date-fns';

const TransferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deposits } = useDepositStore();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransfer();
  }, [id]);

  const loadTransfer = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const transfers = await dataProvider.getTransfers();
      const found = transfers.find(t => t.id === id);
      setTransfer(found || null);
    } catch (error) {
      console.error('Error cargando transferencia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    // Crear una nueva ventana para imprimir solo el remito
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const remitoHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Remito ${transfer.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              font-size: 14px; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #000; 
              padding-bottom: 20px; 
            }
            .header h1 { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            .header .transfer-info {
              font-size: 16px;
              color: #666;
            }
            .deposits-section {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 20px;
              margin-bottom: 30px;
              align-items: center;
            }
            .deposit-info {
              border: 2px solid #333;
              padding: 15px;
              border-radius: 8px;
            }
            .deposit-info h3 {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #333;
            }
            .deposit-info p {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .arrow {
              font-size: 24px;
              color: #007bff;
              text-align: center;
            }
            .products-section {
              margin-bottom: 30px;
            }
            .products-section h3 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .products-table th,
            .products-table td {
              border: 1px solid #333;
              padding: 8px 12px;
              text-align: left;
            }
            .products-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .products-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-section {
              margin-bottom: 30px;
              text-align: center;
            }
            .status {
              display: inline-block;
              background-color: #28a745;
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-weight: bold;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 40px;
            }
            .signature-line {
              border-top: 2px solid #333;
              padding-top: 10px;
              text-align: center;
            }
            .signature-line p {
              font-size: 14px;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REMITO DE TRANSFERENCIA</h1>
            <div class="transfer-info">
              <p><strong>Número:</strong> ${transfer.id}</p>
              <p><strong>Fecha:</strong> ${format(new Date(transfer.fechaISO), 'dd/MM/yyyy HH:mm:ss')}</p>
            </div>
          </div>
          
          <div class="deposits-section">
            <div class="deposit-info">
              <h3>Depósito Origen</h3>
              <p><strong>${getDepositName(transfer.depositoOrigenId)}</strong></p>
              <p>${getDepositAddress(transfer.depositoOrigenId)}</p>
            </div>
            <div class="arrow">→</div>
            <div class="deposit-info">
              <h3>Depósito Destino</h3>
              <p><strong>${getDepositName(transfer.depositoDestinoId)}</strong></p>
              <p>${getDepositAddress(transfer.depositoDestinoId)}</p>
            </div>
          </div>

          <div class="products-section">
            <h3>Productos Transferidos</h3>
            <table class="products-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                ${transfer.items.map(item => `
                  <tr>
                    <td>${item.sku}</td>
                    <td>${item.nombre}</td>
                    <td>${item.cantidad}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p><strong>Total Items:</strong> ${transfer.items.length}</p>
          </div>

          <div class="status-section">
            <div class="status">${transfer.estado.toUpperCase()}</div>
          </div>

          <div class="signatures">
            <div class="signature-line">
              <p>Entregado por</p>
            </div>
            <div class="signature-line">
              <p>Recibido por</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(remitoHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const getDepositName = (depositId: string) => {
    return deposits.find(d => d.id === depositId)?.nombre || depositId;
  };

  const getDepositAddress = (depositId: string) => {
    return deposits.find(d => d.id === depositId)?.direccion || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Cargando remito...</p>
        </div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Transferencia no encontrada</p>
          <Button variant="outline" onClick={() => navigate('/transfers')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Actions */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Button variant="outline" onClick={() => navigate('/transfers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Button variant="gradient" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Remito */}
      <div className="bg-card rounded-lg shadow-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">REMITO DE TRANSFERENCIA</h1>
          <p className="text-lg font-mono">{transfer.id}</p>
          <p className="text-muted-foreground">
            {format(new Date(transfer.fechaISO), 'dd/MM/yyyy HH:mm:ss')}
          </p>
        </div>

        {/* Deposits Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Depósito Origen</h3>
            <p className="font-medium">{getDepositName(transfer.depositoOrigenId)}</p>
            <p className="text-sm text-muted-foreground">{getDepositAddress(transfer.depositoOrigenId)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Depósito Destino</h3>
            <p className="font-medium">{getDepositName(transfer.depositoDestinoId)}</p>
            <p className="text-sm text-muted-foreground">{getDepositAddress(transfer.depositoDestinoId)}</p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <ArrowRight className="w-8 h-8 text-primary" />
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Productos Transferidos</h3>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-3 text-left">SKU</th>
                <th className="px-2 py-3 text-left">Nombre</th>
                <th className="px-2 py-3 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-2 py-3 font-mono text-sm">{item.sku}</td>
                  <td className="px-2 py-3">{item.nombre}</td>
                  <td className="px-2 py-3 text-right font-medium">{item.cantidad}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="px-2 py-3 font-semibold">Total Items</td>
                <td className="px-2 py-3 text-right font-semibold">
                  {transfer.items.reduce((sum, item) => sum + item.cantidad, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Status */}
        <div className="text-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            transfer.estado === 'completado' 
              ? 'bg-green-100 text-green-700' 
              : transfer.estado === 'pendiente'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            Estado: {transfer.estado.charAt(0).toUpperCase() + transfer.estado.slice(1)}
          </span>
        </div>

        {/* Signature Section (for printing) */}
        <div className="mt-12 grid grid-cols-2 gap-8 hidden print:grid">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm">Entregado por</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-sm">Recibido por</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferDetailPage;