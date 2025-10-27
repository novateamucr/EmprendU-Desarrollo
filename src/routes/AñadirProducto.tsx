import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/Button";
import Input from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../hooks/useToast";
import useEntrepreneurships from "../hooks/useEntrepreneurships";
import { X, Upload } from "lucide-react";
import { cn } from "../lib/utils";
import {
  createProduct,
  updateProduct,
  getProduct,
  Product,
} from "../services/productService";
import { useParams, useLocation } from 'react-router-dom';

type FormDataState = {
  name: string;
  description: string;
  price: string;
  entrepreneurship_id: number;
  imageFile?: File | null;
  imagePreview?: string;
};

interface Props {
  businessId: string | null;
  initialData?: Product | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductFormUpload({
  businessId,
  initialData,
  onSuccess,
  onCancel,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const handleCancel = onCancel || (() => navigate(-1));
  const params = useParams();
  const location = useLocation();

  // If the component is used as a route, initial data can come from location.state or from params.id
  // Accept both :id and :productId route params depending on route configuration
  const paramId = params?.id ? parseInt(params.id, 10) : params?.productId ? parseInt(params.productId, 10) : null;
  const [fetchedInitial, setFetchedInitial] = useState<Product | null>(
    (location.state && (location.state as any).product) || initialData || null
  );
  const handleSuccess = onSuccess || (() => navigate(-1));

  const [form, setForm] = useState<FormDataState>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    entrepreneurship_id:
      initialData?.entrepreneurship_id || (businessId ? parseInt(businessId, 10) : 0),
    imageFile: null,
    imagePreview: initialData?.image_url || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { entrepreneurships, loading: businessesLoading, error: businessesError } = useEntrepreneurships();

  const [loadingInitial, setLoadingInitial] = useState<boolean>(false);
  const [populatedFromFetched, setPopulatedFromFetched] = useState<boolean>(false);

  useEffect(() => {
    // cleanup preview url when component unmounts or image changes
    return () => {
      if (form.imagePreview && form.imageFile) {
        try {
          URL.revokeObjectURL(form.imagePreview);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // If no entrepreneurship selected and we have a list, pick the first one or businessId
    if ((!form.entrepreneurship_id || form.entrepreneurship_id === 0) && entrepreneurships && entrepreneurships.length > 0) {
      const idFromProp = businessId ? parseInt(businessId, 10) : 0;
      const toSelect = idFromProp || entrepreneurships[0].id;
      setForm((p) => ({ ...p, entrepreneurship_id: toSelect }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrepreneurships, businessId]);

  // If we have an id param and no fetchedInitial, fetch the product
  useEffect(() => {
    const load = async () => {
      if (!fetchedInitial && paramId) {
        console.debug('AñadirProducto: paramId=', paramId);
        try {
          setLoadingInitial(true);
          const prod = await getProduct(paramId);
          console.debug('AñadirProducto: fetched product=', prod);
          setFetchedInitial(prod);
        } catch (err) {
          console.error('Error fetching product for edit:', err);
          toast({ title: 'Error', description: 'No se pudo cargar el producto', variant: 'destructive' });
        } finally {
          setLoadingInitial(false);
        }
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId, fetchedInitial]);

  // When fetchedInitial becomes available, populate the form if it's empty (only once)
  useEffect(() => {
    const src = fetchedInitial;
    if (src) {
      // Populate the form only once from the fetched initial product
      if (!populatedFromFetched) {
        setForm({
          name: src.name || "",
          description: src.description || "",
          price: src.price?.toString() || "",
          entrepreneurship_id: src.entrepreneurship_id ?? (src.entrepreneurship?.id ?? (businessId ? parseInt(businessId, 10) : 0)),
          imageFile: null,
          imagePreview: src.image_url || "",
        });
        setPopulatedFromFetched(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedInitial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato no válido",
        description: "Por favor sube una imagen válida (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    setIsUploading(true);
    setForm((prev) => ({ ...prev, imageFile: file, imagePreview: preview }));
    setIsUploading(false);
  };

  const removeImage = () => {
    if (form.imagePreview && form.imageFile) {
      try {
        URL.revokeObjectURL(form.imagePreview);
      } catch {}
    }
    setForm((prev) => ({ ...prev, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    // For new products, image is required
    const editingId = (fetchedInitial && fetchedInitial.id) || (initialData && initialData.id);
    if (!editingId && !form.imageFile) {
      toast({
        title: "Imagen requerida",
        description: "Por favor selecciona una imagen para el producto",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload objects that match productService signatures (not raw FormData)
      const dataForApi: any = {
        name: form.name,
        description: form.description || "",
        price: parseFloat(form.price),
        category_id: 1,
        entrepreneurship_id: form.entrepreneurship_id,
      };

      // For creation, image file is required and must be passed as File
      if (form.imageFile) {
        dataForApi.image = form.imageFile;
      }

      const updateId = (fetchedInitial && fetchedInitial.id) || (initialData && initialData.id);
      console.debug('AñadirProducto: payload for API', { updateId, dataForApi });

      if (updateId) {
        // For updates, if the user removed the preview and the original had image_url, interpret as removal
        if (!form.imagePreview && (fetchedInitial?.image_url || initialData?.image_url)) {
          // set image explicitly to null to trigger removal in updateProduct
          (dataForApi as any).image = null;
        }
        await updateProduct(updateId, dataForApi);
        toast({ title: "¡Listo!", description: "Producto actualizado correctamente" });
      } else {
        // Ensure image is provided for creation (checked above), but the service expects image File
        if (!dataForApi.image) {
          throw new Error('Imagen requerida para crear un producto');
        }
        await createProduct(dataForApi);
        toast({ title: "¡Listo!", description: "Producto creado correctamente" });
      }

      handleSuccess();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Ocurrió un error al guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto mt-10">
      {loadingInitial && (
        <div className="mb-4 text-gray-600">Cargando producto...</div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{initialData ? "Editar Producto" : "Agregar Producto"}</h1>
        <p className="text-sm text-gray-500 mt-1">{initialData ? "Actualiza los detalles del producto" : "Completa la información del nuevo producto"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Imagen del producto</label>
          <div className="mt-1 flex items-center">
            <div
              className={cn(
                "flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors",
                form.imagePreview && "border-0 p-0"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.imagePreview ? (
                <div className="relative group">
                  <img src={form.imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-lg" />
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
                    <span className="font-medium text-blue-600 hover:text-blue-500">Sube una imagen</span> o arrástrala aquí
                  </div>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hasta 5MB</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del producto <span className="text-red-500">*</span></label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Camiseta de algodón" className="w-full" required />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe tu producto..." className="w-full" />
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio <span className="text-red-500">*</span></label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₡</span>
            </div>
            <Input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="pl-8 w-full" required />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="entrepreneurship_id" className="block text-sm font-medium text-gray-700">Asignar a emprendimiento</label>
          <div>
            {businessesLoading ? (
              <div className="text-sm text-gray-500">Cargando emprendimientos...</div>
            ) : businessesError ? (
              <div className="text-sm text-red-500">Error cargando emprendimientos</div>
            ) : (
              <select
                id="entrepreneurship_id"
                name="entrepreneurship_id"
                value={String(form.entrepreneurship_id)}
                onChange={(e) => setForm((p) => ({ ...p, entrepreneurship_id: parseInt(e.target.value || "0", 10) }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={"0"}>Selecciona un emprendimiento</option>
                {entrepreneurships.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting || isUploading}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isUploading ? (
              <span className="flex items-center">Subiendo...</span>
            ) : isSubmitting ? (
              "Guardando..."
            ) : (
              "Guardar Producto"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
