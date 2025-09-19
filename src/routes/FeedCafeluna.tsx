import { ProductCard } from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';

// Importar imágenes desde src/assets
import logoCafe from "../assets/cafe.jpeg";
import cafe from "../assets/cafe1.jpg";

export function Feed1() {
    const navigate = useNavigate();
    return (
        <div className="p-6">
            <div className="p-4 md:p-8 max-w-6xl mx-auto">


                {/* Banner y descripción del emprendimiento */}
                <div className="text-center mb-6">
                    <img
                        src={logoCafe}
                        alt="Banner"
                        className="mx-auto md:h-72 object-cover rounded-2xl"
                    />
                    <h1 className="text-2xl md:text-3xl font-bold mt-4">Cafe Luna</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto px-2">
                        Cafe artesanal con granos locales y ambiente acogedor.
                    </p>
                    <button className="mt-3 px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                        Agregar a favoritos
                    </button>
                </div>

                {/* Likes */}
                <div className="flex justify-center items-center gap-2 mb-4">
                    <button className="text-3xl md:text-4xl text-gray-400 hover:text-red-500">♡</button>
                    <button className="text-3xl md:text-4xl text-gray-400 hover:text-red-500">♡</button>
                    <button className="text-3xl md:text-4xl text-gray-400 hover:text-red-500">♡</button>
                    <button className="text-3xl md:text-4xl text-gray-400 hover:text-red-500">♡</button>
                    <button className="text-3xl md:text-4xl text-gray-400 hover:text-red-500">♡</button>
                </div>
                <p className="text-center text-gray-500 text-sm md:text-base">3.8 / 5</p>

                {/* Productos */}
                <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">Productos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ProductCard
                        imgUrl={cafe}
                        title="Cafe"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                    <ProductCard
                        imgUrl={cafe}
                        title="Cafe"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                    <ProductCard
                        imgUrl={cafe}
                        title="Cafe"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                </div>
            </div>
        </div>
    );
}
