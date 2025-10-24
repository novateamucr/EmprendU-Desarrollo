import { Search } from '@mui/icons-material';
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entrepreneurshipApi, Entrepreneurship, categoryApi } from '../services/entrepreneurshipService';
import { ProductCard } from '../components/ProductCard';
import { useProfile, useAddFavorite, useRemoveFavorite } from '../domain/profile/queries';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { Modal } from '../components/Modal';
import type { UserProfile } from '../domain/profile/types';
import Btn from "../components/ui/Btn";
import BusinessFeedbackPopup from "../components/ui/BusinessFeedback";
import { toast } from "react-toastify";
import { useAuth } from '../context/AuthContext';
import { BusinessDetailSkeleton } from '../components/skeletons/BusinessDetailSkeleton';
import Footer from "../components/footer/Footer";
import BusinessChannels from '../components/BusinessChannels';

export function FeedEmpredimientoDetalle() {
  const { id } = useParams();
  const [business, setBusiness] = useState<Entrepreneurship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catMap, setCatMap] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

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
  const displayFav = isFav;
  const { token, user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const commentCount = useMemo(() => reviews.filter(r => (r.review ?? '').trim() !== '').length, [reviews]);
  const commentedReviews = reviews.filter(r => (r.review ?? '').trim() !== '');
  const [sortOrder, setSortOrder] = useState("none");

  type Review = {
    id: number;
    rating: number;
    review: string | null;
    user_id: number;
    entrepreneurship_id: number;
    created_at: string;
    updated_at: string;
    user?: { id: number; name: string };
  };

  //Buscador y filtros
  const filteredPrice = (business?.products || [])
    .filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortOrder === "lowToHigh") return a.price - b.price;
      if (sortOrder === "highToLow") return b.price - a.price;
      return 0;
    });


  const submitReview = async (rating: number, comments: string) => {
    setLoading(true);
    try {

      const response = await fetch("https://emprendu-desarrollo-production.up.railway.app/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: rating,
          review: comments,
          user_id: user?.id,
          entrepreneurship_id: businessIdNum,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar el review");
      }

      const data = await response.json();
      toast.success("¡Review enviado con éxito!");
      console.log("Review creado:", data);
      setShowPopup(false);
      fetchReviews();
    } catch (err: any) {
      console.error("Error enviando review:", err);
      toast.error(err.message || "Error al enviar review");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `https://emprendu-desarrollo-production.up.railway.app/api/reviews?entrepreneurship_id=${id}`,
        { headers }
      );

      if (!res.ok) throw new Error("Error al obtener reviews");

      const list: Review[] = await res.json(); // tu API devuelve un array plano

      setReviews(list);

      if (list.length > 0) {
        const avg = list.reduce((acc, r) => acc + Number(r.rating || 0), 0) / list.length;
        setAverageRating(avg);
      } else {
        setAverageRating(null);
      }
    } catch (err) {
      console.error("Error cargando reviews:", err);
      setReviews([]);
      setAverageRating(null);
    }
  };


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    entrepreneurshipApi.getById(id as string)
      .then(data => {
        setBusiness(data);
        setError(null);
        fetchReviews();
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

  if (loading) return <BusinessDetailSkeleton />;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!business) return <div className="text-center py-8 text-gray-500">Emprendimiento no encontrado.</div>;

  return (
   <div className="w-full px-4 sm:px-6 lg:px-8 mt-16">
    <div className="w-full">
      <div className="max-w-4xl mx-auto">
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
            <div className="flex flex-wrap justify-center gap-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="relative group">
                  <span
                    className={`text-4xl sm:text-5xl ${averageRating && star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white text-black p-3 text-xs leading-5 rounded whitespace-wrap">
                    ¡Realiza un pedido para calificar este emprendimiento!
                  </div>
                </div>
              ))}
            </div>
            {averageRating && (
              <p className="text-sm text-gray-500 mt-1">
                {averageRating.toFixed(1)} / 5 de {reviews.length} calificaciones
              </p>
            )}
            <Btn
              style="text-gray-400 text-xs mt-2 hover:text-gray-500 hover:underline"
              key="abrirPopup"
              text="¡Califica este emprendimiento!"
              onClick={() => setShowPopup(true)}
            />

            {showPopup && (
              <BusinessFeedbackPopup
                show={showPopup}
                title="¡Califica tu experiencia!"
                entrepreneurshipName={business.name}
                imageUrl={business.image_url || 'https://placehold.co/600x300?text=Sin+imagen'}
                onSubmit={(rating: number, comments: string) => {
                  submitReview(rating, comments);
                }}
                onCancel={() => setShowPopup(false)}
              />
            )}
            <p className='text-gray-400 text-xs mt-2 mb-4'>Las calificaciones proporcionadas son realizadas por nuestros clientes</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-3">{business.name}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto px-2">{business.description}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
                className="px-5 py-2 bg-brand text-white rounded-full hover:bg-brandDark transition-colors inline-flex items-center gap-2"
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

              {/* Canales del emprendimiento */}
              {business?.id ? <BusinessChannels entrepreneurshipId={Number(business.id)} /> : null}
            </div>
          </div>
        </div>

        {/* Productos del emprendimiento */}
        {/* 🔍 Buscador */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
          </div>

          {/* Selector de orden de precio */}
          <div className="w-full md:w-64 relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white appearance-none"
            >
              <option value="none">Ordenar por precio</option>
              <option value="lowToHigh">Menor a mayor</option>
              <option value="highToLow">Mayor a menor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

        </div>

        {filteredPrice.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrice.map((product: any) => (

              <Link key={product.id} to={`/product/${product.id}`} className="block">
                <ProductCard
                  imgUrl={product.image_url || 'https://placehold.co/600x600?text=Sin+imagen'}
                  title={product.name}
                  categoryName={
                    product?.category_id != null
                      ? catMap[Number(product.category_id)] || 'General'
                      : undefined
                  }
                  description={product.description || ''}
                  price={product.price}
                  productId={String(product.id)}
                  entrepreneurshipId={String(business.id)}
                  entrepreneurshipName={business.name}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            {searchQuery
              ? 'No se encontraron productos con ese nombre.'
              : 'Este emprendimiento aún no tiene productos.'}
          </div>
        )}

       {averageRating !== null && (
  <div className=" mt-20 pb-4 flex flex-wrap justify-center gap-8 items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <div key={star} className="relative group">
        <span
          className={`text-5xl ${averageRating && star <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      </div>
    ))}
    {averageRating && (
      <p className="text-2xl mt-1 flex items-center gap-2">
        {averageRating.toFixed(1)}&nbsp;
        <span className='text-xs text-gray-500'>
          {reviews.length} calificaciones - {commentCount} comentarios
        </span>
      </p>
    )}
  </div>
)}
          
        </div>
          <h1 className="text-2xl font-bold pb-8 border-b-2">Comentarios</h1>

        <div className="mt-6 space-y-4"> {commentedReviews.length === 0 && (<p className="text-sm text-gray-500">Todavía no hay comentarios.</p>)}
          {commentedReviews.map(r => (
            <div key={r.id} className="border-b pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.user?.name}</span>
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.max(0, Math.min(5, Number(r.rating) || 0)))}
                    {'☆'.repeat(5 - Math.max(0, Math.min(5, Number(r.rating) || 0)))}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </span>

              </div>
              <p className="text-sm text-gray-700 mt-2">{r.review}</p>
            </div>
          ))}

        {/* Confirm remove favorite */}
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Eliminar de favoritos"
          variant="danger"
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
        <Footer />
      </div>
    </div>
  );
}