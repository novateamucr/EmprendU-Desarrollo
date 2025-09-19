import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import  Input  from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card } from '../../../components/ui/Card';
import { entrepreneurshipApi } from '../../../services/entrepreneurshipService';
import { toast } from 'react-hot-toast';

// Extend the Entrepreneurship interface to include our form fields
interface BusinessFormData {
  id?: number;
  name: string;
  description: string;
  category: number | string;
  image_url: string | null;
  isActive: boolean;
  address: string;
  phone: string;
  email: string;
  website: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  banned?: boolean;
}

// Categories should match the ones in your backend
const BUSINESS_CATEGORIES = [
  { id: 1, name: 'Alimentos y Bebidas' },
  { id: 2, name: 'Moda' },
  { id: 3, name: 'Tecnología' },
  { id: 4, name: 'Belleza y Cuidado Personal' },
  { id: 5, name: 'Hogar' },
  { id: 6, name: 'Deportes' },
  { id: 7, name: 'Juguetes y Juegos' },
  { id: 8, name: 'Arte y Manualidades' },
  { id: 9, name: 'Salud' },
  { id: 10, name: 'Otros' }
];

export default function BusinessSetup() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    image_url: null,
    isActive: true,
    address: '',
    phone: '',
    email: '',
    website: ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load business data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBusiness = async () => {
        try {
          setIsLoading(true);
          const business = await entrepreneurshipApi.getById(id);
          
          setFormData({
            ...business,
            category: business.category,
            isActive: !(business as any).banned,
            address: (business as any).address || '',
            phone: (business as any).phone || '',
            email: (business as any).email || '',
            website: (business as any).website || ''
          });
          
          if (business.image_url) {
            setLogoPreview(business.image_url);
          }
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
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe pesar más de 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({
          ...prev,
          image_url: result
        }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      image_url: null
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
      
      // Prepare the business data object
      const businessData: any = {
        name: formData.name,
        description: formData.description,
        category: Number(formData.category),
        banned: !formData.isActive,
        // Add optional fields if they exist
        ...(formData.address && { address: formData.address }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.email && { email: formData.email }),
        ...(formData.website && { website: formData.website }),
      };
      
      // Handle image separately if it's a base64 string
      if (formData.image_url && typeof formData.image_url === 'string') {
        businessData.image_url = formData.image_url;
      }
      
      if (isEditMode && id) {
        await entrepreneurshipApi.update(id, businessData);
        toast.success('emprendimiento actualizado exitosamente');
      } else {
        await entrepreneurshipApi.create(businessData);
        toast.success('emprendimiento creado exitosamente');

      }
      
      navigate('/entrepreneur/businesses');
    } catch (err: any) {
      console.error('Error saving business:', err);
      const errorMessage = err.response?.data?.message || 'Ocurrió un error al guardar el emprendimiento. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del emprendimiento <span className="text-red-500">*</span>

                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Mi Tienda de Ropa"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', parseInt(e.target.value))}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe tu emprendimiento en pocas palabras..."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo del emprendimiento

                  </label>
                  <div className="mt-1 flex items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-lg bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo del emprendimiento" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Upload className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <label 
                          htmlFor="logo-upload"
                          className="cursor-pointer p-2 bg-white bg-opacity-90 rounded-full text-primary hover:bg-opacity-100"
                        >
                          <Upload className="h-5 w-5" />
                          <span className="sr-only">Subir logo</span>
                          <input 
                            id="logo-upload" 
                            name="logo-upload" 
                            type="file" 
                            className="sr-only" 
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                        </label>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="ml-2 p-2 bg-white bg-opacity-90 rounded-full text-red-600 hover:bg-opacity-100"
                          >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Eliminar logo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Tamaño recomendado: 200x200px. Formatos: JPG, PNG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <Input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Dirección completa"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+123 456 7890"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contacto@ejemplo.com"
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Red social
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  https://
                </span>
                <Input
                  id="website"
                  name="website"
                  type="text"
                  value={formData.website.replace('https://', '')}
                  onChange={(e) => handleInputChange({
                    ...e,
                    target: {
                      ...e.target,
                      name: 'website',
                      value: `https://${e.target.value}`
                    }
                  })}
                  className="rounded-l-none"
                  placeholder="tuemprendimiento.com"
                />
              </div>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                {formData.isActive ? 'Activo' : 'Inactivo'}
              </label>
            </div>
            
            <Button 
              type="submit" 
              variant="default"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Actualizar emprendimiento' : 'Crear emprendimiento'}

                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
