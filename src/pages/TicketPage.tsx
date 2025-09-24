import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Calendar, Package, Printer } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { Ticket } from '@/types';

const TicketPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    // Cargar ticket desde localStorage
    const tickets = JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
    const foundTicket = tickets.find((t: Ticket) => t.id === id);
    setTicket(foundTicket || null);
  }, [id]);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Ticket no encontrado</p>
          <Button onClick={() => navigate('/scan')}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    // Crear una nueva ventana para imprimir solo el ticket
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const ticketHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket ${ticket.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              max-width: 300px;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { font-size: 18px; font-weight: bold; }
            .header p { font-size: 10px; }
            .info { margin-bottom: 15px; }
            .info div { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .items { margin-bottom: 15px; }
            .item { margin-bottom: 8px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
            .item-name { font-weight: bold; }
            .item-sku { font-size: 10px; color: #666; }
            .item-line { display: flex; justify-content: space-between; }
            .total-section { border-top: 2px solid #000; padding-top: 10px; }
            .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SCANIX</h1>
            <p>Sistema de Reconocimiento</p>
            <p>Ticket #${ticket.id}</p>
          </div>
          
          <div class="info">
            <div><span>Fecha:</span><span>${formatDate(ticket.fechaISO)}</span></div>
            <div><span>Depósito:</span><span>${ticket.depositoId}</span></div>
          </div>
          
          <div class="items">
            <h3>PRODUCTOS:</h3>
            ${ticket.items.map(item => `
              <div class="item">
                <div class="item-name">${item.nombre}</div>
                <div class="item-sku">SKU: ${item.sku}</div>
                <div class="item-line">
                  <span>${item.qty} x $${item.precioAplicado.toFixed(2)}</span>
                  <span>$${item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="total">
              <span>TOTAL:</span>
              <span>$${ticket.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>¡Gracias por su compra!</p>
            <p>SCANIX - ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-success/10 rounded-full mb-4">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">¡Compra Exitosa!</h1>
          <p className="text-muted-foreground">Tu ticket ha sido generado correctamente</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-card rounded-xl shadow-lg p-8 mb-6">
          {/* Header */}
          <div className="border-b border-border pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground">SCANIX</h2>
                <p className="text-sm text-muted-foreground">Sistema de Reconocimiento</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Ticket #</p>
                <p className="text-xl font-mono font-bold text-primary">{ticket.id}</p>
              </div>
            </div>
          </div>

          {/* Date and Deposit */}
          <div className="flex justify-between mb-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(ticket.fechaISO)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>Depósito: {ticket.depositoId}</span>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Detalle de productos</h3>
            <div className="space-y-2">
              {ticket.items.map((item, index) => (
                <div
                  key={`${item.sku}-${index}`}
                  className="flex justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {item.qty} x ${item.precioAplicado.toFixed(2)}
                    </p>
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">Total</span>
              <span className="text-3xl font-bold text-primary">
                ${ticket.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrint}
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="gradient"
            size="lg"
            onClick={() => navigate('/scan')}
          >
            <Home className="w-5 h-5 mr-2" />
            Nueva Compra
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;