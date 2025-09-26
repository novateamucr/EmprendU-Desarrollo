
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { entrepreneurshipApi, Entrepreneurship } from '../services/entrepreneurshipService';
import { ProductCard } from '../components/ProductCard';

export function FeedEmpredimientoDetalle() {
  const { id } = useParams();
  const [business, setBusiness] = useState<Entrepreneurship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    entrepreneurshipApi.getById(id as string)
      .then(data => {
        setBusiness(data);
        setError(null);
      })
      .catch(() => {
        setError('No se pudo cargar el emprendimiento.');
        setBusiness(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando emprendimiento...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!business) return <div className="text-center py-8 text-gray-500">Emprendimiento no encontrado.</div>;

  return (
    <div className="mt-6">
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <img
            src={business.image_url || 'https://placehold.co/600x300?text=Sin+imagen'}
            alt={business.name}
            className="mx-auto md:h-72 object-cover rounded-2xl"
          />
          <h1 className="text-2xl md:text-3xl font-bold mt-4">{business.name}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto px-2">{business.description}</p>
          <button className="mt-3 px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
            Agregar a favoritos
          </button>
        </div>

        {/* Productos del emprendimiento */}
        <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">Productos</h2>
        {business.products && business.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {business.products.map((product: any) => (
              <ProductCard
                key={product.id}
                imgUrl={product.image_url || 'https://placehold.co/400x400?text=Sin+imagen'}
                title={product.name}
                description={product.description || ''}
                price={product.price}
                onBuy={() => alert(`Compraste: ${product.name}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center">Este emprendimiento aún no tiene productos.</div>
        )}

      </div>
    </div>
  );
}
