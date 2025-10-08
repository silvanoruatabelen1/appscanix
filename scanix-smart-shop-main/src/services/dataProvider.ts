// Data Provider con contratos de API y mocks
import { 
  RecognizedItem, 
  Tier, 
  CartLine, 
  Ticket, 
  Product, 
  Deposit, 
  Transfer, 
  StockEntry, 
  StockMovement,
  SalesReport,
  StockReport 
} from '@/types';
import { mockProductCatalog, mockTiers } from './mockData';

// Bandera para alternar entre mock y backend real
const USE_REAL_API = true;
const USE_REAL_RECOGNITION = true; // ✅ RECONOCIMIENTO REAL CON YOLO + CLIP + k-NN
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class DataProvider {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Carga una imagen File/string en un elemento HTMLImageElement
   */
  private async loadImageElement(image: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Error cargando imagen'));
      
      if (image instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error leyendo archivo'));
        reader.readAsDataURL(image);
      } else {
        img.src = image;
      }
    });
  }

  /**
   * Reconoce productos desde una imagen usando IA avanzada
   */
  async recognize(image: File | string): Promise<{ items: RecognizedItem[] }> {
    if (USE_REAL_RECOGNITION) {
      try {
        console.log('🤖 Usando reconocimiento real con YOLO + CLIP + k-NN');
        
        const formData = new FormData();
        if (image instanceof File) {
          formData.append('image', image);
        } else {
          const response = await fetch(image);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          formData.append('image', file);
        }
        
        const response = await fetch('/api/recognition/recognize', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Error en reconocimiento');
        }
        
        if (!result.success) {
          throw new Error(result.message || 'No se pudieron reconocer productos');
        }
        
        console.log('✅ Respuesta del AI service:', result);
        
        const recognizedItems: RecognizedItem[] = result.items?.map((item: any) => ({
          productId: item.productId,
          sku: item.sku,
          nombre: item.nombre,
          qty: item.qty || 1,
          confianza: item.confianza || 0.8
        })) || [];
        
        console.log('✅ Productos reconocidos:', recognizedItems);
        return { items: recognizedItems };
        
      } catch (error) {
        console.error('❌ Error en reconocimiento IA:', error);
        console.log('🔄 Fallback a reconocimiento mock...');
        return this.mockRecognition(image);
      }
    }

    return this.mockRecognition(image);
  }

  private async mockRecognition(image: File | string): Promise<{ items: RecognizedItem[] }> {
    await this.delay(800 + Math.random() * 1200); // Delay más realista
    
    const items: RecognizedItem[] = [];
    const fileName = image instanceof File ? image.name.toLowerCase() : 'imagen';
    
    // Simular diferentes escenarios basados en el nombre del archivo
    let recognitionScenario = 'random';
    let baseConfidence = 0.75;
    let numProducts = 1;

    // Análisis inteligente del nombre del archivo
    if (fileName.includes('multiple') || fileName.includes('varios')) {
      recognitionScenario = 'multiple';
      numProducts = Math.floor(Math.random() * 4) + 2; // 2-5 productos
      baseConfidence = 0.65; // Menor confianza con múltiples productos
    } else if (fileName.includes('single') || fileName.includes('uno')) {
      recognitionScenario = 'single';
      numProducts = 1;
      baseConfidence = 0.85; // Alta confianza con un producto
    } else if (fileName.includes('blurry') || fileName.includes('borroso')) {
      recognitionScenario = 'low_quality';
      numProducts = Math.random() > 0.3 ? 1 : 0; // 30% chance de no reconocer nada
      baseConfidence = 0.45; // Baja confianza
    } else if (fileName.includes('clear') || fileName.includes('hd')) {
      recognitionScenario = 'high_quality';
      numProducts = Math.floor(Math.random() * 3) + 1;
      baseConfidence = 0.90; // Muy alta confianza
    } else {
      // Escenario aleatorio normal
      numProducts = Math.floor(Math.random() * 3) + 1;
      baseConfidence = 0.70 + Math.random() * 0.20;
    }

    // Asegurar que siempre se reconozca al menos un producto
    if (numProducts === 0) {
      numProducts = 1;
      baseConfidence = 0.60; // Confianza moderada
    }

    // Generar productos reconocidos
    const usedProducts = new Set<string>();
    
    for (let i = 0; i < numProducts; i++) {
      let product;
      let attempts = 0;
      
      // Evitar duplicados (como haría una IA real)
      do {
        product = mockProductCatalog[Math.floor(Math.random() * mockProductCatalog.length)];
        attempts++;
      } while (usedProducts.has(product.productId) && attempts < 10);
      
      if (attempts >= 10) break; // Evitar loop infinito
      
      usedProducts.add(product.productId);
      
      // Calcular confianza realista
      let confidence = baseConfidence + (Math.random() - 0.5) * 0.2;
      confidence = Math.max(0.1, Math.min(0.99, confidence)); // Clamp entre 0.1 y 0.99
      
      // Cantidad más realista (productos similares tienden a agruparse)
      let qty = 1;
      if (recognitionScenario === 'multiple') {
        qty = Math.floor(Math.random() * 3) + 1; // 1-3 por producto
      } else if (confidence > 0.8) {
        qty = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 1; // Más probable 1, a veces 2
      }

      items.push({
        productId: product.productId,
        sku: product.sku,
        nombre: product.nombre,
        qty,
        confianza: Math.round(confidence * 100) / 100, // Redondear a 2 decimales
      });
    }

    // Ordenar por confianza descendente (como haría una IA real)
    items.sort((a, b) => b.confianza - a.confianza);
    
    return { items };
  }

  /**
   * Obtiene los tiers de precio para un producto
   */
  async getPricingTiers(productId: string): Promise<{ productId: string; tiers: Tier[] }> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) throw new Error('Error obteniendo tiers');
      const product = await response.json();
      return { productId, tiers: product.tiers || [] };
    }

    // Mock: retornar tiers predefinidos
    const tiers = mockTiers[productId] || [];
    return { productId, tiers };
  }

  /**
   * Guarda los tiers de precio para un producto
   */
  async saveProductTiers(productId: string, tiers: Tier[]): Promise<void> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/tiers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      });
      if (!response.ok) throw new Error('Error guardando tiers');
      return;
    }

    // Mock: guardar en localStorage
    const existingTiers = JSON.parse(localStorage.getItem('scanix:tiers') || '{}');
    existingTiers[productId] = tiers;
    localStorage.setItem('scanix:tiers', JSON.stringify(existingTiers));
  }

  /**
   * Crea un ticket de compra
   */
  async createTicket(payload: { items: CartLine[]; depositoId: string }): Promise<Ticket> {
    if (USE_REAL_API) {
      const backendPayload = {
        items: payload.items.map(item => ({
          productId: item.productId,
          sku: item.sku,
          nombre: item.nombre,
          qty: item.qty,
          precioAplicado: item.precioAplicado,
          subtotal: item.subtotal
        })),
        depositoId: payload.depositoId
      };
      
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando ticket');
      }
      
      const result = await response.json();
      return {
        id: result.id,
        fechaISO: result.fechaISO,
        items: result.items,
        total: result.total,
        depositoId: result.depositId
      };
    }

    // Mock: generar ticket y guardarlo en localStorage
    const tickets = JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
    const newTicket: Ticket = {
      id: `T${String(tickets.length + 1).padStart(6, '0')}`,
      fechaISO: new Date().toISOString(),
      items: payload.items,
      total: payload.items.reduce((sum, item) => sum + item.subtotal, 0),
      depositoId: payload.depositoId,
    };
    
    tickets.push(newTicket);
    localStorage.setItem('scanix:tickets', JSON.stringify(tickets));
    localStorage.setItem('scanix:lastTicket', JSON.stringify(newTicket));
    
    return newTicket;
  }

  async getTickets(): Promise<Ticket[]> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/tickets`);
      if (!response.ok) throw new Error('Error obteniendo tickets');
      const tickets = await response.json();
      
      // Transformar formato del backend al formato esperado
      return tickets.map((t: any) => ({
        id: t.id,
        fechaISO: t.fecha_iso,
        items: t.items || [],
        total: t.total,
        depositoId: t.deposit_id
      }));
    }

    return JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
  }

  async getTicket(id: string): Promise<Ticket | null> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/tickets/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error obteniendo ticket');
      }
      const ticket = await response.json();
      
      return {
        id: ticket.id,
        fechaISO: ticket.fecha_iso,
        items: ticket.items || [],
        total: ticket.total,
        depositoId: ticket.deposit_id
      };
    }

    // Mock
    const tickets = JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
    return tickets.find((t: Ticket) => t.id === id) || null;
  }

  /**
   * Descuenta stock del depósito
   */
  async withdrawStock(payload: { 
    depositoId: string; 
    items: { productId: string; qty: number }[] 
  }): Promise<{ ok: boolean }> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/stock/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error descontando stock');
      }
      return response.json();
    }

    // Mock: descontar stock en localStorage
    const stockKey = `scanix:stock:${payload.depositoId}`;
    const stock = JSON.parse(localStorage.getItem(stockKey) || '{}');
    
    // Verificar disponibilidad
    for (const item of payload.items) {
      const currentStock = stock[item.productId] || 100; // Stock inicial: 100
      if (currentStock < item.qty) {
        throw new Error(`Stock insuficiente para producto ${item.productId}`);
      }
    }
    
    // Descontar
    for (const item of payload.items) {
      const currentStock = stock[item.productId] || 100;
      stock[item.productId] = currentStock - item.qty;
    }
    
    localStorage.setItem(stockKey, JSON.stringify(stock));
    return { ok: true };
  }

  // ========== NUEVOS MÉTODOS PARA GESTIÓN ADMINISTRATIVA ==========

  /**
   * CRUD de Productos
   */
  async getProducts(page = 1, limit = 10, search = ''): Promise<{ 
    products: Product[]; 
    total: number 
  }> {
    if (USE_REAL_API) {
      const response = await fetch(
        `${API_BASE_URL}/products?page=${page}&limit=${limit}&search=${search}`
      );
      if (!response.ok) throw new Error('Error obteniendo productos');
      const products = await response.json();
      
      // Transformar formato del backend al formato esperado
      const transformedProducts = products.map((p: any) => ({
        productId: p.id,
        sku: p.sku,
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        precioBase: p.precio_base,
        tiers: p.tiers || []
      }));
      
      return {
        products: transformedProducts,
        total: transformedProducts.length
      };
    }

    // Mock
    let products = JSON.parse(localStorage.getItem('scanix:products') || JSON.stringify(mockProductCatalog));
    
    // Añadir tiers a los productos
    const allTiers = JSON.parse(localStorage.getItem('scanix:tiers') || JSON.stringify(mockTiers));
    products = products.map((p: Product) => ({
      ...p,
      tiers: allTiers[p.productId] || []
    }));
    
    if (search) {
      products = products.filter((p: Product) => 
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const start = (page - 1) * limit;
    return {
      products: products.slice(start, start + limit),
      total: products.length,
    };
  }

  async createProduct(product: Omit<Product, 'productId'>): Promise<Product> {
    if (USE_REAL_API) {
      const payload = {
        id: `P${Date.now()}`,
        sku: product.sku,
        nombre: product.nombre,
        descripcion: (product as any).descripcion || '',
        precioBase: product.precioBase,
        tiers: product.tiers || []
      };
      
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando producto');
      }
      
      return { ...product, productId: payload.id };
    }

    // Mock
    const products = JSON.parse(localStorage.getItem('scanix:products') || JSON.stringify(mockProductCatalog));
    
    // Validar SKU único
    if (products.some((p: Product) => p.sku === product.sku)) {
      throw new Error('El SKU ya existe');
    }
    
    const newProduct: Product = {
      ...product,
      productId: `P${String(products.length + 1).padStart(3, '0')}`,
    };
    
    products.push(newProduct);
    localStorage.setItem('scanix:products', JSON.stringify(products));
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Error actualizando producto');
      return response.json();
    }

    // Mock
    const products = JSON.parse(localStorage.getItem('scanix:products') || JSON.stringify(mockProductCatalog));
    const index = products.findIndex((p: Product) => p.productId === id);
    
    if (index === -1) throw new Error('Producto no encontrado');
    
    products[index] = { ...products[index], ...product };
    localStorage.setItem('scanix:products', JSON.stringify(products));
    return products[index];
  }

  async deleteProduct(id: string): Promise<void> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error eliminando producto');
      return;
    }

    // Mock
    const products = JSON.parse(localStorage.getItem('scanix:products') || JSON.stringify(mockProductCatalog));
    const filtered = products.filter((p: Product) => p.productId !== id);
    localStorage.setItem('scanix:products', JSON.stringify(filtered));
  }

  /**
   * Gestión de Tiers de Precios
   */
  async updateProductTiers(productId: string, tiers: Tier[]): Promise<void> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers }),
      });
      if (!response.ok) throw new Error('Error actualizando tiers');
      return;
    }

    // Mock: guardar en localStorage
    const allTiers = JSON.parse(localStorage.getItem('scanix:tiers') || JSON.stringify(mockTiers));
    allTiers[productId] = tiers;
    localStorage.setItem('scanix:tiers', JSON.stringify(allTiers));
  }

  /**
   * CRUD de Depósitos
   */
  async getDeposits(): Promise<Deposit[]> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/deposits`);
      if (!response.ok) throw new Error('Error obteniendo depósitos');
      const deposits = await response.json();
      
      // Transformar formato del backend al formato esperado
      return deposits.map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        direccion: d.direccion || '',
        activo: true,
        fechaCreacion: d.created_at || new Date().toISOString()
      }));
    }

    // Mock
    const deposits = JSON.parse(localStorage.getItem('scanix:deposits') || JSON.stringify([
      { id: 'DEP001', nombre: 'Depósito Central', direccion: 'Av. Principal 123', activo: true, fechaCreacion: '2024-01-01T00:00:00Z' },
      { id: 'DEP002', nombre: 'Depósito Norte', direccion: 'Calle Norte 456', activo: true, fechaCreacion: '2024-01-15T00:00:00Z' },
    ]));
    return deposits;
  }

  async createDeposit(deposit: Omit<Deposit, 'id' | 'fechaCreacion'>): Promise<Deposit> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deposit),
      });
      if (!response.ok) throw new Error('Error creando depósito');
      return response.json();
    }

    // Mock
    const deposits = await this.getDeposits();
    const newDeposit: Deposit = {
      ...deposit,
      id: `DEP${String(deposits.length + 1).padStart(3, '0')}`,
      fechaCreacion: new Date().toISOString(),
    };
    
    deposits.push(newDeposit);
    localStorage.setItem('scanix:deposits', JSON.stringify(deposits));
    return newDeposit;
  }

  async updateDeposit(id: string, deposit: Partial<Deposit>): Promise<Deposit> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/deposits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deposit),
      });
      if (!response.ok) throw new Error('Error actualizando depósito');
      return response.json();
    }

    // Mock
    const deposits = await this.getDeposits();
    const index = deposits.findIndex(d => d.id === id);
    
    if (index === -1) throw new Error('Depósito no encontrado');
    
    deposits[index] = { ...deposits[index], ...deposit };
    localStorage.setItem('scanix:deposits', JSON.stringify(deposits));
    return deposits[index];
  }

  /**
   * Gestión de Stock
   */
  async getStock(depositoId: string): Promise<StockEntry[]> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/stock/${depositoId}`);
      if (!response.ok) throw new Error('Error obteniendo stock');
      const stock = await response.json();
      
      // Transformar formato del backend al formato esperado
      return stock.map((s: any) => ({
        depositoId: s.deposit_id,
        productId: s.product_id,
        sku: s.sku,
        nombre: s.nombre,
        cantidad: s.cantidad,
        precioBase: s.precio_base
      }));
    }

    // Mock
    const stockKey = `scanix:stock:${depositoId}`;
    const stock = JSON.parse(localStorage.getItem(stockKey) || '{}');
    const products = JSON.parse(localStorage.getItem('scanix:products') || JSON.stringify(mockProductCatalog));
    
    return products.map((p: Product) => ({
      depositoId,
      productId: p.productId,
      cantidad: stock[p.productId] || 100,
      ultimaActualizacion: new Date().toISOString(),
    }));
  }

  async adjustStock(depositoId: string, productId: string, cantidad: number, tipo: 'entrada' | 'ajuste'): Promise<void> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/stock/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositoId, productId, cantidad, tipo }),
      });
      if (!response.ok) throw new Error('Error ajustando stock');
      return;
    }

    // Mock
    const stockKey = `scanix:stock:${depositoId}`;
    const stock = JSON.parse(localStorage.getItem(stockKey) || '{}');
    
    if (tipo === 'entrada') {
      stock[productId] = (stock[productId] || 0) + cantidad;
    } else {
      stock[productId] = cantidad;
    }
    
    localStorage.setItem(stockKey, JSON.stringify(stock));
    
    // Registrar movimiento
    const movements = JSON.parse(localStorage.getItem('scanix:movements') || '[]');
    movements.push({
      id: `MOV${String(movements.length + 1).padStart(6, '0')}`,
      depositoId,
      productId,
      tipo,
      cantidad,
      fechaISO: new Date().toISOString(),
    });
    localStorage.setItem('scanix:movements', JSON.stringify(movements));
  }

  /**
   * Transferencias
   */
  async createTransfer(transfer: Omit<Transfer, 'id' | 'fechaISO' | 'estado'>): Promise<Transfer> {
    if (USE_REAL_API) {
      const backendPayload = {
        depositoOrigenId: transfer.depositoOrigenId,
        depositoDestinoId: transfer.depositoDestinoId,
        items: transfer.items.map(item => ({
          productId: item.productId,
          sku: item.sku,
          nombre: item.nombre,
          cantidad: item.cantidad
        }))
      };
      
      const response = await fetch(`${API_BASE_URL}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando transferencia');
      }
      
      const result = await response.json();
      return {
        id: result.id,
        fechaISO: result.fechaISO,
        depositoOrigenId: result.depositoOrigenId,
        depositoDestinoId: result.depositoDestinoId,
        items: result.items,
        estado: 'completado'
      };
    }

    // Mock
    const transfers = JSON.parse(localStorage.getItem('scanix:transfers') || '[]');
    
    // Verificar stock origen
    const origenStock = JSON.parse(localStorage.getItem(`scanix:stock:${transfer.depositoOrigenId}`) || '{}');
    for (const item of transfer.items) {
      if ((origenStock[item.productId] || 0) < item.cantidad) {
        throw new Error(`Stock insuficiente en origen para ${item.nombre}`);
      }
    }
    
    // Crear transferencia
    const newTransfer: Transfer = {
      ...transfer,
      id: `TR${String(transfers.length + 1).padStart(6, '0')}`,
      fechaISO: new Date().toISOString(),
      estado: 'completado',
    };
    
    // Actualizar stocks
    const destinoStock = JSON.parse(localStorage.getItem(`scanix:stock:${transfer.depositoDestinoId}`) || '{}');
    
    for (const item of transfer.items) {
      origenStock[item.productId] = (origenStock[item.productId] || 0) - item.cantidad;
      destinoStock[item.productId] = (destinoStock[item.productId] || 0) + item.cantidad;
    }
    
    localStorage.setItem(`scanix:stock:${transfer.depositoOrigenId}`, JSON.stringify(origenStock));
    localStorage.setItem(`scanix:stock:${transfer.depositoDestinoId}`, JSON.stringify(destinoStock));
    
    // Registrar movimientos de stock
    const movements = JSON.parse(localStorage.getItem('scanix:stock_movs') || '[]');
    
    for (const item of transfer.items) {
      // Movimiento de salida en origen
      movements.push({
        id: `MOV${String(movements.length + 1).padStart(6, '0')}`,
        depositoId: transfer.depositoOrigenId,
        productId: item.productId,
        producto: item.nombre,
        tipo: 'transferencia',
        delta: -item.cantidad,
        motivo: `Transferencia ${newTransfer.id} - Salida`,
        fechaISO: newTransfer.fechaISO,
        referencia: newTransfer.id,
      });
      
      // Movimiento de entrada en destino
      movements.push({
        id: `MOV${String(movements.length + 1).padStart(6, '0')}`,
        depositoId: transfer.depositoDestinoId,
        productId: item.productId,
        producto: item.nombre,
        tipo: 'transferencia',
        delta: item.cantidad,
        motivo: `Transferencia ${newTransfer.id} - Entrada`,
        fechaISO: newTransfer.fechaISO,
        referencia: newTransfer.id,
      });
    }
    
    localStorage.setItem('scanix:stock_movs', JSON.stringify(movements));
    
    transfers.push(newTransfer);
    localStorage.setItem('scanix:transfers', JSON.stringify(transfers));
    
    return newTransfer;
  }

  async getTransfers(): Promise<Transfer[]> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/transfers`);
      if (!response.ok) throw new Error('Error obteniendo transferencias');
      const transfers = await response.json();
      
      // Transformar formato del backend al formato esperado
      return transfers.map((t: any) => ({
        id: t.id,
        fechaISO: t.fechaISO || t.fecha_iso,
        depositoOrigenId: t.depositoOrigenId || t.origen_id,
        depositoDestinoId: t.depositoDestinoId || t.destino_id,
        items: t.items || [],
        estado: 'completado'
      }));
    }

    return JSON.parse(localStorage.getItem('scanix:transfers') || '[]');
  }

  async getTransfer(id: string): Promise<Transfer | null> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/transfers/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Error obteniendo transferencia');
      }
      const transfer = await response.json();
      
      return {
        id: transfer.id,
        fechaISO: transfer.fechaISO || transfer.fecha_iso,
        depositoOrigenId: transfer.depositoOrigenId || transfer.origen_id,
        depositoDestinoId: transfer.depositoDestinoId || transfer.destino_id,
        items: transfer.items || [],
        estado: 'completado'
      };
    }

    // Mock
    const transfers = JSON.parse(localStorage.getItem('scanix:transfers') || '[]');
    return transfers.find((t: Transfer) => t.id === id) || null;
  }

  /**
   * Reportes
   */
  async getKPIs(): Promise<any> {
    if (USE_REAL_API) {
      const response = await fetch(`${API_BASE_URL}/reports/kpis`);
      if (!response.ok) throw new Error('Error obteniendo KPIs');
      return response.json();
    }

    // Mock KPIs
    const products = await this.getProducts();
    const deposits = await this.getDeposits();
    const tickets = JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
    
    return {
      productos: {
        total: products.products.length,
        stockBajo: 0 // Mock
      },
      depositos: {
        total: deposits.length
      },
      ventasDelMes: {
        cantidad: tickets.length,
        total: tickets.reduce((sum: number, t: Ticket) => sum + t.total, 0)
      },
      transferenciasDelMes: {
        cantidad: 0 // Mock
      },
      inventario: {
        valorTotal: 0 // Mock
      },
      fecha: new Date().toISOString()
    };
  }

  async getSalesReport(startDate: string, endDate: string, depositId?: string): Promise<SalesReport> {
    if (USE_REAL_API) {
      let url = `${API_BASE_URL}/reports/sales?startDate=${startDate}&endDate=${endDate}`;
      if (depositId) {
        url += `&depositId=${depositId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error obteniendo reporte de ventas');
      const data = await response.json();
      
      // Transformar formato del backend al formato esperado
      return {
        tickets: data.tickets || [],
        totalVentas: data.kpis?.totalVentas || 0,
        cantidadTickets: data.kpis?.cantidadTickets || 0,
        productosMasVendidos: data.topProductos || []
      };
    }

    // Mock
    const tickets = JSON.parse(localStorage.getItem('scanix:tickets') || '[]');
    const filtered = tickets.filter((t: Ticket) => {
      const date = new Date(t.fechaISO);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
    
    const productSales: Record<string, { nombre: string; cantidad: number }> = {};
    let totalVentas = 0;
    
    filtered.forEach((ticket: Ticket) => {
      totalVentas += ticket.total;
      ticket.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { nombre: item.nombre, cantidad: 0 };
        }
        productSales[item.productId].cantidad += item.qty;
      });
    });
    
    return {
      tickets: filtered,
      totalVentas,
      cantidadTickets: filtered.length,
      productosMasVendidos: Object.entries(productSales)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5),
    };
  }

  async getStockReport(depositoId?: string, startDate?: string, endDate?: string, tipo?: string): Promise<StockReport> {
    if (USE_REAL_API) {
      let url = `${API_BASE_URL}/reports/stock`;
      const params = new URLSearchParams();
      
      if (depositoId) params.append('depositId', depositoId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (tipo) params.append('tipo', tipo);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error obteniendo reporte de stock');
      const data = await response.json();
      
      // Transformar formato del backend al formato esperado
      return {
        movimientos: data.movimientos || [],
        stockActual: data.stockPorDeposito || []
      };
    }

    // Mock
    const movements = JSON.parse(localStorage.getItem('scanix:movements') || '[]');
    const deposits = await this.getDeposits();
    
    const stockActual = await Promise.all(
      deposits
        .filter(d => !depositoId || d.id === depositoId)
        .map(async d => ({
          depositoId: d.id,
          items: await this.getStock(d.id),
        }))
    );
    
    return {
      movimientos: depositoId 
        ? movements.filter((m: StockMovement) => m.depositoId === depositoId)
        : movements,
      stockActual,
    };
  }
}

export const dataProvider = new DataProvider();