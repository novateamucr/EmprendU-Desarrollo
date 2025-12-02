import { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { entrepreneurshipApi, categoryApi } from '../../../services/entrepreneurshipService';
import SocialContactsEditor from './SocialContactsEditor';
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
  imageFile?: File | null;
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
    image_url: initialData?.image_url || null,
    imageFile: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Formato no válido. Por favor sube una imagen válida (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setIsUploading(true);
      // Create a preview URL
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate processing time for better UX (optional)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        image_url: imageUrl
      }));
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('No se pudo procesar la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    // Revoke the object URL to avoid memory leaks
    if (formData.image_url && formData.image_url.startsWith('blob:')) {
      URL.revokeObjectURL(formData.image_url);
    }
    
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      image_url: ''
    }));
    
    // Reset the file input
    const fileInput = document.getElementById('business-image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Handle form submission
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

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Basic business info
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', (formData.description || '').trim());
      formDataToSend.append('category', formData.category.toString());
      formDataToSend.append('status', 'active');
      
      // Add user_id for new businesses
      if (!isEditMode) {
        formDataToSend.append('user_id', user.id.toString());
      }
      
      // Handle image file if present
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      } else if (formData.image_url && !formData.image_url.startsWith('blob:')) {
        // If there's an existing image URL and no new file, keep the existing image
        formDataToSend.append('image_url', formData.image_url);
      } else if (isEditMode && !formData.image_url) {
        // If in edit mode and no image is set, ensure we don't send image_url
        formDataToSend.append('image_url', '');
      }
      
      // Log the form data for debugging
      console.log('Submitting form data:', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        hasImage: !!formData.imageFile,
        imageUrl: formData.image_url,
        isEditMode,
        currentBusinessId
      });
      
      // Make the API request
      if (isEditMode && currentBusinessId) {
        // For updates, use PUT method
        result = await entrepreneurshipApi.update(String(currentBusinessId), formDataToSend as any);
      } else {
        // For new businesses, use POST
        result = await entrepreneurshipApi.create(formDataToSend as any);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl mt-10 dark:bg-backgroundDark min-h-screen">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 dark:text-white">
            {isEditMode ? 'Editar emprendimiento' : 'Nuevo emprendimiento'}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            {isEditMode
              ? 'Actualiza la información de tu emprendimiento.'
              : 'Completa la información básica para crear un nuevo emprendimiento.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/entrepreneur/businesses')}
          className="px-3 py-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <Card className="p-6 max-w-4xl mx-auto dark:bg-cardDark dark:border-cardDark">
        {/* Formulario principal del emprendimiento */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {!isEditMode && (
              <div className="flex flex-col items-center">
                <label className="block w-full text-sm font-medium mb-3 dark:text-white">
                  Imagen del emprendimiento
                </label>
                <ImageUpload
                  currentImage={typeof formData.image_url === 'string' ? formData.image_url || undefined : undefined}
                  placeholderInitial={(formData.name || 'E').trim().charAt(0).toUpperCase()}
                  onImageChange={(imageData: string) => {
                    setFormData(prev => ({ ...prev, image_url: imageData }));
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground dark:text-gray-400 text-center">
                  Sube una imagen representativa de tu emprendimiento. Formatos: JPG, PNG. Máx 5MB.
                </p>
              </div>
            )}
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
                className="dark:bg-backgroundDark dark:text-white dark:border-cardDark"
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
              <label htmlFor="description" className="block text-sm font-medium mb-1 dark:text-white">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe tu emprendimiento..."
                rows={4}
                className="dark:bg-backgroundDark dark:text-white dark:border-cardDark"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">
                Imagen del emprendimiento
              </label>
              <div className="mt-1 flex items-center">
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="Vista previa" 
                      className="h-32 w-32 object-cover rounded-md border dark:border-cardDark"
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
                    <label 
                      className={cn(
                        'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer',
                        'bg-gray-50 dark:bg-cardDark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        isUploading && 'opacity-70 cursor-wait'
                      )}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
                        ) : (
                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                        )}
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG o JPEG (MAX. 5MB)</p>
                      </div>
                      <input 
                        id="business-image"
                        name="image" 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleImageChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">
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
  <Card className="p-4 sm:p-6 w-full dark:bg-cardDark dark:border-cardDark">
          {businessId ? (
            <SocialContactsEditor entrepreneurshipId={Number(businessId)} />
          ) : (
            <div className="flex flex-col gap-3">
              {/* Order explicit for mobile: 1) title+desc, 2) admin box, 3) add button */}
              <div className="order-1">
                <h2 className="text-lg font-semibold dark:text-white">Redes y contactos de tu emprendimiento</h2>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Guarda primero la información básica para habilitar la administración de redes y contactos.</p>
              </div>

              <div className="order-2 p-4 rounded border bg-gray-50 dark:bg-cardDark dark:border-cardDark text-sm text-gray-600 dark:text-gray-400">
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
          <div className="relative z-10 bg-white dark:bg-cardDark rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2 dark:text-white">¿Quieres salir del editar perfil?</h3>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-4">Puedes seguir editando o volver a tus emprendimientos.</p>
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
