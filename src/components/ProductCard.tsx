export interface ProductCardProps {
  title: string;
  imgUrl: string;
  description: string;
  price: number;
  onBuy?: () => void; // función opcional al hacer clic en "Comprar"
}

export function ProductCard(props: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        <img
          src={props.imgUrl}
          alt={props.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm mb-1">{props.title}</h3>
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{props.description}</p>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">₡{props.price.toLocaleString()}</p>
          </div>
          <button
            onClick={props.onBuy}
            className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
