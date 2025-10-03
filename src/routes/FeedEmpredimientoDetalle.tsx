
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entrepreneurshipApi, Entrepreneurship, categoryApi } from '../services/entrepreneurshipService';
import { ProductCard } from '../components/ProductCard';
import { useProfile, useAddFavorite, useRemoveFavorite } from '../domain/profile/queries';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Modal } from '../components/Modal';
import type { UserProfile } from '../domain/profile/types';

export function FeedEmpredimientoDetalle() {
  const { id } = useParams();
  const [business, setBusiness] = useState<Entrepreneurship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catMap, setCatMap] = useState<Record<number, string>>({});
  const { data: profile } = useProfile() as unknown as { data?: UserProfile };
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const favorites = profile?.favorites ?? [];
  const favMap = new Map<number, any>(favorites.map((f: any) => [Number(f.entrepreneurship_id), f]));
  const businessIdNum = business?.id != null ? Number(business.id) : null;
  const isFav = businessIdNum != null ? favMap.has(businessIdNum) : false;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [localPending, setLocalPending] = useState(false);
  const [localFavId, setLocalFavId] = useState<number | null>(null);
  const displayFav = isFav; // fuente visual basada en cache de perfil

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

  // Cargar categorías para mapear category_id -> nombre
  useEffect(() => {
    categoryApi.getAll()
      .then(list => {
        const map: Record<number, string> = {};
        (list || []).forEach((c) => { if (c?.id != null) map[c.id] = c.nombre; });
        setCatMap(map);
      })
      .catch(() => {
        // sin bloqueo de UI si falla
      });
  }, []);

  // Mantener el id del favorito actual al cambiar el cache de favoritos
  useEffect(() => {
    if (businessIdNum == null) return;
    const existing = favMap.get(businessIdNum);
    setLocalFavId(existing?.id ?? null);
  }, [businessIdNum, favorites]);

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando emprendimiento...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!business) return <div className="text-center py-8 text-gray-500">Emprendimiento no encontrado.</div>;

  return (
    <div className="pt-24 pb-8">
      <div className="px-4 max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
          <img
            src={business.image_url || 'https://placehold.co/600x300?text=Sin+imagen'}
            alt={business.name}
            className="mx-auto md:h-72 object-cover rounded-2xl"
          />
          <div className="mt-4">
            <span className="inline-block border border-border text-secondary px-3 py-1 rounded-full text-xs">
              {business.category_relation?.nombre || 'General'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-3">{business.name}</h1>
          <p className="text-gray-600 max-w-2xl mx-auto px-2">{business.description}</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (businessIdNum == null) return;
              const favId = localFavId ?? favMap.get(businessIdNum)?.id ?? null;
              if (favId) {
                setPendingRemove(favId);
                setConfirmOpen(true);
              } else {
                // Esperar respuesta del backend antes de reflejar el cambio
                setLocalPending(true);
                addFav.mutate(businessIdNum, {
                  onSuccess: (res: any) => {
                    const createdId = res?.favorite?.id;
                    if (createdId) setLocalFavId(createdId);
                  },
                  onSettled: () => setLocalPending(false)
                });
              }
            }}
            className="mt-3 px-5 py-2 bg-brand text-white rounded-full hover:bg-brandDark transition-colors inline-flex items-center gap-2"
            disabled={localPending}
            aria-label={displayFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {displayFav ? (
              <Favorite sx={{ fontSize: 18 }} className="text-[#0A5B7A]" />
            ) : (
              <FavoriteBorder sx={{ fontSize: 18 }} />
            )}
            {displayFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          </button>
          </div>
        </div>

        {/* Productos del emprendimiento */}
        <div className="mt-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Productos</h2>
          {business.products && business.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.products.map((product: any) => (
                <Link key={product.id} to={`/product/${product.id}`} className="block">
                  <ProductCard
                    imgUrl={product.image_url || 'https://placehold.co/600x600?text=Sin+imagen'}
                    title={product.name}
                    categoryName={product?.category_id != null ? (catMap[Number(product.category_id)] || 'General') : undefined}
                    description={product.description || ''}
                    price={product.price}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center">Este emprendimiento aún no tiene productos.</div>
          )}
        </div>

        {/* Confirm remove favorite */}
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Eliminar de favoritos"
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary">¿Estás seguro de que deseas eliminar este emprendimiento de tus favoritos?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (pendingRemove) {
                    setLocalPending(true);
                    removeFav.mutate(pendingRemove, {
                      onSettled: () => setLocalPending(false)
                    });
                  }
                  setConfirmOpen(false);
                  setPendingRemove(null);
                }}
                className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brandDark"
                disabled={localPending}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
