import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Upload, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import Input from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { toast } from 'react-hot-toast';
import { entrepreneurshipApi } from '../services/entrepreneurshipService';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/userService';

interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  user_id?: number;
  image_url: string | null;
}

interface Category {
  id: number;
  name: string;
}

export default function BusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  // Fetch users for owner selector
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userApi.getAll();
        setUsers(data);
      } catch (error) {
        toast.error('Error al cargar los usuarios');
      }
    };
    fetchUsers();
  }, []);

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    image_url: null,
    user_id: user?.id
  });

  // Cargar datos del emprendimiento si hay id
  useEffect(() => {
    const fetchBusiness = async () => {
      if (!id) return;
      setLoadingBusiness(true);
      try {
        const business = await entrepreneurshipApi.getById(id);
        setFormData({
          name: business.name || '',
          description: business.description || '',
          category: business.category ? String(business.category) : '',
          image_url: business.image_url || null,
          user_id: business.user_id || user?.id
        });
      } catch (error) {
        toast.error('Error al cargar el emprendimiento');
      } finally {
        setLoadingBusiness(false);
      }
    };
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      };

      if (id) {
        await entrepreneurshipApi.update(id, businessData);
        toast.success('Emprendimiento actualizado exitosamente');
      } else {
        await entrepreneurshipApi.create(businessData);
        toast.success('Emprendimiento creado exitosamente');
      }
      navigate('/admin/emprendimientos');
    } catch (error) {
      console.error('Error guardando el emprendimiento:', error);
      toast.error('Error al guardar el emprendimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mt-20 mx-auto p-6">
      {loadingBusiness && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin h-6 w-6 mr-2" />
          <span className="text-gray-600">Cargando datos del emprendimiento...</span>
        </div>
      )}
      

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

          {/* Owner (usuario) */}
          <div>
            <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
              Propietario (usuario) <span className="text-red-500">*</span>
            </label>
            <Select
              id="user_id"
              name="user_id"
              value={formData.user_id ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, user_id: Number(e.target.value) }))}
              required
            >
              <option value="">Selecciona un usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
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
