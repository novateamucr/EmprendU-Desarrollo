import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { toast } from 'react-hot-toast';
import { entrepreneurshipApi } from '../../../services/entrepreneurshipService';
import { useAuth } from '../../../context/AuthContext';

interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  image_url: string | null;
  user_id?: number;
}

interface Category {
  id: number;
  name: string;
}

export default function BusinessForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    image_url: null,
    user_id: user?.id
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // This is a placeholder - replace with actual API call to fetch categories
        const mockCategories = [
          { id: 1, name: 'Alimentos' },
          { id: 2, name: 'Artesanías' },
          { id: 3, name: 'Tecnología' },
          { id: 4, name: 'Moda' },
          { id: 5, name: 'Belleza' },
        ];
        setCategories(mockCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Error al cargar las categorías');
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll just store the file name
      // In a real app, you would upload the file to a server
      setFormData(prev => ({
        ...prev,
        image_url: file.name
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.category) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsSubmitting(true);

      const businessData = {
        name: formData.name,
        description: formData.description,
        category: parseInt(formData.category),
        image_url: formData.image_url || '',
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_relation: categories.find(cat => cat.id === parseInt(formData.category)) || null,
        products: []
      };

      await entrepreneurshipApi.create(businessData);

      toast.success('Emprendimiento creado exitosamente');
      navigate('/entrepreneur/businesses');
    } catch (error) {
      console.error('Error creating business:', error);
      toast.error('Error al crear el emprendimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Emprendimiento</h1>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del emprendimiento <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Mi Tienda Online"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe tu emprendimiento"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <Select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen del emprendimiento
            </label>
            <div className="mt-1 flex items-center">
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.image_url ? 'Cambiar imagen' : 'Subir imagen'}
                </div>
                <input
                  id="image-upload"
                  name="image-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
              {formData.image_url && (
                <span className="ml-3 text-sm text-gray-500">{formData.image_url}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar emprendimiento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
