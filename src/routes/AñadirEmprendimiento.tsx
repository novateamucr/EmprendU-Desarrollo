import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import SocialContactsEditor from './entrepreneur/components/SocialContactsEditor';
import { userApi, User } from '../services/userService';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { entrepreneurshipApi } from '../services/entrepreneurshipService';



// Form data interface matching API requirements
interface BusinessFormData {
  id?: number;
  name: string;
  description: string;
  category: number | string;
  user_id?: number;
  image_url?: string | null;
  imageFile?: File | null;
}

interface BusinessSetupProps {
  initialData?: Partial<BusinessFormData> | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// API base URL
const API_URL = 'https://emprendu-desarrollo-production.up.railway.app/api';

// Categories will be loaded from the API
// Local Category interface to ensure we use `nombre` consistently
interface Category {
  id: number;
  nombre: string;
}

export default function BusinessSetup({ initialData, onSuccess, onCancel }: BusinessSetupProps) {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id) || Boolean(initialData?.id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    user_id: initialData?.user_id || user?.id || undefined,
    image_url: initialData?.image_url || null
  });
  // Load users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userApi.getAll();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('No se pudieron cargar los usuarios');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<any>(`${API_URL}/categories`);
        // Handle both array and { data: [] } formats and normalize name/nombre
        const raw = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        const normalized: Category[] = raw.map((c: any) => ({
          id: c.id ?? c.value ?? c.key,
          nombre: c?.nombre ?? c?.name ?? c?.label ?? ''
        }));
        setCategories(normalized);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('No se pudieron cargar las categorías');
      } finally {
        // Categories loaded
      }
    };

    fetchCategories();
  }, []);

  // Ensure the owner appears in the selector even if not returned in the first users page
  useEffect(() => {
    const ensureOwnerPresent = async () => {
      try {
        if (!isEditMode) return;
        if (!formData.user_id) return;
        if (isLoadingUsers) return;
        const exists = users.some(u => u.id === Number(formData.user_id));
        if (!exists) {
          const owner = await userApi.getById(Number(formData.user_id));
          setUsers(prev => [owner, ...prev]);
        }
      } catch (error) {
        console.error('Error ensuring owner in users list:', error);
      }
    };
    ensureOwnerPresent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, formData.user_id, isLoadingUsers]);

  // Load business data if in edit mode and no initial data provided
  useEffect(() => {
    if (isEditMode && id && !initialData) {
      const fetchBusiness = async () => {
        try {
          setIsLoading(true);
          const business = await entrepreneurshipApi.getById(String(id));
          setFormData({
            id: business.id,
            name: business.name,
            description: business.description || '',
            category: (business as any).category ?? (business as any).category_id ?? '',
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        (name === 'user_id' || name === 'category' ? Number(value) : value)
    }));
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        image_url: URL.createObjectURL(file) // Create a preview URL
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      image_url: null
    }));
  };

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

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append all form data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('category', formData.category.toString());
      formDataToSend.append('status', 'active');
      
      // Add user_id if available
      if (formData.user_id) {
        formDataToSend.append('user_id', formData.user_id.toString());
      }
      
      // Handle image file if present
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      } else if (formData.image_url && !formData.image_url.startsWith('blob:')) {
        // If there's an image URL but no file, it's an existing image
        formDataToSend.append('image_url', formData.image_url);
      }
      
      // Log the form data for debugging
      console.log('Form data to send:', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        hasImage: !!formData.imageFile,
        imageUrl: formData.image_url
      });
      
      // Make the API request via service
      let result;
      if (isEditMode && id) {
        result = await entrepreneurshipApi.update(String(id), formDataToSend);
      } else {
        result = await entrepreneurshipApi.create(formDataToSend);
      }

      if (result) {
        // Only show success message if the API call was successful
        const successMessage = isEditMode 
          ? '✅ Emprendimiento actualizado exitosamente' 
          : '🎉 ¡Emprendimiento creado exitosamente!';
          
        toast.success(successMessage, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        });
        
        // Success is handled by the toast message
      } else {
        throw new Error('La respuesta del servidor no fue exitosa');
      }

      // At this point, we know the API call was successful
      
      // Only navigate on success
      if (onSuccess) {
        onSuccess();
      } else {
        // Small delay to show the success message before navigating
        setTimeout(() => {
          navigate('/admin/emprendimientos');
        }, 500);
      }
      
  return result;
      
    } catch (err: any) {
      console.error('Error saving business:', err);
      
      // Log the full error response for debugging
      console.log('Full error response:', err.response?.data);
      
      // If it's an Axios error with response data
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Create a container div for the error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'text-left';
        
        // Add the main error message
        if (errorData.message) {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'font-bold text-red-600';
          messageDiv.textContent = errorData.message;
          errorContainer.appendChild(messageDiv);
        }
        
        // Add the reason if it exists and is different from message
        if (errorData.reason && errorData.reason !== errorData.message) {
          const reasonDiv = document.createElement('div');
          reasonDiv.className = 'mt-1 text-red-600';
          reasonDiv.textContent = errorData.reason;
          errorContainer.appendChild(reasonDiv);
        }
        
        // Add fields with issues if they exist
        if (errorData.fields_with_issues && errorData.fields_with_issues.length > 0) {
          const fieldsDiv = document.createElement('div');
          fieldsDiv.className = 'mt-2';
          
          const fieldsTitle = document.createElement('p');
          fieldsTitle.className = 'font-medium';
          fieldsTitle.textContent = 'Campos con problemas:';
          fieldsDiv.appendChild(fieldsTitle);
          
          const fieldsList = document.createElement('ul');
          fieldsList.className = 'list-disc pl-5 mt-1 space-y-1';
          
          errorData.fields_with_issues.forEach((field: string) => {
            const fieldItem = document.createElement('li');
            fieldItem.textContent = field;
            fieldsList.appendChild(fieldItem);
          });
          
          fieldsDiv.appendChild(fieldsList);
          errorContainer.appendChild(fieldsDiv);
        }
        
        // Add suggestions if they exist
        if (errorData.suggestions && errorData.suggestions.length > 0) {
          const suggestionsDiv = document.createElement('div');
          suggestionsDiv.className = 'mt-2';
          
          const suggestionsTitle = document.createElement('p');
          suggestionsTitle.className = 'font-medium';
          suggestionsTitle.textContent = 'Sugerencias:';
          suggestionsDiv.appendChild(suggestionsTitle);
          
          const suggestionsList = document.createElement('ul');
          suggestionsList.className = 'list-disc pl-5 mt-1 space-y-1';
          
          errorData.suggestions.forEach((suggestion: string) => {
            const suggestionItem = document.createElement('li');
            suggestionItem.textContent = suggestion;
            suggestionsList.appendChild(suggestionItem);
          });
          
          suggestionsDiv.appendChild(suggestionsList);
          errorContainer.appendChild(suggestionsDiv);
        }
        
        // Show the error message using dangerouslySetInnerHTML
        toast.error(
          <div dangerouslySetInnerHTML={{ __html: errorContainer.outerHTML }} />,
          {
            duration: 10000,
            style: {
              maxWidth: '500px',
              padding: '1rem',
              whiteSpace: 'pre-line',
              textAlign: 'left'
            }
          }
        );
      } 
      // For other types of errors, use the error message if available
      else if (err.message) {
        toast.error(err.message, {
          duration: 10000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '500px',
            textAlign: 'left',
            padding: '1rem'
          }
        });
      } else {
        // Fallback for other error formats
        toast.error('Ocurrió un error inesperado al guardar el emprendimiento', {
          duration: 10000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '500px',
            textAlign: 'left',
            padding: '1rem'
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl mt-10 dark:bg-backgroundDark min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 dark:text-white">
          {isEditMode ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          {isEditMode
            ? 'Actualiza la información de tu emprendimiento.'
            : 'Completa la información básica para crear un nuevo emprendimiento.'}
        </p>
      </div>

      <Card className="p-6 dark:bg-cardDark dark:border-cardDark">
        <form onSubmit={handleSubmit}>
          <div className="max-w-4xl mx-auto space-y-6">
            

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 dark:text-white">
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
              <label htmlFor="category" className="block text-sm font-medium mb-1 dark:text-white">
                Categoría *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input dark:border-cardDark bg-background dark:bg-backgroundDark px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
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
              <label htmlFor="user_id" className="block text-sm font-medium mb-1 dark:text-white">
                Propietario del emprendimiento *
              </label>
              <select
                id="user_id"
                name="user_id"
                value={formData.user_id ? String(formData.user_id) : ''}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input dark:border-cardDark bg-background dark:bg-backgroundDark px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
                required
                disabled={isLoadingUsers}
              >
                <option value="">Selecciona un usuario</option>
                {users.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-white">
                Descripción
              </label>
              <div className="relative">
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe tu emprendimiento en al menos 150 caracteres..."
                  rows={4}
                  minLength={150}
                  className={`pr-16 ${formData.description.length > 0 && formData.description.length < 150 ? 'border-yellow-500 focus-visible:ring-yellow-500' : ''}`}
                  required
                />
                <div className={`absolute bottom-2 right-2 text-xs ${
                  formData.description.length < 150 ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formData.description.length}/150
                </div>
              </div>
              {formData.description.length > 0 && formData.description.length < 150 && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  La descripción debe tener al menos 150 caracteres (actualmente: {formData.description.length})
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium mb-1 dark:text-white">
                Imagen del emprendimiento
              </label>
              <div className="mt-1 flex items-center">
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="Vista previa" 
                      className="h-32 w-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      aria-label="Eliminar imagen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-cardDark hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o JPEG (MAX. 5MB)</p>
                      </div>
                      <input 
                        id="image" 
                        name="image" 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
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
      {/* Redes y contactos (Admin) */}
      <div className="mt-6 max-w-4xl mx-auto">
        <Card className="p-6 dark:bg-cardDark dark:border-cardDark">
          {isEditMode && (formData.id || id) ? (
            <SocialContactsEditor entrepreneurshipId={Number(formData.id || id)} />
          ) : (
            <div className="space-y-2">
              <div>
                <h2 className="text-lg font-semibold dark:text-white">Redes y contactos de tu emprendimiento</h2>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Guarda primero la información básica para habilitar la administración de redes y contactos.</p>
              </div>
              <div className="p-4 rounded border bg-gray-50 dark:bg-cardDark dark:border-cardDark text-sm text-gray-600 dark:text-gray-400">
                Una vez crees el emprendimiento, podrás añadir WhatsApp, Teléfono, Maps, Sitio web, Email y más.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
