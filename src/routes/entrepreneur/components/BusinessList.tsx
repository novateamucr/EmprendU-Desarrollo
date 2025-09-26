import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, Loader2, AlertCircle, RefreshCw, Heart, Eye } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { entrepreneurshipApi, Entrepreneurship } from '../../../services/entrepreneurshipService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

// Enhanced Business type with all relationships
type Business = Omit<Entrepreneurship, 'id' | 'category'> & {
  id: string;
  productCount: number;
  category: string;
  category_relation?: {
    id: number;
    nombre: string;
    created_at: string;
    updated_at: string;
  };
  products?: Array<{
    id: number;
    name: string;
    stock: number;
    price: number;
    status: string;
  }>;
  favorites?: Array<{
    id: number;
    user_id: number;
  }>;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
};

export default function BusinessList() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true);
        const response = await entrepreneurshipApi.getAll({ 
          per_page: 100,
          include: 'owner,category_relation,products,favorites',
          user_id: user?.id,
        });
        
        if (response && response.data) {
          const mappedData = response.data.map((business: Entrepreneurship) => ({
            ...business,
            id: business.id.toString(),
            productCount: business.products?.length || 0,
            category: business.category_relation?.nombre || 'Sin categoría',
          })) as unknown as Business[];
          
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
  }, [user?.id]);

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      setIsDeleting(true);
      await entrepreneurshipApi.delete(pendingDeleteId);
      setBusinesses(prev => prev.filter(b => b.id !== pendingDeleteId));
      toast.success('Emprendimiento eliminado correctamente');
    } catch (err) {
      console.error('Error deleting business:', err);
      toast.error('Error al eliminar el emprendimiento');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setPendingDeleteId(null);
    }
  };

  // Helpers removed to keep UI minimal and avoid unused warnings

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500">Cargando tus emprendimientos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center max-w-2xl mx-auto my-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar los emprendimientos</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => navigate('/entrepreneur/businesses/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Crear emprendimiento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Emprendimientos</h1>
          <p className="text-muted-foreground">Administra tus emprendimientos aquí</p>
        </div>
        <Button asChild className="bg-black hover:bg-black/90 text-white">
          <Link to="/entrepreneur/businesses/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Emprendimiento
          </Link>
        </Button>
      </div>
      
      {businesses.length === 0 ? (
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 text-center max-w-3xl mx-auto">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 mb-6">
              <Package className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Aún no tienes emprendimientos</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
              Crea tu primer emprendimiento para comenzar a vender productos y llegar a más clientes en nuestra plataforma.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/entrepreneur/businesses/new" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Crear mi primer emprendimiento
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/explore" className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Ver ejemplos
                </Link>
              </Button>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-4">¿Necesitas ayuda para comenzar?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">1</div>
                  <p className="text-sm text-gray-600">Crea tu perfil de emprendedor</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">2</div>
                  <p className="text-sm text-gray-600">Agrega los detalles de tu negocio</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 mx-auto">3</div>
                  <p className="text-sm text-gray-600">Comienza a vender tus productos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-14 w-14 rounded-md bg-gray-100 overflow-hidden">
                      {business.image_url ? (
                        <img
                          src={business.image_url}
                          alt={`Logo de ${business.name}`}
                          className="h-14 w-14 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-business.png';
                          }}
                        />
                      ) : (
                        <div className="h-14 w-14 bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 leading-snug">{business.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{business.description || 'Sin descripción'}</p>
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
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm"><span className="font-semibold">{business.products?.length || 0}</span> productos</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm"><span className="font-semibold">{business.favorites?.length || 0}</span> favoritos</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Actualizado el {formatDate(business.updated_at)}
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <Button variant="secondary" size="icon" className="h-10 w-10" asChild>
                      <Link to={`/entrepreneur/businesses/${business.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => navigate(`/entrepreneur/inventory?businessId=${business.id}`)}
                      title="Ver productos"
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => requestDelete(business.id)}
                      title="Eliminar emprendimiento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { if (!isDeleting) { setDeleteModalOpen(false); setPendingDeleteId(null); } }}
        title="Eliminar emprendimiento"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Eliminar tu emprendimiento no se puede deshacer y esto eliminará todos los productos, ventas y registros asociados.
          </p>
          <p className="text-gray-700 font-medium">¿Deseas continuar?</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => { if (!isDeleting) { setDeleteModalOpen(false); setPendingDeleteId(null); } }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
