import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@mui/material';
import { SkeletonProductList } from '../../../components/ui/SkeletonProductList';
import { getProductsByEntrepreneurship, Product } from '../../../services/productService';
import { ProductList } from './components/ProductList';
import ProductForm from './components/ProductForm';
import { useToast } from '../../../hooks/useToast';

// Página de Inventario:
// - Muestra, filtra y ordena productos de un emprendimiento (por businessId en la URL).
// - Permite crear/editar productos con un formulario modal y refresca la lista.
export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId');
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'ascending' | 'descending' } | null>(null);
  const { toast } = useToast();

  // Filtrar y ordenar productos en memoria (búsqueda y sort configurable)
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        product => 
          (product.name?.toLowerCase() || '').includes(term) || 
          (product.description?.toLowerCase() || '').includes(term) ||
          (product.price?.toString() || '').includes(term)
      );
    }
    
    // Sort products
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [products, searchTerm, sortConfig]);
  
  // Cambiar criterio/dirección de ordenamiento
  const requestSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Cargar productos desde la API y filtrar por businessId
  const loadProducts = useCallback(async () => {
    if (!businessId) return;
    try {
      setIsLoading(true);
      console.log('Fetching products filtered by entrepreneurship on backend');
      const bizIdNum = Number(businessId);
      const businessProducts = await getProductsByEntrepreneurship(bizIdNum, 100);
      console.log(`Products for business ${businessId}:`, businessProducts);
      setProducts(businessProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [businessId, toast]);

  // Efecto inicial: valida businessId y carga productos
  useEffect(() => {
    if (!businessId) {
      console.error('No businessId found in URL parameters');
      toast({
        title: 'Error',
        description: 'No se pudo identificar el emprendimiento',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('Loading products for businessId:', businessId);
    loadProducts();
  }, [businessId, loadProducts, toast]);

  // Abrir formulario para agregar producto
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  // Navegar al editor de producto existente
  const handleEditProduct = (product: Product) => {
    if (!businessId) return;
    navigate(`/emprendimientos/${businessId}/productos/${product.id}/editar`, { state: { product } });
  };

  // Al guardar en el formulario, cerrar y recargar lista
  const handleFormSubmit = async () => {
    setShowProductForm(false);
    await loadProducts(); // Use the same loadProducts function to refresh the list
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton 
            variant="text" 
            width={200} 
            height={40}
            sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
          />
          <Skeleton 
            variant="rectangular" 
            width={180} 
            height={40}
            sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
          />
        </div>
        <SkeletonProductList count={5} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventario</h1>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      <ProductList 
        products={filteredProducts} 
        onEdit={handleEditProduct} 
        onDelete={() => { loadProducts(); }}
        onSort={requestSort}
        sortConfig={sortConfig}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        isLoading={isLoading}
      />

      {showProductForm && (
        <ProductForm
          businessId={businessId!}
          initialData={editingProduct}
          onSuccess={handleFormSubmit}
          onCancel={() => setShowProductForm(false)}
        />
      )}
    </div>
  );
}
