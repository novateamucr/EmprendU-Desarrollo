import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { entrepreneurshipApi } from '../../../services/entrepreneurshipService';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

interface Category {
  id: number;
  nombre: string;
  created_at: string;
  updated_at: string;
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
  onSuccess?: () => void;
  onCancel?: () => void;
}

// API base URL
const API_URL = 'http://emprendu-backend.test/api';

// Categories will be loaded from the API

export default function BusinessSetup({ initialData, onSuccess, onCancel }: BusinessSetupProps) {
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

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<Category[]>(`${API_URL}/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('No se pudieron cargar las categorías');
      } finally {
      }
    };

    fetchCategories();
  }, []);

  // Load business data if in edit mode
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    if (!formData.category) {
      setError('Por favor selecciona una categoría');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user?.id) {
        throw new Error('No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.');
      }
  
      // Get the business ID from either the query param or the form data
      const businessId = businessIdFromQuery || id || formData.id;
      
      // Prepare the data to be sent
      const requestData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category,  // Changed from 'category' to 'category_id'
        // For new records only
        ...(!isEditMode && { user_id: user.id }),
        image_url: null
      };
  
      let response: Response;
      let result: any;
  
      if (isEditMode && businessId) {
        // Update existing business
        response = await fetch(`${API_URL}/entrepreneurships/${businessId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(requestData)
        });
      } else {
        // Create new business
        response = await fetch(`${API_URL}/entrepreneurships`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(requestData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el emprendimiento`);
      }
      
      result = await response.json();
      
      if (!result || !result.id) {
        throw new Error('La API no devolvió una respuesta válida.');
      }
  
      toast.success(`✅ Emprendimiento ${isEditMode ? 'actualizado' : 'creado'} exitosamente`, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
  
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default navigation if no callback provided
        navigate('/entrepreneur/businesses');
      }
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {isEditMode ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? 'Actualiza la información de tu emprendimiento.'
            : 'Completa la información básica para crear un nuevo emprendimiento.'}
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => navigate(-1))}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
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
    </div>
  );
}
