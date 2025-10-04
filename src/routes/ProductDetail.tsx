import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, Product, categoryApi, type Category } from '../services/entrepreneurshipService';
import { Facebook, WhatsApp, Link as LinkIcon, ArrowBack } from '@mui/icons-material';
import { useCart } from '../context/CartContext';

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
  const navigate = useNavigate();

  const handleOrder = () => {
    if (!product || !product.entrepreneurship) return;
    
    addItem(
      product.entrepreneurship.id.toString(),
      product.entrepreneurship.name,
      {
        productId: product.id.toString(),
        name: product.name,
        price: product.price,
        ...(product.image_url && { imageUrl: product.image_url }), // Only include imageUrl if it exists
        quantity: 1
      }
    );
    
    // Optionally navigate to cart or show a notification
    navigate('/cart');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'noopener');
  };

  const shareToWhatsApp = () => {
    const text = `Mira este producto: ${product?.name} - ${currentUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert('Link copiado al portapapeles');
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado al portapapeles');
    }
  };

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

            <div className="mt-auto">
              <p className="text-2xl font-semibold text-primary mt-6">₡{product.price.toLocaleString()}</p>
              <div className="flex flex-col gap-3 mt-4">
                <button
                  onClick={handleOrder}
                  className="px-4 py-2 rounded-md bg-brand text-white text-sm font-medium hover:bg-brandDark transition-colors"
                >
                  Agregar al carrito
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
  );
}
