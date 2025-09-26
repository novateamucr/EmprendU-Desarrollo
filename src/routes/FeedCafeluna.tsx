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
                <div className="text-center mb-8">
                    <img
                        src={logoCafe}
                        alt="Banner"
                        className="mx-auto md:h-72 object-cover rounded-2xl border border-border shadow-soft"
                    />
                    <h1 className="text-2xl md:text-3xl font-bold mt-4 text-primary">Café Luna</h1>
                    <div className="h-0.5 w-16 bg-brand/40 rounded mx-auto mt-2 mb-3" />
                    <p className="text-secondary max-w-2xl mx-auto px-2">
                        Café artesanal con granos locales y ambiente acogedor.
                    </p>
                    <button className="mt-4 px-5 py-2 bg-brand text-white rounded-full hover:bg-brandDark transition-colors focus-brand">
                        Agregar a favoritos
                    </button>
                </div>

                {/* Likes */}
                <div className="flex justify-center items-center gap-2 mb-2">
                    <button className="text-3xl md:text-4xl text-secondary hover:text-red-500 transition-colors focus-brand">♡</button>
                    <button className="text-3xl md:text-4xl text-secondary hover:text-red-500 transition-colors focus-brand">♡</button>
                    <button className="text-3xl md:text-4xl text-secondary hover:text-red-500 transition-colors focus-brand">♡</button>
                    <button className="text-3xl md:text-4xl text-secondary hover:text-red-500 transition-colors focus-brand">♡</button>
                    <button className="text-3xl md:text-4xl text-secondary hover:text-red-500 transition-colors focus-brand">♡</button>
                </div>
                <p className="text-center text-secondary text-sm md:text-base">3.8 / 5</p>

                {/* Productos */}
                <div className="mt-8 mb-4">
                    <h2 className="text-xl md:text-2xl font-semibold text-primary">Productos</h2>
                    <div className="h-0.5 w-12 bg-brand/40 rounded mt-2" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ProductCard
                        imgUrl={cafe}
                        title="Café"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                    <ProductCard
                        imgUrl={cafe}
                        title="Café"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                    <ProductCard
                        imgUrl={cafe}
                        title="Café"
                        description="Mezcla única de granos tostados artesanalmente"
                        price={3500}

                    />
                </div>
            </div>
        </div>
    );
}
