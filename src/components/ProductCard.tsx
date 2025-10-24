import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { getProductOptions, getCustomForms } from '../services/productConfigService';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

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
  const [showQuantity, setShowQuantity] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (e: React.MouseEvent, increment: number) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(1, prev + increment));
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (showQuantity) {
      e.stopPropagation();
      return;
    }
    setShowQuantity(true);
  };

  const handleAddToCart = async (e: React.MouseEvent, customQuantity?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const qty = customQuantity || 1;
    
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
          quantity: qty
        }
      );
      
      // Reset quantity and hide selector
      setQuantity(1);
      setShowQuantity(false);
      
      if (props.onBuy) props.onBuy();
    } catch {
      navigate(`/product/${props.productId}`);
    }
  };
  
  const handleConfirmQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAddToCart(e, quantity);
  };
  
  const handleCancelQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(1);
    setShowQuantity(false);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full relative"
      onClick={handleCardClick}
    >
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
          <p className="text-lg font-semibold text-gray-900 text-center">
            ₡{props.price.toLocaleString()}
          </p>
          
          {showQuantity ? (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => handleQuantityChange(e, -1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={(e) => handleQuantityChange(e, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelQuantity}
                  className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmQuantity}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-brand rounded-md hover:bg-brandDark"
                >
                  Añadir {quantity}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="mt-1 px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:bg-brandDark transition-colors"
            >
              Hacer pedido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
