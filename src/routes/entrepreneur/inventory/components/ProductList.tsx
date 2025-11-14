import { useRef, useState } from 'react';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Search as SearchIcon, 
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
  Inventory2 as PackageIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { TextField, InputAdornment, IconButton, Button } from '@mui/material';
import { deleteProduct, Product } from '../../../../services/productService';
import { useToast } from '../../../../hooks/useToast';
import { ModalAnimaciones } from '../../../../components/ui/ModalAnimaciones';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/Table';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onSort: (key: keyof Product) => void;
  sortConfig?: {
    key: keyof Product;
    direction: 'ascending' | 'descending';
  } | null;
  onSearch: (term: string) => void;
  searchTerm: string;
  isLoading?: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onDelete,
  onSort,
  sortConfig,
  onSearch,
  searchTerm,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{id: number, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: number, name: string) => {
    setProductToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      onDelete(productToDelete.id);
      toast({
        title: '✅ Producto eliminado',
        description: 'El producto ha sido eliminado correctamente',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const getSortIndicator = (key: string, config: typeof sortConfig) => {
    if (!config || config.key !== key) return <UnfoldMoreIcon fontSize="small" />;
    return config.direction === 'ascending' 
      ? <ArrowUpwardIcon fontSize="small" /> 
      : <ArrowDownwardIcon fontSize="small" />;
  };



  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-2xl">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            inputRef={searchInputRef}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
              className: 'bg-white',
            }}
          />
        </div>
      </div>

      <div className="rounded-md border">
        {/* Desktop table (md and up) */}
        <div className="hidden md:block">
          <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead 
                className="text-center cursor-pointer hover:bg-gray-100 w-[25%]"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center justify-center">
                  Producto
                  <span className="ml-1">{getSortIndicator('name', sortConfig)}</span>
                </div>
              </TableHead>
              <TableHead className="w-[25%] text-center">
                <div className="flex items-center justify-center">
                  Descripción
                </div>
              </TableHead>
              <TableHead 
                className="text-center w-[10%] cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('price')}
              >
                <div className="flex items-center justify-center">
                  Precio
                  <span className="ml-1">{getSortIndicator('price', sortConfig)}</span>
                </div>
              </TableHead>
              <TableHead className="w-[15%] text-center">
                <div className="flex items-center justify-center">
                  Estado
                </div>
              </TableHead>
              <TableHead 
                className="text-center w-[15%] cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center justify-center">
                  Fecha
                  <span className="ml-1">{getSortIndicator('created_at', sortConfig)}</span>
                </div>
              </TableHead>
              <TableHead className="w-[15%] text-center">
                <div className="flex items-center justify-center">
                  Acciones
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50">
                <TableCell className="text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <PackageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500">ID: {product.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="px-2">
                    {product.description || <span className="text-gray-400">Sin descripción</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  ₡{Number(product.price).toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <span 
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        Number(product.stock_quantity || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {Number(product.stock_quantity || 0) > 0 ? 'En stock' : 'Agotado'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-gray-500">
                  {product.created_at 
                    ? new Date(product.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center space-x-2">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:bg-blue-50"
                      title="Editar"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(product.id, product.name);
                      }}
                      className="text-red-600 hover:bg-red-50"
                      disabled={isLoading}
                      title="Eliminar"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3 p-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                      <PackageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-gray-500">ID: {product.id}</div>
                    </div>
                    <div className="text-sm font-medium">${Number(product.price).toFixed(2)}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {product.description || <span className="text-gray-400">Sin descripción</span>}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        Number(product.stock_quantity || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>{Number(product.stock_quantity || 0) > 0 ? 'En stock' : 'Agotado'}</span>
                      <div className="text-xs text-gray-400 mt-1">{product.created_at ? new Date(product.created_at).toLocaleDateString('es-ES') : 'N/A'}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <IconButton size="small" onClick={() => onEdit(product)} className="text-blue-600 hover:bg-blue-50" title="Editar">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(product.id, product.name);
                        }} 
                        className="text-red-600 hover:bg-red-50" 
                        disabled={isLoading} 
                        title="Eliminar"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {products.length > 0 && (
        <div className="px-6 py-3 border-t flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Mostrando {products.length} de {products.length} productos
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ModalAnimaciones
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirmar eliminación"
        variant="warning"
      >
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <WarningIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">¿Eliminar producto?</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>¿Estás seguro de que deseas eliminar "{productToDelete?.name || 'este producto'}"? Esta acción no se puede deshacer.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
              variant="outlined"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              variant="contained"
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              startIcon={<DeleteIcon />}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </ModalAnimaciones>
    </div>
  );
}
