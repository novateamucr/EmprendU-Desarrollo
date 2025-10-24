import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productApi, Product, categoryApi, type Category } from '../services/entrepreneurshipService';

import { Facebook, WhatsApp, Twitter, Link as LinkIcon, ArrowBack } from '@mui/icons-material';

import { useCart } from '../context/CartContext';
import {
  getProductOptions,
  getOptionValues,
  getCustomForms,
  type ProductOption,
  type ProductOptionValue,
  type ProductCustomForm,
} from '../services/productConfigService';

// Skeleton component for loading state
const ProductDetailSkeleton = () => (
  <div className="pt-24 pb-8 px-4 md:px-8">
    <div className="max-w-4xl mx-auto">
      {/* Back button and image skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <div className="w-32 h-6 bg-gray-200 rounded"></div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image skeleton */}
        <div className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
        
        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          
          <div className="pt-4 space-y-4">
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
            <div className="flex space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catMap, setCatMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi
      .getSingle(id)
      .then((data) => {
        setProduct(data);
        setError(null);
      })
      .catch(() => {
        setError('No se pudo cargar el producto.');
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch categories for mapping category_id -> name
  useEffect(() => {
    categoryApi.getAll()
      .then((list: Category[]) => {
        const map: Record<number, string> = {};
        (list || []).forEach((c) => { if (c?.id != null) map[c.id] = c.nombre; });
        setCatMap(map);
      })
      .catch(() => {});
  }, []);

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (increment: number) => {
    setQuantity(prev => Math.max(1, prev + increment));
  };

  // Load configurable form data (hooks must be declared before any return)
  const [optList, setOptList] = useState<ProductOption[]>([]);
  const [formList, setFormList] = useState<ProductCustomForm[]>([]);
  const [valuesByOpt, setValuesByOpt] = useState<Record<number, ProductOptionValue[]>>({});
  const [formLoading, setFormLoading] = useState(false);
  // Controlled selections
  const [selectedByOption, setSelectedByOption] = useState<Record<number, number[]>>({});
  const [customValues, setCustomValues] = useState<Record<number, string | number | boolean>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!product?.id) return;
      setFormLoading(true);
      try {
        const [opts, forms] = await Promise.all([
          getProductOptions(product.id),
          getCustomForms(product.id),
        ]);
        if (!mounted) return;
        setOptList(opts || []);
        setFormList(forms || []);
        // fetch values for each option
        const entries = await Promise.all(
          (opts || []).map(async (o) => {
            const vals = await getOptionValues(product.id, o.id);
            return [o.id, vals || []] as const;
          })
        );
        if (!mounted) return;
        const map: Record<number, ProductOptionValue[]> = {};
        entries.forEach(([id, vals]) => { map[id] = vals; });
        setValuesByOpt(map);
      } finally {
        if (mounted) setFormLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [product?.id]);

  const unifiedItems = useMemo(() => {
    return [
      ...optList.map(o => ({ kind: 'option' as const, order: o.display_order, data: o })),
      ...formList.map(f => ({ kind: 'form' as const, order: f.display_order, data: f })),
    ].sort((a,b) => a.order - b.order);
  }, [optList, formList]);

  const handleOrder = () => {
    if (!product || !product.entrepreneurship) return;
    // Build selection summary strings
    const summary: string[] = [];
    // Options
    optList.forEach((o) => {
      const selectedIds = selectedByOption[o.id] || [];
      if (selectedIds.length > 0) {
        const vals = (valuesByOpt[o.id] || []).filter(v => selectedIds.includes(v.id));
        const label = `${o.name}: ${vals.map(v => v.value).join(', ')}`;
        summary.push(label);
      }
    });
    // Custom forms
    formList.forEach((f) => {
      const v = customValues[f.id];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        summary.push(`${f.label}: ${String(v)}`);
      }
    });

    // Add the selected quantity to the cart
    for (let i = 0; i < quantity; i++) {
      addItem(
        product.entrepreneurship.id.toString(),
        product.entrepreneurship.name,
        {
          productId: product.id.toString(),
          name: product.name,
          price: product.price,
          ...(product.image_url && { imageUrl: product.image_url }),
          quantity: 1,
          selections: {
            options: optList.map(o => ({
              optionId: o.id,
              optionName: o.name,
              valueIds: selectedByOption[o.id] || [],
              valueLabels: (valuesByOpt[o.id] || [])
                .filter(v => (selectedByOption[o.id] || []).includes(v.id))
                .map(v => v.value),
            }))
              .filter(e => (e.valueIds?.length || 0) > 0),
            customs: formList.map(f => ({ formId: f.id, formLabel: f.label, value: customValues[f.id] }))
              .filter(e => e.value !== undefined && e.value !== null && String(e.value).trim() !== ''),
          },
          selectionSummary: summary,
        }
      );
    }
    
    // Reset form selections and quantity
    setSelectedByOption({});
    setCustomValues({});
    setQuantity(1);
    // No redirection; Layout will show a transient notification
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const frontendProductUrl = product?.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${product.id}`
    : currentUrl;

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(frontendProductUrl)}`;
    window.open(url, '_blank', 'noopener');
  };

  const shareToWhatsApp = () => {
    const text = `Mira este producto: ${product?.name} - ${frontendProductUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  };

  const shareToTwitter = () => {
    const text = `Mira este producto: ${product?.name}`;
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(frontendProductUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(frontendProductUrl);
      alert('Link copiado al portapapeles');
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = frontendProductUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado al portapapeles');
    }
  };

  useEffect(() => {
    if (!product) return;
    const title = product.name || '';
    const genericDescBase = product.entrepreneurship?.name
      ? `Mira esto de ${product.entrepreneurship.name}`
      : '¡Mira esto!';
    const description = genericDescBase;
    const image = product.image_url || '';
    const url = frontendProductUrl;

    if (title) document.title = title;

    const setOg = (prop: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setOg('og:title', title);
    setOg('og:description', description);
    setOg('og:image', image);
    setOg('og:url', url);
    setOg('og:type', 'product');
  }, [product, frontendProductUrl]);

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!product) return <div className="text-center py-8 text-gray-500">Producto no encontrado.</div>;

  return (
    <div className="pt-24 pb-8">
      {/* Entrepreneurship link (avatar + name) above the card */}
      {product.entrepreneurship?.id && (
        <div className="max-w-4xl mx-auto px-4 md:px-8 mb-2">
          <Link
            to={`/business/${product.entrepreneurship.id}`}
            className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
            title={product.entrepreneurship.name}
          >
            <ArrowBack sx={{ fontSize: 16 }} />
            <img
              src={product.entrepreneurship.image_url || 'https://placehold.co/64x64?text=E'}
              alt={product.entrepreneurship.name}
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
            <span className="hover:underline">{product.entrepreneurship.name}</span>
          </Link>
        </div>
      )}
      <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full">
            <img
              src={product.image_url || 'https://placehold.co/800x800?text=Sin+imagen'}
              alt={product.name}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
          <div className="relative flex flex-col pt-6 md:pt-1">
            {product?.category_id != null && (
              <span className="inline-block w-fit self-end mb-5 text-xs px-2 py-0.5 rounded-full bg-[#E6F4FA] text-[#0A5B7A]">
                {catMap[Number(product.category_id)] || 'General'}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{product.name}</h1>
            {product.description && (
              <p className="text-secondary mt-2">{product.description}</p>
            )}
            {product.long_description && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-primary">Descripción detallada</h2>
                <p className="text-secondary whitespace-pre-line mt-2">{product.long_description}</p>
              </div>
            )}

            {/* Configurable form (between descriptions and price) */}
            {(formLoading || unifiedItems.length > 0) && (
              <div className="mt-5">
                <h3 className="text-lg font-semibold text-primary mb-2">Personaliza tu pedido</h3>
                {formLoading && <div className="text-sm text-secondary">Cargando opciones…</div>}
                {!formLoading && unifiedItems.length > 0 && (
                  <div className="space-y-4">
                    {unifiedItems.map((it) => (
                      <div key={(it.kind === 'option' ? (it.data as ProductOption).id : (it.data as ProductCustomForm).id)}>
                        {it.kind === 'option' ? (
                          (() => {
                          const o = it.data as ProductOption;
                          const vals = valuesByOpt[o.id] || [];
                          if (o.type === 'select') {
                            return (
                              <div className="space-y-1">
                                <label className="text-sm text-secondary">{o.name}{o.required ? ' *' : ''}</label>
                                <select
                                  className="w-full border rounded px-3 py-2"
                                  value={(selectedByOption[o.id]?.[0]) ?? ''}
                                  onChange={(e) => {
                                    const vId = Number(e.target.value);
                                    setSelectedByOption(prev => ({ ...prev, [o.id]: vId ? [vId] : [] }));
                                  }}
                                >
                                  <option value="">Selecciona…</option>
                                  {vals.map(v => (
                                    <option key={v.id} value={v.id}>{v.value}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                          if (o.type === 'multiselect') {
                            return (
                              <div className="space-y-1">
                                <label className="text-sm text-secondary">{o.name}{o.required ? ' *' : ''}</label>
                                <div className="flex flex-wrap gap-2">
                                  {vals.map(v => {
                                    const checked = (selectedByOption[o.id] || []).includes(v.id);
                                    return (
                                      <label key={v.id} className="inline-flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            setSelectedByOption(prev => {
                                              const current = new Set(prev[o.id] || []);
                                              if (e.target.checked) current.add(v.id); else current.delete(v.id);
                                              return { ...prev, [o.id]: Array.from(current) };
                                            });
                                          }}
                                        /> {v.value}
                                      </label>
                                    );
                                  })}
                                </div>
                                {(o.min_select || o.max_select) && (
                                  <div className="text-xs text-secondary">{o.min_select ? `Mín: ${o.min_select}` : ''} {o.max_select ? `Máx: ${o.max_select}` : ''}</div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()
                      ) : (
                        (() => {
                          const f = it.data as ProductCustomForm;
                          if (f.input_type === 'text') {
                            return (
                              <div className="space-y-1">
                                <label className="text-sm text-secondary">{f.label}{f.required ? ' *' : ''}</label>
                                <input
                                  className="w-full border rounded px-3 py-2"
                                  type="text"
                                  placeholder={f.help_text || ''}
                                  maxLength={f.max_length ?? undefined}
                                  value={String(customValues[f.id] ?? '')}
                                  onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                                />
                              </div>
                            );
                          }
                          if (f.input_type === 'textarea') {
                            return (
                              <div className="space-y-1">
                                <label className="text-sm text-secondary">{f.label}{f.required ? ' *' : ''}</label>
                                <textarea
                                  className="w-full border rounded px-3 py-2"
                                  rows={3}
                                  placeholder={f.help_text || ''}
                                  maxLength={f.max_length ?? undefined}
                                  value={String(customValues[f.id] ?? '')}
                                  onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                                />
                              </div>
                            );
                          }
                          if (f.input_type === 'number') {
                            return (
                              <div className="space-y-1">
                                <label className="text-sm text-secondary">{f.label}{f.required ? ' *' : ''}</label>
                                <input
                                  className="w-full border rounded px-3 py-2"
                                  type="number"
                                  placeholder={f.help_text || ''}
                                  value={customValues[f.id] === undefined ? '' : String(customValues[f.id])}
                                  onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                                />
                              </div>
                            );
                          }
                          if (f.input_type === 'boolean') {
                            return (
                              <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Boolean(customValues[f.id] ?? false)}
                                  onChange={(e) => setCustomValues(prev => ({ ...prev, [f.id]: e.target.checked }))}
                                /> {f.label}{f.required ? ' *' : ''}
                              </label>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            <div className="mt-auto">
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold text-primary">₡{product.price.toLocaleString()}</p>
                  <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(-1);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Remove className="w-5 h-5" />
                    </button>
                    <span className="w-10 text-center font-medium text-gray-800">{quantity}</span>
                    <button

                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(1);
                      }}
                      className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                      aria-label="Aumentar cantidad"

                     
                    >
                          <button
                       onClick={shareToTwitter}
                      aria-label="Compartir en Twitter"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-brand/10 text-primary"
                      title="Compartir en Twitter"
                        >
                      <Twitter sx={{ fontSize: 18 }} />
                    </button>
                    <button
                      onClick={shareToWhatsApp}
                      aria-label="Compartir en WhatsApp"
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-brand/10 text-primary"
                      title="Compartir en WhatsApp"

                    >
                      <Add className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleOrder}
                    className="px-4 py-2.5 rounded-md bg-brand text-white text-sm font-medium hover:bg-brandDark transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Añadir {quantity} al carrito</span>
                    {quantity > 1 && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        ₡{(product.price * quantity).toLocaleString()}
                      </span>
                    )}
                  </button>
                  {/* Share caption and icon buttons (tighter spacing) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-secondary">¡Comparte!</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={shareToFacebook}
                        aria-label="Compartir en Facebook"
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-brand/10 text-primary"
                        title="Compartir en Facebook"
                      >
                        <Facebook sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={shareToWhatsApp}
                        aria-label="Compartir en WhatsApp"
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-brand/10 text-primary"
                        title="Compartir en WhatsApp"
                      >
                        <WhatsApp sx={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={copyLink}
                        aria-label="Copiar link"
                        className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-brand/10 text-primary"
                        title="Copiar link"
                      >
                        <LinkIcon sx={{ fontSize: 18 }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
