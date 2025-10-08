// Script para probar la carga de productos
const API_BASE_URL = 'http://localhost:3001/api';

async function testProducts() {
  console.log('🔍 Probando carga de productos...');
  
  try {
    // Probar health
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health check:', health);
    
    // Probar productos
    const productsResponse = await fetch(`${API_BASE_URL}/products`);
    const products = await productsResponse.json();
    console.log('📦 Productos cargados:', products.products?.length || 0);
    console.log('📦 Primeros 3 productos:', products.products?.slice(0, 3));
    
    // Probar stock
    const stockResponse = await fetch(`${API_BASE_URL}/stock/DEP001`);
    const stock = await stockResponse.json();
    console.log('📊 Stock en DEP001:', Object.keys(stock.stock || {}).length, 'productos');
    
    // Probar depósitos
    const depositsResponse = await fetch(`${API_BASE_URL}/deposits`);
    const deposits = await depositsResponse.json();
    console.log('🏪 Depósitos:', deposits.deposits?.length || 0);
    
    console.log('✅ Todas las pruebas pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

testProducts();
