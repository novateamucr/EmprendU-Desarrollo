import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Eye, Sliders, X, ArrowUpDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import  Input  from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'out_of_stock';
  category: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

const statuses = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800' },
  out_of_stock: { label: 'Sin stock', color: 'bg-red-100 text-red-800' },
};

const categories = [
  'Todas las categorías',
  'Ropa',
  'Calzado',
  'Accesorios',
  'Electrónica',
  'Hogar',
  'Belleza',
  'Deportes',
  'Otros'
];

export default function ProductInventory() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockProducts: Product[] = [
          {
            id: '1',
            name: 'Camiseta Básica Blanca',
            sku: 'TSHIRT-WHITE-M',
            price: 24900,
            stock: 42,
            status: 'active',
            category: 'Ropa',
            image: 'https://via.placeholder.com/80',
            createdAt: '2023-10-15T10:30:00Z',
            updatedAt: '2023-10-20T14:25:00Z'
          },
          {
            id: '2',
            name: 'Jeans Slim Fit Azul',
            sku: 'JEANS-BLUE-32',
            price: 89900,
            stock: 15,
            status: 'active',
            category: 'Ropa',
            image: 'https://via.placeholder.com/80',
            createdAt: '2023-10-10T09:15:00Z',
            updatedAt: '2023-10-18T11:20:00Z'
          },
          {
            id: '3',
            name: 'Zapatillas Deportivas Negras',
            sku: 'SHOES-BLACK-42',
            price: 129900,
            stock: 0,
            status: 'out_of_stock',
            category: 'Calzado',
            image: 'https://via.placeholder.com/80',
            createdAt: '2023-09-28T14:00:00Z',
            updatedAt: '2023-10-05T16:45:00Z'
          },
          {
            id: '4',
            name: 'Reloj Inteligente',
            sku: 'WATCH-SMART-BLACK',
            price: 199900,
            stock: 8,
            status: 'draft',
            category: 'Electrónica',
            image: 'https://via.placeholder.com/80',
            createdAt: '2023-10-05T11:20:00Z',
            updatedAt: '2023-10-12T10:10:00Z'
          },
          {
            id: '5',
            name: 'Mochila Impermeable',
            sku: 'BAG-BACKPACK-BLUE',
            price: 59900,
            stock: 23,
            status: 'active',
            category: 'Accesorios',
            image: 'https://via.placeholder.com/80',
            createdAt: '2023-10-01T13:45:00Z',
            updatedAt: '2023-10-10T09:30:00Z'
          },
        ];
        
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (businessId) {
      fetchProducts();
    }
  }, [businessId]);
  
  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas las categorías' || 
                          product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Pagination
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  const handleEditProduct = (productId: string) => {
    navigate(`/entrepreneur/businesses/${businessId}/products/${productId}/edit`);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        // TODO: Implement actual delete API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('No se pudo eliminar el producto. Por favor, inténtalo de nuevo.');
      }
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventario de Productos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los productos de tu negocio
          </p>
        </div>
        
        <Button 
          variant="primary"
          onClick={() => navigate(`/entrepreneur/businesses/${businessId}/products/new`)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters && (
                <X className="h-4 w-4 ml-2 text-gray-500" />
              )}
            </Button>
            
            <Select 
              value={itemsPerPage.toString()}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-24"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Select>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Select className="w-full">
                <option>Todos los estados</option>
                <option>Activo</option>
                <option>Borrador</option>
                <option>Sin stock</option>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedCategory('Todas las categorías');
                  setSearchQuery('');
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">
                  <span className="sr-only">Imagen</span>
                </TableHead>
                <TableHead>
                  <button 
                    className="flex items-center font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Producto
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">
                  <button 
                    className="flex items-center justify-end w-full font-medium"
                    onClick={() => handleSort('price')}
                  >
                    Precio
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button 
                    className="flex items-center justify-end w-full font-medium"
                    onClick={() => handleSort('stock')}
                  >
                    Stock
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">
                  <button 
                    className="flex items-center justify-end w-full font-medium"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Actualizado
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length > 0 ? (
                currentItems.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.category}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{product.sku}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock === 0 ? 'text-red-600 font-medium' : ''}>
                        {product.stock} unidades
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'success' : 
                                     product.status === 'draft' ? 'warning' : 'destructive'}>
                        {statuses[product.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(product.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {}}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Vista previa</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Sliders className="h-12 w-12 text-gray-300" />
                      <p className="text-sm font-medium">No se encontraron productos</p>
                      <p className="text-sm">
                        {searchQuery || selectedCategory !== 'Todas las categorías' 
                          ? 'Intenta con otros filtros de búsqueda' 
                          : 'Comienza agregando tu primer producto'}
                      </p>
                      {!searchQuery && selectedCategory === 'Todas las categorías' && (
                        <Button 
                          variant="outline"
                          className="mt-2"
                          onClick={() => navigate(`/entrepreneur/businesses/${businessId}/products/new`)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Producto
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalItems > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
              <span className="font-medium">
                {Math.min(indexOfLastItem, totalItems)}
              </span>{' '}
              de <span className="font-medium">{totalItems}</span> productos
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
