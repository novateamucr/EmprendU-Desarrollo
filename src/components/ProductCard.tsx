export interface ProductCardProps {
  title: string;
  imgUrl: string;
  description: string;
  price: number;
  onBuy?: () => void; // función opcional al hacer clic en "Comprar"
}

export function ProductCard(props: ProductCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-transform duration-300">
      <div className="p-6 flex justify-center">
        <img
          src={props.imgUrl}
          alt={props.title}
          className="w-full h-56 object-cover rounded-xl drop-shadow-2xl"
        />
      </div>
      <div className="p-6 text-center">
        <h3 className="font-semibold text-xl">{props.title}</h3>
        <p className="text-gray-500 text-sm mt-3">{props.description}</p>
        <div className="flex justify-between items-center mt-6">
          <div>
            <p className="text-xs font-semibold text-gray-400">PRECIO</p>
            <p className="text-xl font-bold text-gray-800">${props.price}</p>
          </div>
          <button
            onClick={props.onBuy}
            className="px-5 py-2 rounded-lg bg-purple-600 text-white font-medium shadow hover:bg-purple-700 transition hover:scale-105 duration-300"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
