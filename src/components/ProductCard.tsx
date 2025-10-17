import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getProductOptions, getCustomForms } from '../services/productConfigService';

export interface ProductCardProps {
  title: string;
  imgUrl: string;
  description: string;
  price: number;
  productId: string;
  entrepreneurshipId: string;
  entrepreneurshipName: string;
  categoryName?: string;
  onBuy?: () => void;
}

export function ProductCard(props: ProductCardProps) {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    // Avoid triggering parent Link navigation when button is inside a Link wrapper
    e.preventDefault();
    e.stopPropagation();
    try {
      const pid = Number(props.productId);
      let hasForm = false;
      try {
        const [opts, forms] = await Promise.all([
          getProductOptions(pid).catch(() => []),
          getCustomForms(pid).catch(() => []),
        ]);
        hasForm = (opts && opts.length > 0) || (forms && forms.length > 0);
      } catch {
        hasForm = false;
      }

      if (hasForm) {
        navigate(`/product/${props.productId}`);
        return;
      }

      addItem(
        props.entrepreneurshipId,
        props.entrepreneurshipName,
        {
          productId: props.productId,
          name: props.title,
          price: props.price,
          imageUrl: props.imgUrl,
          quantity: 1
        }
      );
      if (props.onBuy) props.onBuy();
    } catch {
      // Si algo falla, fallback a navegar al detalle para asegurar flujo
      navigate(`/product/${props.productId}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full">
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <img
          src={props.imgUrl}
          alt={props.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {props.categoryName && (
          <span className="inline-block w-fit self-end mb-1 text-[11px] px-2 py-0.5 rounded-full bg-[#E6F4FA] text-[#0A5B7A]">
            {props.categoryName}
          </span>
        )}
        <h3 className="font-medium text-gray-900 text-sm mb-1">{props.title}</h3>
        <p className="text-gray-600 text-xs mb-3 line-clamp-2 overflow-hidden text-ellipsis">
          {props.description}
        </p>
        <div className="flex flex-col gap-2 mt-auto">
          <div>
            <p className="text-lg font-semibold text-gray-900 text-center">
              ₡{props.price.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            className="mt-1 px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:bg-brandDark transition-colors"
          >
            Hacer pedido
          </button>
        </div>
      </div>
    </div>
  );
}
