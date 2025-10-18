import { useState, useRef, ChangeEvent } from "react";
import { Button } from "../../../../components/Button";
import Input from "../../../../components/ui/Input";
import { Textarea } from "../../../../components/ui/Textarea";
import {
  createProduct,
  updateProduct,
  Product,
  uploadProductImage,
} from "../../../../services/productService";
import { useToast } from "../../../../hooks/useToast";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

type FormData = {
  name: string;
  description: string;
  price: string;
  image_url: string;
  imageFile?: File | null;
  entrepreneurship_id: number;
};

interface ProductFormProps {
  businessId: string | null;
  initialData?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  businessId,
  initialData,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    image_url: initialData?.image_url || "",
    imageFile: null,
    entrepreneurship_id:
      initialData?.entrepreneurship_id ||
      (businessId ? parseInt(businessId, 10) : 0),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen válida (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      // In a real app, you would upload the file to your server here
      // For now, we'll just create a local object URL for preview
      const imageUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image_url: imageUrl,
        imageFile: file,
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image_url: "",
      imageFile: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    // For new products, image is required
    if (!initialData?.id && !formData.imageFile) {
      toast({
        title: "Imagen requerida",
        description: "Por favor selecciona una imagen para el producto",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: 1, // Default category
        entrepreneurship_id: formData.entrepreneurship_id,
      };

      if (initialData?.id) {
        // For updates, handle image cases:
        if (formData.imageFile) {
          // New image is being uploaded
          productData.image = formData.imageFile;
        } else if (!formData.image_url && initialData.image_url) {
          // Image was removed
          productData.image = null;
        } else if (initialData.image_url) {
          // Keep the existing image
          productData.image_url = initialData.image_url;
        }
        
        await updateProduct(initialData.id, productData);
        toast({
          title: "¡Listo!",
          description: "Producto actualizado correctamente",
        });
      } else {
        // For new products, we already require an imageFile
        await createProduct({
          ...productData,
          image: formData.imageFile!,
        });
        toast({
          title: "¡Listo!",
          description: "Producto creado correctamente",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg mx-auto my-8 shadow-2xl overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            {initialData ? "Editar Producto" : "Agregar Producto"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {initialData
              ? "Actualiza los detalles del producto"
              : "Completa la información del nuevo producto"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Imagen del producto
            </label>
            <div className="mt-1 flex items-center">
              <div
                className={cn(
                  "flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors",
                  formData.image_url && "border-0 p-0"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.image_url ? (
                  <div className="relative group">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-40 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Sube una imagen
                      </span>{" "}
                      o arrástrala aquí
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 5MB
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre del producto <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Camiseta de algodón"
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Descripción
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe tu producto..."
              className="w-full"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Precio <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₡</span>
              </div>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="pl-8 w-full"
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subiendo...
                </span>
              ) : isSubmitting ? (
                "Guardando..."
              ) : (
                "Guardar Producto"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
