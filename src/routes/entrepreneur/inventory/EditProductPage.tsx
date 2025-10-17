import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProduct, updateProduct, uploadProductImage, type Product } from '../../../services/productService';
// Removed configurable options/custom forms imports
import { Button } from '../../../components/Button';
import Input from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import {
  getProductOptions,
  createProductOption,
  updateProductOption,
  deleteProductOption,
  getOptionValues,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
  getCustomForms,
  createCustomForm,
  updateCustomForm,
  deleteCustomForm,
  type ProductOption,
  type ProductOptionValue,
  type ProductCustomForm,
} from '../../../services/productConfigService';

export default function EditProductPage() {
  const { productId, businessId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const pid = Number(productId);
  const stateProduct = (location.state as any)?.product as Product | undefined;

  const [activeTab, setActiveTab] = useState<'general'|'form'>('general');
  // Removed options/custom states
  const [showSavedPulse, setShowSavedPulse] = useState(false);
  const [formForbidden, setFormForbidden] = useState(false);

  // Queries
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

  // Handle query errors (TanStack Query v5 removed onError from useQuery options)
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

  // ===== Draft state + batching (builder) =====
  type Op =
    | { t: 'createOpt'; tempId: number; payload: Omit<ProductOption,'id'|'product_id'> }
    | { t: 'updateOpt'; id: number; changes: Partial<Omit<ProductOption,'id'|'product_id'>> }
    | { t: 'deleteOpt'; id: number }
    | { t: 'createVal'; tempId: number; optionId: number; payload: Omit<ProductOptionValue,'id'|'product_option_id'> }
    | { t: 'updateVal'; id: number; optionId: number; changes: Partial<Omit<ProductOptionValue,'id'|'product_option_id'>> }
    | { t: 'deleteVal'; id: number; optionId: number }
    | { t: 'createForm'; tempId: number; payload: Omit<ProductCustomForm,'id'|'product_id'> }
    | { t: 'updateForm'; id: number; changes: Partial<Omit<ProductCustomForm,'id'|'product_id'>> }
    | { t: 'deleteForm'; id: number };

  const [draftOpts, setDraftOpts] = useState<ProductOption[]>([]);
  const [draftForms, setDraftForms] = useState<ProductCustomForm[]>([]);
  const [draftValues, setDraftValues] = useState<Record<number, ProductOptionValue[]>>({});
  const [opQueue, setOpQueue] = useState<Op[]>([]);
  const [countdownMs, setCountdownMs] = useState<number>(0);
  const [isFlushing, setIsFlushing] = useState(false);

  // Sync drafts when server data changes or tab enters
  useEffect(() => {
    if (activeTab !== 'form' || formForbidden) return;
    const opts = ((optionsQuery.data as ProductOption[]) || []).map((o: ProductOption) => ({ ...o }));
    const forms = ((formsQuery.data as ProductCustomForm[]) || []).map((f: ProductCustomForm) => ({ ...f }));
    setDraftOpts(opts);
    setDraftForms(forms);
    setDraftValues(prev => {
      const next: Record<number, ProductOptionValue[]> = { ...prev };
      // keep existing loaded values; they'll be lazy-loaded per option expand
      return next;
    });
    // don't wipe opQueue here to allow pending changes if user toggles
  }, [activeTab, formForbidden, optionsQuery.data, formsQuery.data]);

  // Load values into draft when expanded and query returns
  useEffect(() => {
    if (expandedOptionId && valuesQuery.data) {
      const vals = (valuesQuery.data as ProductOptionValue[]);
      setDraftValues(prev => ({ ...prev, [expandedOptionId]: vals.map((v: ProductOptionValue) => ({ ...v })) }));
    }
  }, [expandedOptionId, valuesQuery.data]);

  // countdown ticker
  useEffect(() => {
    if (countdownMs <= 0) return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setCountdownMs(prev => (prev - elapsed <= 0 ? 0 : prev - elapsed));
    }, 150);
    return () => clearInterval(interval);
  }, [countdownMs]);

  const resetCountdown = () => setCountdownMs(2000);

  // enqueue helper (merge updates by id)
  const enqueue = (op: Op) => {
    setOpQueue(prev => {
      const next = [...prev];
      // merge logic for updates
      if (op.t === 'updateOpt') {
        const i = next.findIndex(o => o.t === 'updateOpt' && o.id === op.id);
        if (i >= 0) {
          (next[i] as any).changes = { ...(next[i] as any).changes, ...op.changes };
          return next;
        }
      }
      if (op.t === 'updateForm') {
        const i = next.findIndex(o => o.t === 'updateForm' && o.id === op.id);
        if (i >= 0) {
          (next[i] as any).changes = { ...(next[i] as any).changes, ...op.changes };
          return next;
        }
      }
      if (op.t === 'updateVal') {
        const i = next.findIndex(o => o.t === 'updateVal' && (o as any).id === op.id);
        if (i >= 0) {
          (next[i] as any).changes = { ...(next[i] as any).changes, ...op.changes };
          return next;
        }
      }
      // remove conflicting ops (e.g., delete cancels prior update/create)
      if (op.t === 'deleteOpt') {
        // drop any prior create/update for same id/tempId
        return next.filter(o => !(
          (o.t === 'updateOpt' && (o as any).id === op.id) ||
          (o.t === 'createOpt' && (o as any).tempId === op.id) ||
          (o.t === 'createVal' && (o as any).optionId === op.id) ||
          (o.t === 'updateVal' && (o as any).optionId === op.id) ||
          (o.t === 'deleteVal' && (o as any).optionId === op.id)
        ));
      }
      if (op.t === 'deleteForm') {
        return next.filter(o => !(
          (o.t === 'updateForm' && (o as any).id === op.id) ||
          (o.t === 'createForm' && (o as any).tempId === op.id)
        ));
      }
      if (op.t === 'deleteVal') {
        // if value was just created (temp id), drop its create
        return next.filter(o => !(
          (o.t === 'updateVal' && (o as any).id === (op as any).id) ||
          (o.t === 'createVal' && (o as any).tempId === (op as any).id)
        ));
      }
      next.push(op);
      return next;
    });
    resetCountdown();
  };

  // Flush ops when countdown hits 0
  useEffect(() => {
    if (countdownMs > 0 || opQueue.length === 0 || isFlushing) return;
    const run = async () => {
      setIsFlushing(true);
      try {
        // Map temp IDs -> real IDs
        const optIdMap = new Map<number, number>();
        const formIdMap = new Map<number, number>();
        const valIdMap = new Map<number, number>();

        // 1) Creates: options, forms
        for (const op of opQueue) {
          if (op.t === 'createOpt') {
            const created = await createProductOption(pid, op.payload);
            optIdMap.set(op.tempId, created.id);
          }
          if (op.t === 'createForm') {
            const created = await createCustomForm(pid, op.payload);
            formIdMap.set(op.tempId, created.id);
          }
        }

        // 2) Creates: values (resolve optionId if temp) and map temp value IDs
        for (const op of opQueue) {
          if (op.t === 'createVal') {
            const realOptionId = optIdMap.get(op.optionId) ?? op.optionId;
            const created = await createOptionValue(pid, realOptionId, op.payload);
            // Map temp value id -> real created id
            valIdMap.set(op.tempId, created.id as number);
          }
        }

        // 3) Updates: options, forms, values (resolve IDs)
        for (const op of opQueue) {
          if (op.t === 'updateOpt') {
            const realId = optIdMap.get(op.id) ?? op.id;
            await updateProductOption(pid, realId, op.changes);
          }
          if (op.t === 'updateForm') {
            const realId = formIdMap.get(op.id) ?? op.id;
            await updateCustomForm(pid, realId, op.changes);
          }
          if (op.t === 'updateVal') {
            const realOptionId = optIdMap.get((op as any).optionId) ?? (op as any).optionId;
            const realValueId = op.id < 0 ? (valIdMap.get(op.id) as number | undefined) : op.id;
            if (realValueId != null) {
              await updateOptionValue(pid, realOptionId, realValueId, (op as any).changes);
            }
          }
        }

        // 4) Deletes: values then options/forms
        for (const op of opQueue) {
          if (op.t === 'deleteVal') {
            const realOptionId = optIdMap.get((op as any).optionId) ?? (op as any).optionId;
            const realValueId = op.id < 0 ? (valIdMap.get(op.id) as number | undefined) : op.id;
            // If value never got created (temp and no mapping), skip API delete
            if (realValueId != null) {
              await deleteOptionValue(pid, realOptionId, realValueId);
            }
          }
        }
        for (const op of opQueue) {
          if (op.t === 'deleteOpt') {
            const realId = optIdMap.get(op.id) ?? op.id;
            await deleteProductOption(pid, realId);
          }
          if (op.t === 'deleteForm') {
            const realId = formIdMap.get(op.id) ?? op.id;
            await deleteCustomForm(pid, realId);
          }
        }

        // refresh
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['product-options', pid] }),
          queryClient.invalidateQueries({ queryKey: ['product-custom-forms', pid] }),
          expandedOptionId ? queryClient.invalidateQueries({ queryKey: ['product-option-values', pid, expandedOptionId] }) : Promise.resolve(),
        ]);

        setOpQueue([]);
        toast({ title: 'Formulario actualizado', description: 'Cambios aplicados.' });
      } catch (e) {
        toast({ title: 'Error al guardar', description: 'No se pudieron aplicar algunos cambios.', variant: 'destructive' });
      } finally {
        setIsFlushing(false);
      }
    };
    run();
  }, [countdownMs, opQueue, isFlushing, pid, expandedOptionId, queryClient, toast]);

  // Mutations
  const updateProductMut = useMutation({
    mutationFn: (data: Partial<Product>) => updateProduct(pid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', pid] });
      toast({ title: 'Producto actualizado', description: 'Se guardaron los cambios.' });
      setShowSavedPulse(true);
      setTimeout(() => setShowSavedPulse(false), 1500);
    },
  });

  const createOptMut = useMutation({
    mutationFn: (payload: Omit<ProductOption,'id'|'product_id'>) => createProductOption(pid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options', pid] });
      toast({ title: 'Pregunta creada' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        setFormForbidden(true);
        toast({ title: 'Sin permisos', description: 'No puedes modificar el formulario de este producto.', variant: 'destructive' });
      }
    },
  });

  const updateOptMut = useMutation({
    mutationFn: ({ optionId, payload }: { optionId: number; payload: Partial<Omit<ProductOption,'id'|'product_id'>> }) => updateProductOption(pid, optionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options', pid] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const deleteOptMut = useMutation({
    mutationFn: (optionId: number) => deleteProductOption(pid, optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options', pid] });
      toast({ title: 'Pregunta eliminada' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const createValMut = useMutation({
    mutationFn: ({ optionId, payload }: { optionId: number; payload: Omit<ProductOptionValue,'id'|'product_option_id'> }) => createOptionValue(pid, optionId, payload),
    onSuccess: () => {
      if (expandedOptionId) queryClient.invalidateQueries({ queryKey: ['product-option-values', pid, expandedOptionId] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const updateValMut = useMutation({
    mutationFn: ({ optionId, valueId, payload }: { optionId: number; valueId: number; payload: Partial<Omit<ProductOptionValue,'id'|'product_option_id'>> }) => updateOptionValue(pid, optionId, valueId, payload),
    onSuccess: () => {
      if (expandedOptionId) queryClient.invalidateQueries({ queryKey: ['product-option-values', pid, expandedOptionId] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const deleteValMut = useMutation({
    mutationFn: ({ optionId, valueId }: { optionId: number; valueId: number }) => deleteOptionValue(pid, optionId, valueId),
    onSuccess: () => {
      if (expandedOptionId) queryClient.invalidateQueries({ queryKey: ['product-option-values', pid, expandedOptionId] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const createFormMut = useMutation({
    mutationFn: (payload: Omit<ProductCustomForm,'id'|'product_id'>) => createCustomForm(pid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-forms', pid] });
      toast({ title: 'Pregunta creada' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) {
        setFormForbidden(true);
        toast({ title: 'Sin permisos', description: 'No puedes modificar el formulario de este producto.', variant: 'destructive' });
      }
    },
  });

  const updateFormMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<ProductCustomForm,'id'|'product_id'>> }) => updateCustomForm(pid, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-forms', pid] });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const deleteFormMut = useMutation({
    mutationFn: (id: number) => deleteCustomForm(pid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-custom-forms', pid] });
      toast({ title: 'Pregunta eliminada' });
    },
    onError: (err: any) => {
      if (err?.response?.status === 403) setFormForbidden(true);
    },
  });

  const product = stateProduct || productQuery.data;

  // Local form state (replicating previous modal form behavior)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<{ name: string; description: string; price: string; image_url: string; imageFile?: File | null; entrepreneurship_id: number }>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    imageFile: null,
    entrepreneurship_id: businessId ? Number(businessId) : 0,
  });

  // Sync form data when product loads
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato no válido', description: 'Sube una imagen válida', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'La imagen no debe superar los 5MB', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image_url: previewUrl, imageFile: file }));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: '', imageFile: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({ title: 'Campos requeridos', description: 'Completa nombre y precio', variant: 'destructive' });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload: Partial<Product> = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        entrepreneurship_id: formData.entrepreneurship_id,
      } as Partial<Product>;
      if (formData.imageFile) {
        const result = await uploadProductImage(formData.imageFile);
        // uploadProductImage returns { url }
        // Ensure we set image_url string
        // @ts-ignore
        payload.image_url = (result?.url as string) || formData.image_url;
      } else if (formData.image_url) {
        payload.image_url = formData.image_url as any;
      }
      await updateProductMut.mutateAsync(payload);
    } catch (err) {
      // error toast handled by mutation onError implicitly by default console, add toast here
      toast({ title: 'Error', description: 'No se pudo guardar el producto', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed options required check

  useEffect(() => {
    if (productQuery.isError) {
      toast({ title: 'Error', description: 'No se pudo cargar el producto', variant: 'destructive' });
    }
  }, [productQuery.isError, navigate, toast]);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-4">
        {(
          [
            { key: 'general', label: 'Datos generales' },
            { key: 'form', label: 'Formulario del producto' },
          ] as const
        ).map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`py-2 px-4 -mb-px border-b-2 ${activeTab === t.key ? 'border-brand text-brandDark' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="font-semibold mb-4">Información básica</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="image" className="text-sm text-gray-700">Imagen del producto</label>
                <div className="mt-2">
                  {formData.image_url ? (
                    <div className="relative inline-block">
                      <img src={formData.image_url} alt="Preview" className="h-40 w-full object-cover rounded-lg" />
                      <button type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5" onClick={removeImage}>×</button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-4 text-center text-sm text-gray-600">
                      <p>Sube una imagen o arrástrala aquí</p>
                    </div>
                  )}
                  <input ref={fileInputRef} id="image" type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-700" htmlFor="name">Nombre</label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="text-sm text-gray-700" htmlFor="description">Descripción</label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
              </div>
              <div>
                <label className="text-sm text-gray-700" htmlFor="price">Precio</label>
                <Input id="price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {(isSubmitting || isUploading) && (
                  <span className="inline-flex items-center text-blue-600 mr-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                )}
                {!isSubmitting && !isUploading && showSavedPulse && (
                  <span className="inline-flex items-center text-green-600 mr-2">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <Button type="submit" disabled={isSubmitting || isUploading}>{isUploading ? 'Subiendo...' : isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'form' && (
        <div className="bg-white rounded-xl p-6 shadow space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Formulario del producto</h2>
            <div className="flex items-center gap-3">
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now();
                const payload = { name: 'Nuevo selector', type: 'select' as const, required: false, display_order: lastOrder + 1 };
                setDraftOpts(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createOpt', tempId, payload });
              }}>+ Selector</Button>
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now()-1;
                const payload = { name: 'Nuevo multiselector', type: 'multiselect' as const, required: false, display_order: lastOrder + 1, min_select: 0, max_select: 0 } as any;
                setDraftOpts(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createOpt', tempId, payload });
              }}>+ Multiselector</Button>
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now()-2;
                const payload = { label: 'Texto corto', input_type: 'text' as const, required: false, max_length: null, help_text: '', display_order: lastOrder + 1 };
                setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createForm', tempId, payload });
              }}>+ Texto corto</Button>
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now()-3;
                const payload = { label: 'Texto amplio', input_type: 'textarea' as const, required: false, max_length: null, help_text: '', display_order: lastOrder + 1 };
                setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createForm', tempId, payload });
              }}>+ Texto amplio</Button>
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now()-4;
                const payload = { label: 'Número', input_type: 'number' as const, required: false, max_length: null, help_text: '', display_order: lastOrder + 1 };
                setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createForm', tempId, payload });
              }}>+ Número</Button>
              <Button disabled={formForbidden} onClick={() => {
                const lastOrder = [...draftOpts, ...draftForms].reduce((m, i: any) => Math.max(m, i.display_order || 0), 0);
                const tempId = -Date.now()-5;
                const payload = { label: 'Interruptor', input_type: 'boolean' as const, required: false, max_length: null, help_text: '', display_order: lastOrder + 1 };
                setDraftForms(prev => [...prev, { id: tempId, product_id: pid, ...payload } as any]);
                enqueue({ t: 'createForm', tempId, payload });
              }}>+ Interruptor</Button>
            </div>
          </div>

          {formForbidden ? (
            <div className="p-4 rounded bg-red-50 text-red-700 text-sm">
              No tienes permisos para modificar el formulario de este producto. Verifica tu sesión y permisos.
            </div>
          ) : (() => {
            const opts = draftOpts as ProductOption[];
            const forms = draftForms as ProductCustomForm[];
            const items = [
              ...opts.map(o => ({ kind: 'option' as const, id: o.id, order: o.display_order, data: o })),
              ...forms.map(f => ({ kind: 'form' as const, id: f.id, order: f.display_order, data: f })),
            ].sort((a, b) => a.order - b.order);

            const move = async (index: number, dir: -1 | 1) => {
              const target = items[index];
              const swapWith = items[index + dir];
              if (!swapWith) return;
              const aOrder = target.order;
              const bOrder = swapWith.order;
              // update draft orders and enqueue updates
              if (target.kind === 'option') {
                setDraftOpts(prev => prev.map(o => o.id === (target.data as ProductOption).id ? { ...o, display_order: bOrder } : o));
                enqueue({ t: 'updateOpt', id: (target.data as ProductOption).id, changes: { display_order: bOrder } });
              } else {
                setDraftForms(prev => prev.map(f => f.id === (target.data as ProductCustomForm).id ? { ...f, display_order: bOrder } : f));
                enqueue({ t: 'updateForm', id: (target.data as ProductCustomForm).id, changes: { display_order: bOrder } });
              }
              if (swapWith.kind === 'option') {
                setDraftOpts(prev => prev.map(o => o.id === (swapWith.data as ProductOption).id ? { ...o, display_order: aOrder } : o));
                enqueue({ t: 'updateOpt', id: (swapWith.data as ProductOption).id, changes: { display_order: aOrder } });
              } else {
                setDraftForms(prev => prev.map(f => f.id === (swapWith.data as ProductCustomForm).id ? { ...f, display_order: aOrder } : f));
                enqueue({ t: 'updateForm', id: (swapWith.data as ProductCustomForm).id, changes: { display_order: aOrder } });
              }
            };

            const debounced = (_key: string, fn: () => void) => {
              fn();
            };

            return (
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={`${it.kind}-${it.id}`} className="border rounded p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Orden: {it.order}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
                        <Button variant="outline" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>↓</Button>
                        {it.kind === 'option' ? (
                          <Button variant="destructive" onClick={() => deleteOptMut.mutate((it.data as ProductOption).id)}>Eliminar</Button>
                        ) : (
                          <Button variant="destructive" onClick={() => deleteFormMut.mutate((it.data as ProductCustomForm).id)}>Eliminar</Button>
                        )}
                      </div>
                    </div>

                    {it.kind === 'option' ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="text-sm text-gray-700">Nombre</label>
                            <Input defaultValue={(it.data as ProductOption).name} onChange={(e) => {
                              const val = e.target.value;
                              setDraftOpts(prev => prev.map(o => o.id === (it.data as ProductOption).id ? { ...o, name: val } : o));
                              enqueue({ t: 'updateOpt', id: (it.data as ProductOption).id, changes: { name: val } });
                            }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked={(it.data as ProductOption).required} onChange={(e) => {
                              const val = e.target.checked;
                              setDraftOpts(prev => prev.map(o => o.id === (it.data as ProductOption).id ? { ...o, required: val } : o));
                              enqueue({ t: 'updateOpt', id: (it.data as ProductOption).id, changes: { required: val } });
                            }} />
                            <span className="text-sm">Requerido</span>
                          </div>
                          <div className="text-sm text-gray-600">{(it.data as ProductOption).type}</div>
                        </div>

                        {(it.data as ProductOption).type === 'multiselect' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-gray-700">Mín. selección</label>
                              <Input type="number" defaultValue={(it.data as ProductOption).min_select ?? 0} onChange={(e) => {
                                const val = Number(e.target.value);
                                setDraftOpts(prev => prev.map(o => o.id === (it.data as ProductOption).id ? { ...o, min_select: val } : o));
                                enqueue({ t: 'updateOpt', id: (it.data as ProductOption).id, changes: { min_select: val } });
                              }} />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Máx. selección</label>
                              <Input type="number" defaultValue={(it.data as ProductOption).max_select ?? 0} onChange={(e) => {
                                const val = Number(e.target.value);
                                setDraftOpts(prev => prev.map(o => o.id === (it.data as ProductOption).id ? { ...o, max_select: val } : o));
                                enqueue({ t: 'updateOpt', id: (it.data as ProductOption).id, changes: { max_select: val } });
                              }} />
                            </div>
                          </div>
                        )}

                        <div>
                          <Button variant="outline" onClick={() => setExpandedOptionId(expandedOptionId === it.id ? null : it.id)}>
                            {expandedOptionId === it.id ? 'Ocultar valores' : 'Editar valores'}
                          </Button>
                        </div>

                        {expandedOptionId === it.id && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">Valores</div>
                              <Button onClick={() => {
                                const vals = draftValues[it.id] || [];
                                const lastOrder = vals.length ? vals[vals.length - 1].display_order : 0;
                                const tempId = -Date.now();
                                const payload = { value: 'Nuevo', price_modifier: 0, image_url: '', sku_suffix: '', display_order: lastOrder + 1 } as Omit<ProductOptionValue,'id'|'product_option_id'>;
                                setDraftValues(prev => ({ ...prev, [it.id]: [...(prev[it.id] || []), { id: tempId, product_option_id: it.id, ...payload } as any] }));
                                enqueue({ t: 'createVal', tempId, optionId: it.id, payload });
                              }}>Agregar valor</Button>
                            </div>
                            <div className="space-y-2">
                              {(draftValues[it.id] || []).map((v, vi, arr) => (
                                <div key={v.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                  <Input defaultValue={v.value} onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftValues(prev => ({ ...prev, [it.id]: (prev[it.id] || []).map(x => x.id === v.id ? { ...x, value: val } : x) }));
                                    enqueue({ t: 'updateVal', id: v.id as number, optionId: it.id, changes: { value: val } });
                                  }} />
                                  <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => {
                                      const prevVal = arr[vi - 1];
                                      if (!prevVal) return;
                                      setDraftValues(p => {
                                        const list = [...(p[it.id] || [])];
                                        const aOrder = v.display_order;
                                        const bOrder = prevVal.display_order;
                                        list[vi] = { ...v, display_order: bOrder } as any;
                                        list[vi - 1] = { ...prevVal, display_order: aOrder } as any;
                                        return { ...p, [it.id]: list };
                                      });
                                      enqueue({ t: 'updateVal', id: v.id as number, optionId: it.id, changes: { display_order: (arr[vi - 1] as any).display_order } });
                                      enqueue({ t: 'updateVal', id: prevVal.id as number, optionId: it.id, changes: { display_order: (v as any).display_order } });
                                    }} disabled={vi === 0}>↑</Button>
                                    <Button variant="outline" onClick={() => {
                                      const nextVal = arr[vi + 1];
                                      if (!nextVal) return;
                                      setDraftValues(p => {
                                        const list = [...(p[it.id] || [])];
                                        const aOrder = v.display_order;
                                        const bOrder = nextVal.display_order;
                                        list[vi] = { ...v, display_order: bOrder } as any;
                                        list[vi + 1] = { ...nextVal, display_order: aOrder } as any;
                                        return { ...p, [it.id]: list };
                                      });
                                      enqueue({ t: 'updateVal', id: v.id as number, optionId: it.id, changes: { display_order: (arr[vi + 1] as any).display_order } });
                                      enqueue({ t: 'updateVal', id: nextVal.id as number, optionId: it.id, changes: { display_order: (v as any).display_order } });
                                    }} disabled={vi === arr.length - 1}>↓</Button>
                                    <Button variant="destructive" onClick={() => {
                                      // Optimistic local removal
                                      setDraftValues(prev => ({ ...prev, [it.id]: (prev[it.id] || []).filter(x => x.id !== v.id) }));
                                      // If value already exists in backend, delete immediately; else queue delete of temp
                                      if ((v.id as number) > 0) {
                                        deleteValMut.mutate({ optionId: it.id as number, valueId: v.id as number });
                                      } else {
                                        enqueue({ t: 'deleteVal', id: v.id as number, optionId: it.id });
                                      }
                                    }}>Eliminar</Button>
                                  </div>
                                </div>
                              ))}
                              {expandedOptionId === it.id && (valuesQuery.isLoading && (draftValues[it.id]?.length ?? 0) === 0) && <div className="text-sm text-gray-500">Cargando valores...</div>}
                              {(draftValues[it.id]?.length || 0) === 0 && <div className="text-sm text-gray-500">No hay valores</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                          <div className="md:col-span-2">
                            <label className="text-sm text-gray-700">Título</label>
                            <Input defaultValue={(it.data as ProductCustomForm).label} onChange={(e) => {
                              const val = e.target.value;
                              setDraftForms(prev => prev.map(f => f.id === (it.data as ProductCustomForm).id ? { ...f, label: val } : f));
                              enqueue({ t: 'updateForm', id: (it.data as ProductCustomForm).id, changes: { label: val } });
                            }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked={(it.data as ProductCustomForm).required} onChange={(e) => {
                              const val = e.target.checked;
                              setDraftForms(prev => prev.map(f => f.id === (it.data as ProductCustomForm).id ? { ...f, required: val } : f));
                              enqueue({ t: 'updateForm', id: (it.data as ProductCustomForm).id, changes: { required: val } });
                            }} />
                            <span className="text-sm">Requerido</span>
                          </div>
                          <div className="text-sm text-gray-600">{(it.data as ProductCustomForm).input_type}</div>
                        </div>

                        {['text','textarea','number'].includes((it.data as ProductCustomForm).input_type) && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-gray-700">Máx. caracteres</label>
                              <Input type="number" defaultValue={(it.data as ProductCustomForm).max_length ?? ''} onChange={(e) => {
                                const raw = e.target.value;
                                const val = (raw === '' ? null : Number(raw)) as any;
                                setDraftForms(prev => prev.map(f => f.id === (it.data as ProductCustomForm).id ? { ...f, max_length: val } : f));
                                enqueue({ t: 'updateForm', id: (it.data as ProductCustomForm).id, changes: { max_length: val } });
                              }} />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Texto de ayuda</label>
                              <Input defaultValue={(it.data as ProductCustomForm).help_text || ''} onChange={(e) => {
                                const val = e.target.value;
                                setDraftForms(prev => prev.map(f => f.id === (it.data as ProductCustomForm).id ? { ...f, help_text: val } : f));
                                enqueue({ t: 'updateForm', id: (it.data as ProductCustomForm).id, changes: { help_text: val } });
                              }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-sm text-gray-500">Aún no hay preguntas. Agrega una arriba.</div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      
    </div>
  );
}
