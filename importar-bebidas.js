/**
 * Script para importar el dataset de bebidas argentinas a SCANIX
 * Ejecutar: node importar-bebidas.js
 */

const fs = require('fs');
const path = require('path');

// Leer el dataset
const datasetPath = path.join(__dirname, 'DATASET-BEBIDAS-ARGENTINA.json');
const bebidas = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

console.log('📦 Importando bebidas al sistema SCANIX...\n');
console.log(`Total de productos a importar: ${bebidas.length}\n`);

// Transformar al formato de SCANIX
const productosScaniX = bebidas.map(bebida => ({
  productId: bebida.sku,
  sku: bebida.sku,
  nombre: bebida.nombre,
  descripcion: `${bebida.tipo} - ${bebida.marca}`,
  unidad: bebida.unidad,
  precioBase: bebida.precioBase,
  activo: true,
  tiers: generarTiersAutomaticos(bebida.precioBase),
  metadata: {
    marca: bebida.marca,
    tipo: bebida.tipo,
    volumen: bebida.volumen,
    keywords: bebida.keywords
  }
}));

// Función para generar tiers automáticos (descuentos por volumen)
function generarTiersAutomaticos(precioBase) {
  return [
    {
      id: '1',
      minQty: 1,
      maxQty: 5,
      precio: precioBase
    },
    {
      id: '2',
      minQty: 6,
      maxQty: 12,
      precio: Math.round(precioBase * 0.93) // 7% descuento
    },
    {
      id: '3',
      minQty: 13,
      maxQty: null,
      precio: Math.round(precioBase * 0.85) // 15% descuento
    }
  ];
}

// Guardar en el formato del backend
const outputPath = path.join(__dirname, 'productos-importados.json');
fs.writeFileSync(outputPath, JSON.stringify(productosScaniX, null, 2), 'utf8');

console.log('✅ Productos transformados al formato SCANIX');
console.log(`📄 Archivo generado: ${outputPath}\n`);

// Mostrar resumen por categoría
const resumen = {};
productosScaniX.forEach(p => {
  const tipo = p.metadata.tipo;
  resumen[tipo] = (resumen[tipo] || 0) + 1;
});

console.log('📊 RESUMEN POR CATEGORÍA:');
console.log('═'.repeat(50));
Object.entries(resumen).sort((a, b) => b[1] - a[1]).forEach(([tipo, cant]) => {
  console.log(`  ${tipo.padEnd(30)} ${cant} productos`);
});
console.log('═'.repeat(50));

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Copia el contenido de productos-importados.json');
console.log('2. Pégalo en scanix-server-fixed.js reemplazando mockProducts');
console.log('3. Reinicia el servidor');
console.log('4. ¡Los productos estarán disponibles en la app!\n');

console.log('💡 NOTA: Cada producto ya tiene precios por volumen configurados:');
console.log('   • 1-5 unidades: Precio normal');
console.log('   • 6-12 unidades: 7% descuento');
console.log('   • 13+ unidades: 15% descuento\n');

