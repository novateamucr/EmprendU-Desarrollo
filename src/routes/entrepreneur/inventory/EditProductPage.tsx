import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct, updateProduct, type Product } from '../../../services/productService';
import { Button } from '../../../components/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Loader2, X, Upload, Sparkles, MoreHorizontal, CheckCircle } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { Skeleton } from '../../../components/ui/Skeleton';

import {
  getProductOptions,
  getOptionValues,
  getCustomForms,
  getProductBuilder,
  updateProductBuilder,
  deleteProductOption,
  deleteOptionValue,
  deleteCustomForm,
  type ProductOption,
  type ProductOptionValue,
  type ProductCustomForm,
} from '../../../services/productConfigService';

function AddFieldDropdown({
  onSelect,
  disabled,
}: {
  onSelect: (
    type: 'select' | 'multiselect' | 'text' | 'textarea' | 'number' | 'boolean'
  ) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // cerrar menú al hacer click afuera
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const types = [
    { key: 'select', name: 'Selector' },
    { key: 'multiselect', name: 'Multiselector' },
    { key: 'text', name: 'Texto corto' },
    { key: 'textarea', name: 'Texto amplio' },
    { key: 'number', name: 'Número' },
    { key: 'boolean', name: 'Interruptor' },
  ] as const;

  return (
    <div ref={ref} className="relative">
      <Button
        disabled={disabled}
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <span>+</span>
        Tipo de campo
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md z-20">
          {types.map((t) => (
            <button
              key={t.key}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
              onClick={() => {
                onSelect(t.key);
                setOpen(false);
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


export default function EditProductPage() {
  const { productId, businessId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pid = Number(productId);
  const stateProduct = (location.state as any)?.product as Product | undefined;

  const [activeTab, setActiveTab] = useState<'general' | 'form'>('general');
  const [showSavedPulse, setShowSavedPulse] = useState(false);
  const [formForbidden, setFormForbidden] = useState(false);

  // ===== QUERIES =====
  const productQuery = useQuery({
    queryKey: ['product', pid],
    queryFn: () => getProduct(pid),
    enabled: !!pid && !stateProduct,
  });

  const optionsQuery = useQuery({
    queryKey: ['product-options', pid],
    queryFn: () => getProductOptions(pid),
    enabled: !!pid && activeTab === 'form' && !formForbidden,
    retry: false,
  });

  const formsQuery = useQuery({
    queryKey: ['product-custom-forms', pid],
    queryFn: () => getCustomForms(pid),
    enabled: !!pid && activeTab === 'form' && !formForbidden,
    retry: false,
  });

  const [expandedOptionId, setExpandedOptionId] = useState<number | null>(null);

  const valuesQuery = useQuery({
    queryKey: ['product-option-values', pid, expandedOptionId],
    queryFn: () => getOptionValues(pid, expandedOptionId as number),
    enabled: !!pid && !!expandedOptionId && activeTab === 'form' && !formForbidden,
    retry: false,
  });

  // Manejo de 403 en distintas queries
  useEffect(() => {
    const err: any = optionsQuery.error as any;
    if (err?.response?.status === 403) setFormForbidden(true);
  }, [optionsQuery.error]);

  useEffect(() => {
    const err: any = formsQuery.error as any;
    if (err?.response?.status === 403) setFormForbidden(true);
  }, [formsQuery.error]);

  useEffect(() => {
    const err: any = valuesQuery.error as any;
    if (err?.response?.status === 403) setFormForbidden(true);
  }, [valuesQuery.error]);

  // ===== ESTADO DEL BUILDER =====
  const [draftOpts, setDraftOpts] = useState<ProductOption[]>([]);
  const [draftForms, setDraftForms] = useState<ProductCustomForm[]>([]);
  const [draftValues, setDraftValues] = useState<Record<number, ProductOptionValue[]>>({});

  const [initialSnapshot, setInitialSnapshot] = useState<{
    options: ProductOption[];
    values: Record<number, ProductOptionValue[]>;
    custom_forms: ProductCustomForm[];
  } | null>(null);

  const [baselineSnapshot, setBaselineSnapshot] = useState<{
    options: ProductOption[];
    values: Record<number, ProductOptionValue[]>;
    custom_forms: ProductCustomForm[];
  } | null>(null);

  const [baselineKind, setBaselineKind] = useState<'server' | 'draft'>('server');

  const [deletedOptionIds, setDeletedOptionIds] = useState<number[]>([]);
  const [deletedValueIds, setDeletedValueIds] = useState<number[]>([]);
  const [deletedFormIds, setDeletedFormIds] = useState<number[]>([]);

  const draftKey = `product:${pid}:builderDraft`;
  const [hasDraftLS, setHasDraftLS] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [isBuilderLoading, setIsBuilderLoading] = useState(false);
  const [builderErrors, setBuilderErrors] = useState<string[]>([]); 
 


  // Carga inicial del builder al entrar a la pestaña "form"
  useEffect(() => {
    if (activeTab !== 'form' || formForbidden || !pid) return;

    const init = async () => {
      try {
        setIsBuilderLoading(true);          // ⬅️ empieza skeleton

        const ls = localStorage.getItem(draftKey);
        if (ls) {
          setHasDraftLS(true);
          setShowDraftPrompt(true);
        }

        const data = await getProductBuilder(pid);
        const serverSnap = {
          options: data.options || [],
          values: (data.values as any) || {},
          custom_forms: data.custom_forms || [],
        };

        setInitialSnapshot(serverSnap);
        setBaselineSnapshot(serverSnap);
        setBaselineKind('server');

        if (!ls) {
          setDraftOpts((data.options || []).map((o: ProductOption) => ({ ...o })));
          setDraftForms((data.custom_forms || []).map((f: ProductCustomForm) => ({ ...f })));
          const vals: Record<number, ProductOptionValue[]> = {};
          Object.keys(data.values || {}).forEach((k) => {
            const key = Number(k);
            vals[key] = (data.values[key] || []).map((v: ProductOptionValue) => ({ ...v }));
          });
          setDraftValues(vals);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'No se pudo cargar el formulario del producto',
          variant: 'destructive',
        });
      } finally {
        setIsBuilderLoading(false);         // ⬅️ termina skeleton
      }
    };

    init();
  }, [activeTab, formForbidden, pid, toast, draftKey]);


  // Continuar con borrador guardado
  const continueDraft = () => {
    try {
      const ls = localStorage.getItem(draftKey);
      if (!ls) return discardDraftPrompt();

      const draft = JSON.parse(ls);
      setDraftOpts((draft.options || []).map((o: ProductOption) => ({ ...o })));
      setDraftForms((draft.custom_forms || []).map((f: ProductCustomForm) => ({ ...f })));
      setDraftValues(draft.values || {});
      setDeletedOptionIds(draft.deletedOptionIds || []);
      setDeletedValueIds(draft.deletedValueIds || []);
      setDeletedFormIds(draft.deletedFormIds || []);

      setBaselineSnapshot({
        options: (draft.options || []).map((o: ProductOption) => ({ ...o })),
        custom_forms: (draft.custom_forms || []).map((f: ProductCustomForm) => ({ ...f })),
        values: draft.values || {},
      });
      setBaselineKind('draft');
      setHasInteracted(false);
    } finally {
      setShowDraftPrompt(false);
    }
  };

  // Descartar borrador local
  const discardDraftPrompt = () => {
    localStorage.removeItem(draftKey);
    setHasDraftLS(false);
    setShowDraftPrompt(false);

    if (initialSnapshot) {
      setDraftOpts(initialSnapshot.options.map((o) => ({ ...o })));
      setDraftForms(initialSnapshot.custom_forms.map((f) => ({ ...f })));
      const vals: Record<number, ProductOptionValue[]> = {};
      Object.keys(initialSnapshot.values || {}).forEach((k) => {
        const key = Number(k);
        vals[key] = (initialSnapshot.values[key] || []).map((v: ProductOptionValue) => ({ ...v }));
      });
      setDraftValues(vals);

      setBaselineSnapshot({
        options: initialSnapshot.options.map((o) => ({ ...o })),
        custom_forms: initialSnapshot.custom_forms.map((f) => ({ ...f })),
        values: initialSnapshot.values,
      });
      setBaselineKind('server');
      setHasInteracted(false);
    }

    setDeletedOptionIds([]);
    setDeletedValueIds([]);
    setDeletedFormIds([]);
  };

  // Cargar valores cuando se expande una opción
  useEffect(() => {
    if (expandedOptionId && valuesQuery.data) {
      const vals = valuesQuery.data as ProductOptionValue[];
      setDraftValues((prev) => ({
        ...prev,
        [expandedOptionId]: vals.map((v: ProductOptionValue) => ({ ...v })),
      }));
    }
  }, [expandedOptionId, valuesQuery.data]);

  // ===== MUTATIONS =====
  const updateProductMut = useMutation({
    mutationFn: (data: Partial<Product>) => updateProduct(pid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', pid] });
      toast({ title: 'Producto actualizado', description: 'Se guardaron los cambios.' });
      setShowSavedPulse(true);
      setTimeout(() => setShowSavedPulse(false), 1500);
    },
  });

  const deleteOptMut = useMutation({
    mutationFn: (optionId: number) => deleteProductOption(pid, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options', pid] });
      toast({ title: 'Campo eliminado' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const deleteValMut = useMutation({
    mutationFn: ({ optionId, valueId }: { optionId: number; valueId: number }) =>
      deleteOptionValue(pid, optionId, valueId),
    onSuccess: () => {
      if (expandedOptionId) {
        queryClient.invalidateQueries({
          queryKey: ['product-option-values', pid, expandedOptionId],
        });
      }
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const deleteFormMut = useMutation({
    mutationFn: (id: number) => deleteCustomForm(pid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-forms', pid] });
      toast({ title: 'Campo eliminado' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const product = stateProduct || productQuery.data;

  // ===== FORM GENERAL PRODUCTO =====

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);
  const [showBuilderSavedPulse, setShowBuilderSavedPulse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    image_url: string;
    imageFile?: File | null;
    entrepreneurship_id: number;
  }>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFile: null,
    entrepreneurship_id: businessId ? Number(businessId) : 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price != null ? String(product.price) : '',
        image_url: product.image_url || '',
        imageFile: null,
        entrepreneurship_id: product.entrepreneurship_id || (businessId ? Number(businessId) : 0),
      });
    }
  }, [product, businessId]);

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato no válido',
        description: 'Sube una imagen válida',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'La imagen no debe superar los 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    const previewUrl = URL.createObjectURL(file);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setFormData((prev) => ({ ...prev, image_url: previewUrl, imageFile: file }));

    setTimeout(() => {
      setIsUploading(false);
    }, 500);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '', imageFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'El nombre del producto es obligatorio.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.price) {
      toast({
        title: 'Precio requerido',
        description: 'Ingresa un precio para el producto.',
        variant: 'destructive',
      });
      return;
    }

    const priceNumber = parseFloat(formData.price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      toast({
        title: 'Precio inválido',
        description: 'El precio debe ser un número mayor o igual a 0.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceNumber,
        image_url: formData.image_url,
        category_id: 1,
        entrepreneurship_id: formData.entrepreneurship_id,
      };

      if (formData.imageFile) {
        productData.image = formData.imageFile;
      }

      await updateProductMut.mutateAsync(productData);
    } catch (err) {
      console.error('Error saving product:', err);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el producto',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejo de error al cargar producto
  useEffect(() => {
    if (productQuery.isError) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el producto',
        variant: 'destructive',
      });
    }
  }, [productQuery.isError, toast]);

  if (productQuery.isLoading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold mb-2">Producto no disponible</h2>
          <p className="text-sm text-gray-600">Intenta recargar la página o verifica tu conexión.</p>
        </div>
      </div>
    );
  }

  // ===== VALIDACIÓN DEL BUILDER ANTES DE GUARDAR =====
  const validateBuilder = () => {
    const errors: string[] = [];

    // Opciones tipo select / multiselect
    draftOpts.forEach((opt, index) => {
      const labelIndex = index + 1;
      if (!opt.name || !opt.name.trim()) {
        errors.push(`El cambo de selección #${labelIndex} no tiene título.`);
      }

      if (opt.type === 'multiselect') {
        const min = opt.min_select ?? 0;
        const max = opt.max_select ?? 0;
        if (max > 0 && min > max) {
          errors.push(
            `En el cambo multiselector "${opt.name || `#${labelIndex}`}", el mínimo no puede ser mayor que el máximo.`
          );
        }
      }

      if (opt.type === 'multiselect') {
        const max = opt.max_select ?? 0;
        if (max <= 1) {
          errors.push(
            `El cambo multiselector "${opt.name || `#${labelIndex}`}" debe permitir seleccionar al menos 2 opciones.`
          );
        }
      }


      const values = draftValues[opt.id] || [];
      if ((opt.type === 'select' || opt.type === 'multiselect') && values.length === 0) {
        errors.push(
          `El cambo "${opt.name || `#${labelIndex}`}" es de selección y no tiene valores configurados.`
        );
      }
    });

    // Campos de formulario
    draftForms.forEach((f, index) => {
      const labelIndex = index + 1;
      if (!f.label || !f.label.trim()) {
        errors.push(`El campo de formulario #${labelIndex} no tiene título.`);
      }

      if (['text', 'textarea', 'number'].includes(f.input_type)) {
        if (f.max_length != null && f.max_length < 0) {
          errors.push(`El campo "${f.label || `#${labelIndex}`}" tiene un máximo de caracteres negativo.`);
        }
      }
    });

    setBuilderErrors(errors);
    return errors.length === 0;
  };

  const handleAddField = (
    type: 'select' | 'multiselect' | 'text' | 'textarea' | 'number' | 'boolean'
  ) => {
    if (formForbidden) return;

    const lastOrder = [...draftOpts, ...draftForms].reduce(
      (m, i: any) => Math.max(m, i.display_order || 0),
      0
    );

    const baseOrder = lastOrder + 1;

    switch (type) {
      case 'select': {
        const tempId = -Date.now();
        const payload = {
          name: 'Nuevo selector',
          type: 'select' as const,
          required: false,
          display_order: baseOrder,
        };
        setDraftOpts(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }

      case 'multiselect': {
        const tempId = -Date.now() - 1;
        const payload = {
          name: 'Nuevo multiselector',
          type: 'multiselect' as const,
          required: false,
          display_order: baseOrder,
          min_select: 1,
          max_select: 2,
        };
        setDraftOpts(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }

      case 'text': {
        const tempId = -Date.now() - 2;
        const payload = {
          label: 'Texto corto',
          input_type: 'text' as const,
          required: false,
          max_length: null,
          help_text: '',
          display_order: baseOrder,
        };
        setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }

      case 'textarea': {
        const tempId = -Date.now() - 3;
        const payload = {
          label: 'Texto amplio',
          input_type: 'textarea' as const,
          required: false,
          max_length: null,
          help_text: '',
          display_order: baseOrder,
        };
        setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }

      case 'number': {
        const tempId = -Date.now() - 4;
        const payload = {
          label: 'Número',
          input_type: 'number' as const,
          required: false,
          max_length: null,
          help_text: '',
          display_order: baseOrder,
        };
        setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }

      case 'boolean': {
        const tempId = -Date.now() - 5;
        const payload = {
          label: 'Interruptor',
          input_type: 'boolean' as const,
          required: false,
          max_length: null,
          help_text: '',
          display_order: baseOrder,
        };
        setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
        break;
      }
    }

    setHasInteracted(true);
  };

  const getItemLabel = (it: {
    kind: 'option' | 'form';
    data: ProductOption | ProductCustomForm;
  }): string => {
    if (it.kind === 'option') {
      const opt = it.data as ProductOption;
      if (opt.type === 'select') return 'Selector';
      if (opt.type === 'multiselect') return 'Multiselector';
      return 'Selector';
    }

    const f = it.data as ProductCustomForm;
    switch (f.input_type) {
      case 'text':
        return 'Texto corto';
      case 'textarea':
        return 'Texto amplio';
      case 'number':
        return 'Número';
      case 'boolean':
        return 'Interruptor';
      default:
        return 'Campo';
    }
  };


  // ===== RENDER =====
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-4">
        {[
          { key: 'general', label: 'Datos generales' },
          { key: 'form', label: 'Formulario del producto' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as 'general' | 'form')}
            className={`py-2 px-4 -mb-px border-b-2 text-sm font-medium ${
              activeTab === t.key
                ? 'border-brand text-brandDark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB GENERAL */}
      {activeTab === 'general' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Datos Generales</h2>
              <p className="text-sm text-gray-500 mt-1">Información básica del producto</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Imagen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                    Imagen del producto
                  </label>
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <div className="mt-1">
                  {formData.image_url ? (
                    <div className="relative group">
                      <img
                        src={formData.image_url}
                        alt="Vista previa del producto"
                        className="h-64 w-full object-cover rounded-lg border border-gray-200"
                      />
                      {isUploading && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm border border-gray-100">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Validando con IA</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-lg transition-colors hover:border-blue-400">
                      <div className="space-y-1 text-center">
                        <div className="flex justify-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        </div>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="image"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                          >
                            <span>Sube una imagen</span>
                            <input
                              ref={fileInputRef}
                              id="image"
                              name="image"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">o arrástrala aquí</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP hasta 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {formData.image_url && (
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      id="change-image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {isUploading && (
                      <p className="mt-1 text-xs text-gray-500">Validando la imagen con IA...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Campos */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre del producto<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Camiseta de algodón"
                    required
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe el producto en detalle"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Precio<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {(isSubmitting || isUploading) && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isUploading ? 'Subiendo imagen...' : 'Guardando...'}
                    </div>
                  )}
                  {!isSubmitting && !isUploading && showSavedPulse && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      <span>¡Cambios guardados!</span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="min-w-[120px] justify-center"
                  >
                    {isUploading ? 'Subiendo...' : isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB FORM BUILDER */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-xl p-6 shadow space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Formulario del producto</h2>
              <p className="text-xs text-gray-500">
                Configura los campos que verá el cliente al hacer el pedido.
              </p>
            </div>

            <div className="flex items-center gap-3 relative flex-wrap justify-end">
              {showDraftPrompt && hasDraftLS && (
                <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-2 py-1 mr-2 flex items-center gap-2">
                  <span>Encontramos un borrador</span>
                  <Button variant="outline" onClick={continueDraft} size="sm">
                    Continuar
                  </Button>
                  <Button variant="outline" onClick={discardDraftPrompt} size="sm">
                    Descartar
                  </Button>
                </div>
              )}

              {/* Selector de tipo de campo + botón agregar */}
                <div className="flex items-center gap-3">
                  <AddFieldDropdown
                    disabled={formForbidden}
                    onSelect={(type) => {
                      handleAddField(type);
                    }}
                  />
                </div>

            </div>

            
          </div>

          {isBuilderLoading ? (
              <div className="mt-4 space-y-4">
                {/* Tarjeta que imita el cambo del formulario */}
                <div className="border rounded-lg bg-gray-50 p-4 space-y-4">
                  {/* Fila superior: "Orden: 1 · Selector" + botones ↑ ↓ Eliminar */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <Skeleton variant="text" width={120} height={14} />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ↑ */}
                      <Skeleton variant="rounded" width={32} height={32} />
                      {/* ↓ */}
                      <Skeleton variant="rounded" width={32} height={32} />
                      {/* Eliminar */}
                      <Skeleton variant="rounded" width={90} height={36} />
                    </div>
                  </div>

                  {/* Fila de Título + checkbox Requerido + tipo (select) */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
                    {/* Título (input largo) */}
                    <div>
                      <div className="text-sm text-gray-700 mb-1">
                        <Skeleton variant="text" width={60} height={14} />
                      </div>
                      <Skeleton variant="rounded" width="100%" height={40} />
                    </div>

                    <div className="flex items-center gap-2">
                      <Skeleton variant="circular" width={16} height={16} />
                      <Skeleton variant="text" width={70} height={14} />
                    </div>

                  </div>

                  {/* Botón "Editar valores" */}
                  <div>
                    <Skeleton variant="rounded" width={130} height={36} />
                  </div>
                </div>

                <p className="text-xs text-gray-500">Cargando formulario del producto...</p>
              </div>
            ) :formForbidden ? (
            <div className="p-4 rounded bg-red-50 text-red-700 text-sm">
              No tienes permisos para modificar el formulario de este producto. Verifica tu sesión y permisos.
            </div>
          ) : (
            (() => {
              const opts = draftOpts as ProductOption[];
              const forms = draftForms as ProductCustomForm[];
              const items = [
                ...opts.map((o) => ({
                  kind: 'option' as const,
                  id: o.id,
                  order: o.display_order,
                  data: o,
                })),
                ...forms.map((f) => ({
                  kind: 'form' as const,
                  id: f.id,
                  order: f.display_order,
                  data: f,
                })),
              ].sort((a, b) => a.order - b.order);

              const move = (index: number, dir: -1 | 1) => {
                const itemsCopy = [...items];
                const target = itemsCopy[index];
                const swapWith = itemsCopy[index + dir];
                if (!swapWith) return;

                // 1. Intercambiamos posiciones en el array visual
                itemsCopy[index] = swapWith;
                itemsCopy[index + dir] = target;

                // 2. Creamos copias mutables de options y forms
                const newOpts = draftOpts.map(o => ({ ...o }));
                const newForms = draftForms.map(f => ({ ...f }));

                // 3. Reasignamos display_order según la nueva posición
                itemsCopy.forEach((it, pos) => {
                  const newOrder = pos + 1; // 1,2,3,...

                  if (it.kind === 'option') {
                    const idx = newOpts.findIndex(o => o.id === it.id);
                    if (idx !== -1) {
                      newOpts[idx].display_order = newOrder;
                    }
                  } else {
                    const idx = newForms.findIndex(f => f.id === it.id);
                    if (idx !== -1) {
                      newForms[idx].display_order = newOrder;
                    }
                  }
                });

                setDraftOpts(newOpts);
                setDraftForms(newForms);
                setHasInteracted(true);
              };

              const moveValue = (optionId: number, index: number, dir: -1 | 1) => {
                setDraftValues(prev => {
                  const current = prev[optionId] || [];
                  const swapIndex = index + dir;

                  if (swapIndex < 0 || swapIndex >= current.length) return prev;

                  const newList = [...current];

                  // 1) intercambiar posiciones visuales
                  const temp = newList[index];
                  newList[index] = newList[swapIndex];
                  newList[swapIndex] = temp;

                  // 2) normalizar display_order según la nueva posición
                  const normalized = newList.map((item, i) => ({
                    ...item,
                    display_order: i + 1,
                  }));

                  return {
                    ...prev,
                    [optionId]: normalized,
                  };
                });

                setHasInteracted(true);
              };




                

              return (
                <div className="space-y-3">
                  {items.length === 0 && (
                    <div className="text-sm text-gray-500">
                      Aún no hay campos. Agrega uno arriba.
                    </div>
                  )}

                  {builderErrors.length > 0 && (
                    <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 text-xs text-amber-800 space-y-1">
                      <div className="font-semibold">Revisa estos puntos antes de guardar:</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {builderErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {items.map((it, idx) => (
                    <div
                      key={`${it.kind}-${it.id}`}
                      className="border rounded p-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Orden: {it.order} · {getItemLabel(it)}
                        </div>


                        <div className="flex gap-2">
                          {/* mover campo arriba/abajo */}
                          <Button
                            variant="outline"
                            onClick={() => move(idx, -1)}
                            disabled={idx === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => move(idx, 1)}
                            disabled={idx === items.length - 1}
                          >
                            ↓
                          </Button>

                          {/* eliminar campo */}
                          {it.kind === 'option' ? (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const id = (it.data as ProductOption).id as number;
                                setDraftOpts(prev => prev.filter(o => o.id !== id));
                                setDraftValues(prev => {
                                  const copy = { ...prev } as any;
                                  delete copy[id];
                                  return copy;
                                });
                                if (id > 0) {
                                  setDeletedOptionIds(prev =>
                                    Array.from(new Set([...prev, id]))
                                  );
                                }
                                setHasInteracted(true);
                              }}
                            >
                              Eliminar
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              onClick={() => {
                                const id = (it.data as ProductCustomForm).id as number;
                                setDraftForms(prev => prev.filter(f => f.id !== id));
                                if (id > 0) {
                                  setDeletedFormIds(prev =>
                                    Array.from(new Set([...prev, id]))
                                  );
                                }
                                setHasInteracted(true);
                              }}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>


                      {it.kind === 'option' ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_auto] gap-3 items-end">
                            <div>
                              <label className="text-sm text-gray-700">Título</label>
                              <Input
                                defaultValue={(it.data as ProductOption).name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftOpts((prev) =>
                                    prev.map((o) =>
                                      o.id === (it.data as ProductOption).id ? { ...o, name: val } : o
                                    )
                                  );
                                  setHasInteracted(true);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                defaultChecked={(it.data as ProductOption).required}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setDraftOpts((prev) =>
                                    prev.map((o) =>
                                      o.id === (it.data as ProductOption).id ? { ...o, required: val } : o
                                    )
                                  );
                                  setHasInteracted(true);
                                }}
                              />
                              <span className="text-sm">Requerido</span>
                            </div>
                          </div>


                          {(it.data as ProductOption).type === 'multiselect' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-gray-700">Mín. selección</label>
                                <Input
                                  type="number"
                                  defaultValue={(it.data as ProductOption).min_select ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setDraftOpts((prev) =>
                                      prev.map((o) =>
                                        o.id === (it.data as ProductOption).id
                                          ? { ...o, min_select: val }
                                          : o
                                      )
                                    );
                                    setHasInteracted(true);
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Máx. selección</label>
                                <Input
                                  type="number"
                                  defaultValue={(it.data as ProductOption).max_select ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setDraftOpts((prev) =>
                                      prev.map((o) =>
                                        o.id === (it.data as ProductOption).id
                                          ? { ...o, max_select: val }
                                          : o
                                      )
                                    );
                                    setHasInteracted(true);
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <Button
                              variant="outline"
                              onClick={() =>
                                setExpandedOptionId(
                                  expandedOptionId === it.id ? null : it.id
                                )
                              }
                            >
                              {expandedOptionId === it.id
                                ? 'Ocultar valores'
                                : 'Editar valores'}
                            </Button>
                          </div>

                          {expandedOptionId === it.id && (
                            <div className="mt-3 space-y-3">
                              {/* Header de valores */}
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Valores</span>
                                <Button
                                  onClick={() => {
                                    const vals = draftValues[it.id] || [];
                                    const lastOrder = vals.length ? vals[vals.length - 1].display_order : 0;
                                    const tempId = -Date.now();
                                    const payload = {
                                      value: 'Nuevo valor',
                                      price_modifier: 0,
                                      image_url: '',
                                      sku_suffix: '',
                                      display_order: lastOrder + 1,
                                    } as Omit<ProductOptionValue, 'id' | 'product_option_id'>;

                                    setDraftValues(prev => ({
                                      ...prev,
                                      [it.id]: [
                                        ...(prev[it.id] || []),
                                        { id: tempId, product_option_id: it.id, ...payload } as any,
                                      ],
                                    }));
                                    setHasInteracted(true);
                                  }}
                                >
                                  Agregar valor
                                </Button>
                              </div>

                              {/* Lista de valores */}
                              <div className="space-y-2">
                                {(draftValues[it.id] || []).map((v, vi) => (
                                  <div
                                    key={v.id}
                                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2 items-center"
                                  >
                                    {/* Input del valor */}
                                    <Input
                                      defaultValue={v.value}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setDraftValues(prev => ({
                                          ...prev,
                                          [it.id]: (prev[it.id] || []).map(x =>
                                            x.id === v.id ? { ...x, value: val } : x
                                          ),
                                        }));
                                        setHasInteracted(true);
                                      }}
                                    />

                                    {/* Botones de acciones */}
                                    <div className="flex gap-2 justify-end">
                                      {/* Subir */}
                                      <Button
                                        variant="outline"
                                        onClick={() => moveValue(it.id as number, vi, -1)}
                                        disabled={vi === 0}
                                      >
                                        ↑
                                      </Button>

                                      {/* Bajar */}
                                      <Button
                                        variant="outline"
                                        onClick={() => moveValue(it.id as number, vi, 1)}
                                        disabled={vi === (draftValues[it.id]?.length || 0) - 1}
                                      >
                                        ↓
                                      </Button>

                                      {/* Eliminar */}
                                      <Button
                                        variant="destructive"
                                        onClick={() => {
                                          setDraftValues(prev => ({
                                            ...prev,
                                            [it.id]: (prev[it.id] || []).filter(x => x.id !== v.id),
                                          }));

                                          if ((v.id as number) > 0) {
                                            setDeletedValueIds(prev =>
                                              Array.from(new Set([...prev, v.id as number]))
                                            );
                                          }

                                          setHasInteracted(true);
                                        }}
                                      >
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                ))}

                                {expandedOptionId === it.id &&
                                  (valuesQuery.isLoading && (draftValues[it.id]?.length ?? 0) === 0) && (
                                    <div className="text-sm text-gray-500">Cargando valores...</div>
                                  )}

                                {(draftValues[it.id]?.length || 0) === 0 && !valuesQuery.isLoading && (
                                  <div className="text-sm text-gray-500">No hay valores</div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_auto] gap-3 items-end">
                            <div>
                              <label className="text-sm text-gray-700">Título</label>
                              <Input
                                defaultValue={(it.data as ProductCustomForm).label}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setDraftForms((prev) =>
                                    prev.map((f) =>
                                      f.id === (it.data as ProductCustomForm).id ? { ...f, label: val } : f
                                    )
                                  );
                                  setHasInteracted(true);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                defaultChecked={(it.data as ProductCustomForm).required}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setDraftForms((prev) =>
                                    prev.map((f) =>
                                      f.id === (it.data as ProductCustomForm).id ? { ...f, required: val } : f
                                    )
                                  );
                                  setHasInteracted(true);
                                }}
                              />
                              <span className="text-sm">Requerido</span>
                            </div>
                          </div>


                          {['text', 'textarea', 'number'].includes(
                            (it.data as ProductCustomForm).input_type
                          ) && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-gray-700">
                                  Máx. caracteres
                                </label>
                                <Input
                                  type="number"
                                  defaultValue={
                                    (it.data as ProductCustomForm).max_length ?? ''
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const val =
                                      raw === '' ? null : Number(raw || '0');
                                    setDraftForms((prev) =>
                                      prev.map((f) =>
                                        f.id === (it.data as ProductCustomForm).id
                                          ? { ...f, max_length: val as any }
                                          : f
                                      )
                                    );
                                    setHasInteracted(true);
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">
                                  Texto de ayuda
                                </label>
                                <Input
                                  defaultValue={
                                    (it.data as ProductCustomForm).help_text || ''
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftForms((prev) =>
                                      prev.map((f) =>
                                        f.id === (it.data as ProductCustomForm).id
                                          ? { ...f, help_text: val }
                                          : f
                                      )
                                    );
                                    setHasInteracted(true);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })() as ReactNode
          )}

          {/* Footer de acciones del builder */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-100 mt-6">
            <div className="flex items-center gap-3 relative">
              {isSavingBuilder && (
                <div className="flex items-center text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  <span>Guardando formulario...</span>
                </div>
              )}

              {!isSavingBuilder && showBuilderSavedPulse && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span>Formulario guardado</span>
                </div>
              )}

              <Button
                onClick={async () => {
                  if (!validateBuilder()) {
                    toast({
                      title: 'Revisa el formulario',
                      description: 'Corrige los errores antes de guardar.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  try {
                    setIsSavingBuilder(true);
                    setShowBuilderSavedPulse(false);

                    const optionsUpserts = draftOpts.map(o => {
                      const isMulti = o.type === 'multiselect';

                      let minSel = o.min_select ?? null;
                      let maxSel = o.max_select ?? null;

                      if (isMulti) {
                        if (maxSel == null || maxSel <= 1) maxSel = 2;
                        if (minSel != null && minSel > maxSel) minSel = maxSel;
                      } else {
                        maxSel = 1;
                        if (minSel == null) minSel = 1;
                        if (minSel > 1) minSel = 1;
                      }

                      const base: any = {
                        name: o.name,
                        required: !!o.required,
                        display_order: o.display_order,
                        min_select: minSel,
                        max_select: maxSel,
                      };

                      if (o.id > 0) base.id = o.id;
                      else base.tempId = o.id;

                      return base;
                    });

                    const valuesUpserts: any[] = [];
                    Object.keys(draftValues).forEach((k) => {
                      const optionIdNum = Number(k);
                      (draftValues[optionIdNum] || []).forEach((v) => {
                        const base: any = {
                          optionId: optionIdNum,
                          value: v.value,
                          price_modifier: v.price_modifier ?? 0,
                          image_url: v.image_url ?? null,
                          sku_suffix: v.sku_suffix ?? null,
                          display_order: v.display_order,
                        };
                        if ((v.id as number) > 0) base.id = v.id;
                        else base.tempId = v.id;
                        valuesUpserts.push(base);
                      });
                    });

                    const formsUpserts = draftForms.map((f) => {
                      const base: any = {
                        label: f.label,
                        input_type: f.input_type,
                        required: !!f.required,
                        max_length: f.max_length ?? null,
                        help_text: f.help_text ?? null,
                        display_order: f.display_order,
                      };
                      if (f.id > 0) base.id = f.id;
                      else base.tempId = f.id;
                      return base;
                    });

                    const payload = {
                      options: { upserts: optionsUpserts, deletes: deletedOptionIds },
                      values: { upserts: valuesUpserts, deletes: deletedValueIds },
                      custom_forms: { upserts: formsUpserts, deletes: deletedFormIds },
                    };

                    const res = await updateProductBuilder(pid, payload);

                    const newOpts = (res.options || draftOpts).map((o: any) => ({ ...o }));
                    const newForms = (res.custom_forms || draftForms).map((f: any) => ({ ...f }));
                    const newVals: Record<number, ProductOptionValue[]> = {} as any;
                    Object.keys(res.values || {}).forEach((k: any) => {
                      const key = Number(k);
                      newVals[key] = (res.values[key] || []).map((v: any) => ({ ...v }));
                    });

                    setDraftOpts(newOpts);
                    setDraftForms(newForms);
                    setDraftValues(newVals);

                    setInitialSnapshot({
                      options: newOpts,
                      custom_forms: newForms,
                      values: newVals,
                    });
                    setBaselineSnapshot({
                      options: newOpts.map((o: ProductOption) => ({ ...o })),
                      custom_forms: newForms.map((f: ProductCustomForm) => ({ ...f })),
                      values: newVals,
                    });
                    setBaselineKind('server');

                    setDeletedOptionIds([]);
                    setDeletedValueIds([]);
                    setDeletedFormIds([]);
                    localStorage.removeItem(draftKey);
                    setHasDraftLS(false);
                    setHasInteracted(false);
                    setBuilderErrors([]);

                    toast({
                      title: 'Formulario actualizado',
                      description: 'Cambios aplicados.',
                    });

                    setShowBuilderSavedPulse(true);
                    setTimeout(() => setShowBuilderSavedPulse(false), 2000);
                  } catch {
                    toast({
                      title: 'Error al guardar',
                      description: 'No se pudieron aplicar algunos cambios.',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsSavingBuilder(false);
                  }
                }}
                disabled={formForbidden || isSavingBuilder}
                className="min-w-[120px] justify-center"
              >
                {isSavingBuilder ? 'Guardando...' : 'Guardar'}
              </Button>


              {(draftOpts.length + draftForms.length) > 0 && (hasInteracted || hasDraftLS) && (
                <Button
                  variant="outline"
                  onClick={() => setShowSaveMenu((v) => !v)}
                  aria-label="Más acciones"
                  disabled={formForbidden}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}

              {(draftOpts.length + draftForms.length) > 0 &&
                (hasInteracted || hasDraftLS) &&
                showSaveMenu && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                    <div className="py-1 text-sm">
                      {hasInteracted && (draftOpts.length + draftForms.length) > 0 && (
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => {
                            const payload = {
                              options: draftOpts,
                              values: draftValues,
                              custom_forms: draftForms,
                              deletedOptionIds,
                              deletedValueIds,
                              deletedFormIds,
                            };
                            localStorage.setItem(draftKey, JSON.stringify(payload));
                            toast({ title: 'Borrador guardado' });
                            setHasDraftLS(true);
                            setBaselineSnapshot({
                              options: draftOpts.map((o) => ({ ...o })),
                              custom_forms: draftForms.map((f) => ({ ...f })),
                              values: draftValues,
                            });
                            setBaselineKind('draft');
                            setHasInteracted(false);
                            setShowSaveMenu(false);
                          }}
                        >
                          Guardar borrador
                        </button>
                      )}
                      {hasDraftLS && !(baselineKind === 'draft' && hasInteracted) && (
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => {
                            discardDraftPrompt();
                            setShowSaveMenu(false);
                          }}
                        >
                          Descartar borrador
                        </button>
                      )}
                      {hasInteracted && (draftOpts.length + draftForms.length) > 0 && (
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => {
                            if (!baselineSnapshot) {
                              setShowSaveMenu(false);
                              return;
                            }
                            setDraftOpts(baselineSnapshot.options.map((o) => ({ ...o })));
                            setDraftForms(
                              baselineSnapshot.custom_forms.map((f) => ({ ...f }))
                            );
                            const vals: Record<number, ProductOptionValue[]> = {};
                            Object.keys(baselineSnapshot.values || {}).forEach((k) => {
                              const key = Number(k);
                              vals[key] = (baselineSnapshot.values[key] || []).map(
                                (v: ProductOptionValue) => ({ ...v })
                              );
                            });
                            setDraftValues(vals);
                            setDeletedOptionIds([]);
                            setDeletedValueIds([]);
                            setDeletedFormIds([]);
                            setHasInteracted(false);
                            setBuilderErrors([]);
                            toast({ title: 'Cambios descartados' });
                            setShowSaveMenu(false);
                          }}
                        >
                          Descartar cambios
                        </button>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
