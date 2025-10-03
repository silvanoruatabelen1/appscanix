export function exportToCSV(rows: any[], filename: string) {
  if (rows.length === 0) return;
  
  // Obtener headers de las keys del primer objeto
  const headers = Object.keys(rows[0]);
  
  // Crear contenido CSV
  let csvContent = headers.join(',') + '\n';
  
  rows.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Escapar valores que contengan comas o comillas
      if (value === null || value === undefined) return '';
      
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvContent += values.join(',') + '\n';
  });
  
  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}