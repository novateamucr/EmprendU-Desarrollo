import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
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
}

// API base URL
const API_URL = 'http://emprendu-backend.test/api';

// Categories will be loaded from the API

export default function BusinessSetup() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: ''
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
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Load business data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBusiness = async () => {
        try {
          setIsLoading(true);
          const business = await entrepreneurshipApi.getById(id);
          setFormData({
            id: business.id,
            name: business.name,
            description: business.description,
            category: business.category,
            user_id: business.user_id
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
    }
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      setError('Por favor selecciona una categoría');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare the business data object according to API requirements
      if (!user?.id) {
        throw new Error('No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.');
      }

      const businessData = {
        name: formData.name,
        description: formData.description,
        category: Number(formData.category),
        user_id: user.id,
        // Required fields with default values
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: user,
        category_relation: categories.find(cat => cat.id === Number(formData.category)),
        products: []
      };
      
      let result;
      if (isEditMode && id) {
        result = await entrepreneurshipApi.update(id, businessData);
        if (!result || !result.id) {
          throw new Error('La API no devolvió una respuesta válida al actualizar.');
        }
        toast.success('Emprendimiento actualizado exitosamente');
      } else {
        result = await entrepreneurshipApi.create(businessData);
        if (!result || !result.id) {
          throw new Error('La API no devolvió una respuesta válida al crear.');
        }
        toast.success('Emprendimiento creado exitosamente');
      }

      // Only redirect after success; use SPA navigation (no full reload)
      navigate('/entrepreneur/businesses', { replace: true });
    } catch (err: any) {
      console.error('Error saving business:', err);
      const errorMessage = err.response?.data?.message || 'Ocurrió un error al guardar el emprendimiento. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-4">Cargando categorías...</span>
      </div>
    );
  }

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-4">Cargando emprendimiento...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? 'Editar Emprendimiento' : 'Crear Nuevo Emprendimiento'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode 
            ? 'Actualiza la información de tu emprendimiento.'
            : 'Completa la información básica para crear un nuevo emprendimiento.'}
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Editar emprendimiento' : 'Agregar Nuevo emprendimiento'}

        </h2>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del emprendimiento <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={isEditMode && formData.name ? formData.name : 'Ej: Mi Tienda Online'}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={isLoadingCategories}
                    className="w-full"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </Select>
                  {isLoadingCategories && (
                    <p className="mt-1 text-sm text-gray-500">Cargando categorías...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={isEditMode && formData.description ? formData.description : 'Describe tu emprendimiento...'}
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="mt-8 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/entrepreneur/businesses')}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-6 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Actualizar' : 'Crear'} Emprendimiento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
