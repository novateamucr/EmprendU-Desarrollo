import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { entrepreneurshipApi, categoryApi } from '../../../services/entrepreneurshipService';
import ChannelsEditor from './ChannelsEditor';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { ImageUpload } from '../../../components/ImageUpload';

interface Category {
  id: number;
  nombre: string;
  created_at?: string;
  updated_at?: string;
}

// Form data interface matching API requirements
interface BusinessFormData {
  id?: number;
  name: string;
  description: string;
  category: number | string;
  user_id?: number;
  image_url?: string | null;
}

interface BusinessSetupProps {
  initialData?: Partial<BusinessFormData> | null;
  onCancel?: () => void;
}


// Categories will be loaded from the API

// Editor/creador de emprendimientos:
// - Permite crear o editar un emprendimiento (detecta modo por URL o props).
// - Carga categorías desde API y, en modo edición, carga datos del emprendimiento.
// - Envía los cambios a la API y muestra confirmación para salir tras actualizar.
export default function BusinessSetup({ initialData, onCancel }: BusinessSetupProps) {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Check if we're in edit mode by checking both route params and query params
  const urlParams = new URLSearchParams(location.search);
  const businessIdFromQuery = urlParams.get('businessId');
  const isEditMode = Boolean(id) || Boolean(businessIdFromQuery) || Boolean(initialData?.id);
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    image_url: initialData?.image_url || null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const businessId = businessIdFromQuery || id || formData.id;
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Cargar categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        // map to expected shape {id, nombre}
        const normalized = data.map((c: any) => ({ id: c.id, nombre: c.nombre ?? c.name ?? c.label ?? 'Categoría' }));
        setCategories(normalized as Category[]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('No se pudieron cargar las categorías');
      } finally {
      }
    };

    fetchCategories();
  }, []);

  // Cargar datos del emprendimiento si estamos en modo edición
  useEffect(() => {
    if (isEditMode) {
      const businessId = businessIdFromQuery || id;
      if (!businessId) return;
      
      const fetchBusiness = async () => {
        try {
          setIsLoading(true);
          const business = await entrepreneurshipApi.getById(businessId);
          setFormData({
            id: business.id,
            name: business.name,
            description: business.description || '',
            category: business.category,
            user_id: business.user_id,
            image_url: business.image_url || null
          });
        } catch (error) {
          console.error('Error fetching business:', error);
          setError('No se pudo cargar la información del emprendimiento');
          toast.error('Error al cargar el emprendimiento');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBusiness();
    } else if (initialData) {
      // If initialData is provided, use it to populate the form
      setFormData(prev => ({
        ...prev,
        ...initialData,
        description: initialData.description || ''
      }));
    }
  }, [id, isEditMode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Manejar envío del formulario (crear/actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    if (!formData.category) {
      setError('Por favor selecciona una categoría');
    }
    
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.');
      }

      const currentBusinessId = businessIdFromQuery || id || formData.id;
      let result: any;

      if (isEditMode && currentBusinessId) {
        // Actualizar
        result = await entrepreneurshipApi.update(String(currentBusinessId), {
          name: formData.name,
          description: formData.description || '',
          category: Number(formData.category),
          image_url: null as any,
        } as any);
      } else {
        // Crear
        result = await entrepreneurshipApi.create({
          // campos mínimos usados por el servicio (se enviará como FormData)
          name: formData.name,
          description: formData.description,
          category: Number(formData.category) as any,
          image_url: (formData.image_url || '') as any,
          user_id: user.id as any,
          // completar para satisfacer el tipo local, aunque el backend no los requiere
          created_at: '' as any,
          updated_at: '' as any,
          owner: undefined as any,
          category_relation: undefined as any,
          products: [] as any,
        } as any);
      }

      toast.success(isEditMode ? 'Emprendimiento actualizado' : 'Emprendimiento creado', {
        duration: 3000,
        position: 'top-center',
        style: { background: '#10B981', color: '#fff', padding: '16px', borderRadius: '8px' },
      });

      if (!isEditMode) {
        navigate(`/entrepreneur/business/setup?businessId=${result.id}`);
        return;
      }

      // Mostrar confirmación para salir del editor
      setShowExitConfirm(true);
    } catch (err: any) {
      console.error('Error saving business:', err);
      const errorMessage = err.message || 'Ocurrió un error al guardar el emprendimiento. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 lg:px-6 py-6 w-full max-w-full mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {isEditMode ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Actualiza la información de tu emprendimiento.'
              : 'Completa la información básica para crear un nuevo emprendimiento.'}
          </p>
        </div>
      </div>

      <Card className="p-6">
        {/* Formulario principal del emprendimiento */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {!isEditMode && (
              <div className="flex flex-col items-center">
                <label className="block w-full text-sm font-medium mb-3">
                  Imagen del emprendimiento
                </label>
                <ImageUpload
                  currentImage={typeof formData.image_url === 'string' ? formData.image_url || undefined : undefined}
                  placeholderInitial={(formData.name || 'E').trim().charAt(0).toUpperCase()}
                  onImageChange={(imageData: string) => {
                    setFormData(prev => ({ ...prev, image_url: imageData }));
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Sube una imagen representativa de tu emprendimiento. Formatos: JPG, PNG. Máx 5MB.
                </p>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nombre del emprendimiento *
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Mi Tienda Online"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Categoría *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe tu emprendimiento..."
                rows={4}
              />
            </div>

            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => navigate(-1))}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto px-4 py-2">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Actualizar' : 'Crear'} emprendimiento
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="mt-6">
  <Card className="p-4 sm:p-6 w-full">
          {businessId ? (
            <ChannelsEditor entrepreneurshipId={Number(businessId)} />
          ) : (
            <div className="flex flex-col gap-3">
              {/* Order explicit for mobile: 1) title+desc, 2) admin box, 3) add button */}
              <div className="order-1">
                <h2 className="text-lg font-semibold">Redes y contactos de tu emprendimiento</h2>
                <p className="text-sm text-muted-foreground">Guarda primero la información básica para habilitar la administración de redes y contactos.</p>
              </div>

              <div className="order-2 p-4 rounded border bg-gray-50 text-sm text-gray-600">
                Una vez crees el emprendimiento, podrás añadir WhatsApp, Teléfono, Maps, Sitio web, Email y más.
              </div>

              <div className="order-3">
                <Button
                  type="button"
                  onClick={() => toast('Guarda primero el emprendimiento para habilitar esta acción', { icon: 'ℹ️' })}
                  className="w-full sm:w-auto px-4 py-2"
                >
                  Agregar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmación para salir del editor tras actualizar */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExitConfirm(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">¿Quieres salir del editar perfil?</h3>
            <p className="text-sm text-muted-foreground mb-4">Puedes seguir editando o volver a tus emprendimientos.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowExitConfirm(false)}>
                Seguir editando
              </Button>
              <Button type="button" onClick={() => navigate('/entrepreneur/businesses')}>
                Sí
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
