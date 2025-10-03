import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@mui/material';
import { SkeletonProductList } from '../../../components/ui/SkeletonProductList';
import { getProducts, Product } from '../../../services/productService';
import { ProductList } from './components/ProductList';
import ProductForm from './components/ProductForm';
import { useToast } from '../../../hooks/useToast';

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'ascending' | 'descending' } | null>(null);
  const { toast } = useToast();

  // Filter and sort products
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
  
  const requestSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof Product) => {
    if (!sortConfig || sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'ascending' ? '⬆️' : '⬇️';
  };

  const loadProducts = useCallback(async () => {
    if (!businessId) return;
    
    try {
      setIsLoading(true);
      console.log('Fetching all products for frontend filtering');
      
      // Fetch all products
      const allProducts = await getProducts();
      console.log('All products from API:', allProducts);
      
      // Filter products by businessId on the frontend
      const businessProducts = allProducts.filter(
        product => product.entrepreneurship_id.toString() === businessId
      );
      
      console.log(`Filtered products for business ${businessId}:`, businessProducts);
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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

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
        onDelete={loadProducts}
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
