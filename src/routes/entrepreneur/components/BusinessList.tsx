import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { entrepreneurshipApi, Entrepreneurship } from '../../../services/entrepreneurshipService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

// Custom Business type that matches the API response and adds productCount
type Business = Omit<Entrepreneurship, 'id' | 'category'> & {
  id: string; // Override id to be string for consistency with the rest of the app
  productCount: number;
  category: string; // Override to use the category name instead of ID
  category_relation?: {
    id: number;
    nombre: string;
    created_at: string;
    updated_at: string;
  };
};

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true);
        // Get businesses for the current user (API already filters by authenticated user)
        const response = await entrepreneurshipApi.getAll({ 
          per_page: 100
        });
        
        if (response && response.data) {
// Map API data to our local Business type
          const mappedData = response.data.map((business: Entrepreneurship) => ({
            ...business,
            id: business.id.toString(), // Convert id to string
            productCount: business.products?.length || 0,
            category: business.category_relation?.nombre || 'Sin categoría', // Use category name from relation
          })) as unknown as Business[]; // Type assertion to handle the category type difference
          
          setBusinesses(mappedData);
          setError(null);
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      } catch (err) {
        console.error('Error loading businesses:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(`No se pudieron cargar los emprendimientos: ${errorMessage}`);
        toast.error('Error al cargar los emprendimientos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinesses();
  }, [user?.id]); // Re-fetch when user changes

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este emprendimiento? Esta acción no se puede deshacer.')) {
      try {
        await entrepreneurshipApi.delete(id);
        setBusinesses(businesses.filter(business => business.id !== id));
        toast.success('emprendimiento eliminado correctamente');
      } catch (err) {
        console.error('Error deleting business:', err);
        toast.error('Error al eliminar el emprendimiento');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los emprendimientos</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mis emprendimientos</h2>
          <p className="text-sm text-gray-500">
            Administra tus emprendimientos y productos en un solo lugar
          </p>
        </div>
        <Button asChild>
          <Link to="/entrepreneur/businesses/new">
            <Plus className="h-4 w-4 mr-2" />
            Agregar emprendimiento
          </Link>
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aún no tienes emprendimientos registrados</h3>
          <p className="mt-2 text-sm text-gray-500">
            Comienza creando tu primer emprendimiento para vender productos en nuestra plataforma.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/entrepreneur/businesses/new">
                <Plus className="h-4 w-4 mr-2" />
                Crear emprendimiento
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 overflow-hidden">
                      {business.image_url ? (
                        <img
                          src={business.image_url}
                          alt={`Logo de ${business.name}`}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-business.png';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{business.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{business.description}</p>
                    </div>
                  </div>
                  <Badge variant={business.banned ? 'destructive' : 'success'}>
                    {business.banned ? 'Inactivo' : 'Activo'}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Categoría</span>
                    <span className="font-medium">{business.category}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Productos</span>
                    <span className="font-medium">{business.products?.length || 0} productos</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">{business.products?.length || 0}</span> productos
                    </div>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">
                        {business.products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0}
                      </span> en stock
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                      <Link to={`/entrepreneur/businesses/${business.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/entrepreneur/inventory?businessId=${business.id}`)}
                      title="Ver productos"
                    >
                      <Package className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(business.id)}
                      title="Eliminar emprendimiento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
