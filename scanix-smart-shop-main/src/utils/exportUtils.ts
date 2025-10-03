import { format } from 'date-fns';

export interface ExportOptions {
  filename?: string;
  format?: 'csv' | 'pdf' | 'excel';
  title?: string;
  subtitle?: string;
}

// Función mejorada para exportar CSV
export function exportToCSV(data: any[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const { filename = 'export.csv' } = options;
  const headers = Object.keys(data[0]);
  
  // Crear contenido CSV con BOM para Excel
  let csvContent = '\uFEFF'; // BOM para UTF-8
  csvContent += headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      
      const stringValue = String(value);
      // Escapar comillas y comas
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvContent += values.join(',') + '\n';
  });
  
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// Función para exportar a PDF (HTML to PDF usando print)
export function exportToPDF(data: any[], options: ExportOptions = {}) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const { 
    filename = 'export.pdf',
    title = 'Reporte',
    subtitle = format(new Date(), 'dd/MM/yyyy HH:mm')
  } = options;

  const headers = Object.keys(data[0]);
  
  // Crear HTML para PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Generado por SCANIX - ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
        </div>
      </body>
    </html>
  `;
  
  // Abrir ventana para imprimir
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
}

// Función para exportar a Excel (usando formato CSV con extensión .xls)
export function exportToExcel(data: any[], options: ExportOptions = {}) {
  const { filename = 'export.xls' } = options;
  const excelFilename = filename.replace(/\.[^/.]+$/, '.xls');
  
  // Usar CSV con headers especiales para Excel
  exportToCSV(data, { ...options, filename: excelFilename });
}

// Función auxiliar para descargar archivos
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Función para formatear datos antes de exportar
export function formatDataForExport(data: any[], formatters: Record<string, (value: any) => string> = {}) {
  return data.map(item => {
    const formatted: any = {};
    Object.keys(item).forEach(key => {
      const formatter = formatters[key];
      formatted[key] = formatter ? formatter(item[key]) : item[key];
    });
    return formatted;
  });
}

// Funciones de formato comunes
export const formatters = {
  currency: (value: number) => `$${value.toFixed(2)}`,
  date: (value: string | Date) => format(new Date(value), 'dd/MM/yyyy'),
  datetime: (value: string | Date) => format(new Date(value), 'dd/MM/yyyy HH:mm'),
  number: (value: number) => value.toLocaleString(),
  percentage: (value: number) => `${(value * 100).toFixed(1)}%`
};
