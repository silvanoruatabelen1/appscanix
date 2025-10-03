import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/custom-button';
import { useToast } from '@/hooks/use-toast';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/types';
import { ProductModal } from '@/components/ProductModal';
import { TiersDrawer } from '@/components/TiersDrawer';

const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const { 
    products, 
    totalProducts, 
    currentPage,
    searchTerm,
    isLoading,
    fetchProducts,
    setSearchTerm,
    deleteProduct 
  } = useProductStore();

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTiersDrawer, setShowTiersDrawer] = useState(false);
  const [tiersProduct, setTiersProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => {
    setSearchTerm(localSearch);
    fetchProducts(1);
  };

  const handleDelete = async (product: Product) => {
    if (confirm(`¿Eliminar producto ${product.nombre}?`)) {
      try {
        await deleteProduct(product.productId);
        toast({ title: 'Producto eliminado' });
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: 'No se pudo eliminar el producto',
          variant: 'destructive' 
        });
      }
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleTiers = (product: Product) => {
    setTiersProduct(product);
    setShowTiersDrawer(true);
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleCloseDrawer = () => {
    setShowTiersDrawer(false);
    setTiersProduct(null);
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">{totalProducts} productos registrados</p>
          </div>
        </div>
        <Button variant="gradient" onClick={() => setShowProductModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por SKU o nombre..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSearch} variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        {products.length === 0 && !isLoading ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No se encontraron productos con ese criterio' : 'Comienza agregando tu primer producto'}
            </p>
            {!searchTerm && (
              <Button variant="gradient" onClick={() => setShowProductModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-right">Precio Base</th>
              <th className="px-4 py-3 text-center">Tiers</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.productId} className="border-t border-border hover:bg-accent/50">
                <td className="px-4 py-3 font-mono text-sm">{product.sku}</td>
                <td className="px-4 py-3">{product.nombre}</td>
                <td className="px-4 py-3 text-right">${product.precioBase.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  {product.tiers?.length || 0} niveles
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(product)}
                      title="Editar producto"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleTiers(product)}
                      title="Configurar precios escalonados"
                    >
                      <DollarSign className="w-4 h-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(product)}
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <ProductModal 
        open={showProductModal}
        onClose={handleCloseModal}
        product={selectedProduct}
      />

      <TiersDrawer
        open={showTiersDrawer}
        onClose={handleCloseDrawer}
        product={tiersProduct}
      />
    </div>
  );
};

export default ProductsPage;