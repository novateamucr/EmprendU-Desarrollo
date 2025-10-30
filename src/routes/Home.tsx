import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import footerHero from "../assets/hero-w.png";
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { productApi, categoryApi, entrepreneurshipApi, type Product, type Category } from '../services/entrepreneurshipService';
import { api } from '../lib/api';
import { useProfile, useAddFavorite, useRemoveFavorite } from '../domain/profile/queries';
import type { UserProfile } from '../domain/profile/types';
import { useAuth } from '../context/AuthContext';
import { categoryIconUrl } from '../utils/categoryIcons';
import { Modal } from '../components/Modal';
import FeaturedEntrepreneurOfDay from '../components/FeaturedEntrepreneurOfDay';

  import { 
    Search, 
    Star, 
    Apps,
    Palette,
    Favorite,
    FavoriteBorder
} from '@mui/icons-material';
import { Skeleton } from '@mui/material';
import { SkeletonEntrepreneurCard, SkeletonProductCard } from '../components/ui/Skeleton';
import insta from "../assets/instagram_icon.svg";
import youtube from "../assets/youtube_icon.svg";
import tiktok from "../assets/tiktok_icon.svg";

// Custom hook to fetch all reviews at once
const useReviews = (entrepreneurshipId: string | number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['reviews', entrepreneurshipId],
    queryFn: async () => {
      if (!entrepreneurshipId) return [];
      const res = await fetch(
        `https://emprendu-desarrollo-production.up.railway.app/api/reviews?entrepreneurship_id=${entrepreneurshipId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      if (!res.ok) throw new Error('Error al obtener reviews');
      return res.json();
    },
    enabled: !!entrepreneurshipId, // solo activar si hay id
  });
};

export function BusinessStars({ entrepreneurshipId }: { entrepreneurshipId: number | string }) {
  const { data: reviewsData } = useReviews(entrepreneurshipId);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    if (!reviewsData || reviewsData.length === 0) {
      setAverageRating(null);
      return;
    }

    try {

      const sum = reviewsData.reduce(
        (acc: number, review: any) => acc + (parseFloat(review.rating) || 0), 
        0
      );
      const avg = sum / reviewsData.length;
      setAverageRating(avg);
    } catch (error) {
      console.error('Error calculating average rating:', error);
      setAverageRating(null);
    }
  }, [reviewsData]);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative group">
          <span
            className={`text-sm ${
              averageRating && star <= Math.round(averageRating)
                ? "text-yellow-500"
                : "text-gray-300"
            }`}
          >
            ★
          </span>
        </div>
      ))}
    </div>
  );
}

// Soft animations with Emotion
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.99);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-2px);
  }
`;

// Subtle glow animation for featured cards


// Styled components with softer animations
const AnimatedContainer = styled.div`
  animation: ${fadeInUp} 0.4s ease-out;
  will-change: transform, opacity;
`;

const AnimatedCard = styled.div`
  animation: ${scaleIn} 0.25s ease-out;
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  will-change: transform, box-shadow;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  }
`;

// Glowing card used for the "Emprendimiento del Día" section


const FloatingElement = styled.div`
  animation: ${float} 3s ease-in-out infinite;
`;

const SoftButton = styled.button`
  transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
  will-change: transform, box-shadow;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};


export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'emprendimientos' | 'productos'>('emprendimientos');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedZone, setSelectedZone] = useState('Todas');
  // Infinite entrepreneurships
  const {
    data: entrepPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: entrepStatus,
  } = useInfiniteQuery({
    queryKey: ['entrepreneurships', 'infinite'],
    queryFn: ({ pageParam = 1 }) => entrepreneurshipApi.getAll({ page: pageParam, per_page: 15 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
  const entrepreneurships = useMemo(
    () => (entrepPages?.pages ?? []).flatMap((p: any) => p?.data ?? []),
    [entrepPages]
  );
  const loading = entrepStatus === 'pending';
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  // Categories map for product.category_id -> name
  const { data: allCategories } = useQuery<Category[]>({
    queryKey: ['categories', 'products-view'],
    queryFn: () => categoryApi.getAll(),
    select: (d) => d ?? [],
    staleTime: 5 * 60 * 1000,
  });
  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    (allCategories || []).forEach((c) => { if (c?.id != null) map.set(c.id, c.nombre || c.nombre); });
    return map;
  }, [allCategories]);

  // Map de categoría del emprendimiento (id -> nombre de categoría del negocio)
  const bizCategoryByEntreId = useMemo(() => {
    const m = new Map<number, string>();
    entrepreneurships.forEach((b: any) => {
      m.set(b.id, b?.category_relation?.name || b?.category_relation?.nombre || 'General');
    });
    return m;
  }, [entrepreneurships]);

  // Load user interests from profile (cast to UserProfile to access interests safely)
  const { data: profileData } = useProfile() as unknown as { data?: UserProfile };
  // Favorites support
  const favorites = (profileData?.favorites ?? []) as any[];
  const favByEntreId = useMemo(() => new Map<number, any>(favorites.map((f: any) => [Number(f.entrepreneurship_id), f])), [favorites]);
  const [pendingById, setPendingById] = useState<Record<number, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ favoriteId: number; bizId: number } | null>(null);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const { user: authUser } = useAuth();
  const authInterests: string[] = Array.isArray(authUser?.interests)
    ? (authUser!.interests as any[]).map(i => (typeof i === 'string' ? i : (i?.name ?? i?.interest ?? ''))).filter(Boolean)
    : [];
  // Derive interest names directly from backend (format=names)
  const { data: derivedInterestNames } = useQuery<string[]>({
    queryKey: ['interests', 'home', authUser?.id],
    enabled: !!authUser?.id && !(profileData?.interests && profileData.interests.length > 0) && authInterests.length === 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get('/interests', { params: { user_id: authUser!.id, format: 'names' } }).then(r => r.data);
      const names = Array.isArray(res?.interests) ? res.interests : [];
      return Array.from(new Set(names as string[]));
    }
  });
  // Merge and de-duplicate interests from both sources
  const mergedInterests = Array.from(new Set([...
    ((profileData?.interests ?? []) as string[]),
    ...authInterests,
    ...(derivedInterestNames ?? []),
  ]));
  const userInterests: string[] = mergedInterests;
  const interestsSet = useMemo(() => new Set(userInterests.map(i => removeAccents((i || '').toLowerCase()))), [userInterests]);

  interface CategoriesProps {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
  }
  const Categories: React.FC<CategoriesProps> = ({ selectedCategory, setSelectedCategory }) => {
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
    
    // Fetch categories from backend
    const { data: categoriesData, isLoading: loadingCategories } = useQuery<Category[]>({
      queryKey: ['categories', 'home'],
      queryFn: () => categoryApi.getAll(),
      select: (d) => d ?? [],
      staleTime: 5 * 60 * 1000,
    });
    // Loading states are handled individually for better control

    // Build counts depending on view: products per category or entrepreneurships per category
    const counts = useMemo(() => {
      const map = new Map<string, number>();
      if (viewMode === 'productos') {
        (allProducts || []).forEach((p) => {
          const productCatName = p?.category_id != null
            ? (categoryNameById.get(Number(p.category_id)) || 'General')
            : (bizCategoryByEntreId.get(p.entrepreneurship_id) || 'General');
          map.set(productCatName, (map.get(productCatName) || 0) + 1);
        });
      } else {
        entrepreneurships.forEach((b: any) => {
          const name = b?.category_relation?.name || b?.category_relation?.nombre || 'General';
          map.set(name, (map.get(name) || 0) + 1);
        });
      }
      return map;
    }, [viewMode, entrepreneurships, allProducts, categoryNameById, bizCategoryByEntreId]);
    const totalCount = viewMode === 'productos' ? (allProducts?.length || 0) : entrepreneurships.length;
    // Count items for "Mis intereses"
    const misInteresesCount = useMemo(() => {
      if (!userInterests.length) return 0;
      return Array.from(counts.entries()).reduce((acc, [name, c]) => {
        const normalized = removeAccents((name || '').toLowerCase());
        return acc + (interestsSet.has(normalized) ? c : 0);
      }, 0);
    }, [userInterests.length, counts, interestsSet]);

    // Compose final category list: Todos + Mis intereses (if any) + categories from API
    const categories = useMemo(() => ([
      { name: 'Todos', icon: Apps, count: totalCount },
      ...(
        userInterests.length
          ? [{ name: 'Mis intereses', icon: Star, count: misInteresesCount } as const]
          : []
      ),
      ...((categoriesData || []).map((c: Category) => ({ name: c.name || c.nombre, icon: Palette, count: counts.get(c.nombre || c.nombre) || 0 })))
    ]), [totalCount, userInterests.length, misInteresesCount, categoriesData, counts]);

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Categorías</h2>
  <div className="relative overflow-hidden">
          <div
            ref={categoryScrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth category-scroll w-full"
          >
            {loadingCategories ? (
              <div className="flex gap-3 w-full">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={`skeleton-category-${i}`} className=" w-28 sm:w-40 flex flex-col items-center px-3 py-2">                    
                    <Skeleton variant="text" width="100%" height={60} className="rounded-md" />
                  </div>
                ))}
              </div>
            ) : categories.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-secondary border-border hover:border-brand/50"
                  }`}
                >
                  <img
                    src={categoryIconUrl(category.name, isSelected ? '#FFFFFF' : '#5b98b8')}
                    alt={category.name}
                    className="w-4 h-4"
                  />
                  <span className="font-medium text-sm truncate max-w-[100px] sm:max-w-[140px]">{category.name}</span>
                  <span className="text-xs opacity-75">({category.count})</span>
                </button>
              );
            })}
          </div>


          
        </div>
      </div>
    );
  };


  // Estado para provincia seleccionada
  const [selectedProvince, setSelectedProvince] = useState<string>('Todos');
  // Derive zones from backend data if available (owner.canton or address)
  const zones = [
    ...new Set(
      entrepreneurships
        .map(b => (b as any)?.owner?.canton || (b.address ? 'Zona' : null))
        .filter(Boolean) as string[]
    )
  ];

  // Provincias únicas a partir de owner.province
  const provinces = [
    ...new Set(
      entrepreneurships
        .map(b => (b as any)?.owner?.province || null)
        .filter(Boolean) as string[]
    )
  ];
  

  // Filter businesses by category, search query, and selected zone (backend data)
 const filteredBusinesses = entrepreneurships.filter((business: any) => {
  const categoryName = business?.category_relation?.nombre || '';
  const normalizedCat = removeAccents(categoryName.toLowerCase());
  const isInterestCat = selectedCategory === 'Mis intereses' && interestsSet.size > 0 && interestsSet.has(normalizedCat);
  const matchesCategory = selectedCategory === 'Todos' || categoryName === selectedCategory || isInterestCat;
  const matchesSearch = searchQuery === '' ||
    removeAccents((business.name || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())) ||
    removeAccents((business.description || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())) ||
    removeAccents(categoryName.toLowerCase()).includes(removeAccents(searchQuery.toLowerCase()));
  const businessZone = (business as any)?.owner?.canton || null;
  const matchesZone = selectedZone === 'Todas' || businessZone === selectedZone;
  const businessProvince = (business as any)?.owner?.province || null;
  const matchesProvince = selectedProvince === 'Todos' || businessProvince === selectedProvince;
  return matchesCategory && matchesSearch && matchesZone && matchesProvince;
});


  // Products view placeholder (global products listing not connected yet)
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products', 'all', viewMode],
    queryFn: async () => {
      const res = await productApi.getAll({ per_page: 60 });
      return (res?.data ?? []) as Product[];
    },
    enabled: viewMode === 'productos',
    staleTime: 2 * 60 * 1000,
  });

  const allProducts: Product[] = products ?? [];

  // Filtrado de productos por categoría efectiva del producto
  const filteredProducts: Product[] = allProducts.filter((p) => {
    const effectiveCategoryName = p?.category_id != null
      ? (categoryNameById.get(Number(p.category_id)) || 'General')
      : (bizCategoryByEntreId.get(p.entrepreneurship_id) || 'General');

    // Match por categoría seleccionada
    const matchesCategory = selectedCategory === 'Todos'
      ? true
      : selectedCategory === 'Mis intereses'
        ? interestsSet.has(removeAccents((effectiveCategoryName || '').toLowerCase()))
        : effectiveCategoryName === selectedCategory;

    const matchesSearch =
      searchQuery === '' ||
      removeAccents((p.name || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())) ||
      removeAccents((p.description || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Sugerencias de búsqueda solo para emprendimientos
  const searchSuggestions = searchQuery.length > 0 ? [
    ...new Set(
      viewMode === 'emprendimientos' ? [
        ...entrepreneurships
          .filter(b => removeAccents((b.name || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())))
          .map(b => b.name),
        ...entrepreneurships
          .filter(b => removeAccents((b.category_relation?.nombre || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())))
          .map(b => b.category_relation?.nombre || ''),
        ...entrepreneurships
          .filter(b => removeAccents((b.description || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())))
          .map(b => b.name)
      ] : []
    )
  ].slice(0, 5) : [];


  const filteredSuggestions = searchSuggestions.filter(suggestion =>
  removeAccents(suggestion.toLowerCase()).includes(
    removeAccents(searchQuery.toLowerCase())
  )
);

  return (
    <>
      {/* Main Content */}
      <div className="pt-20 md:pt-24 flex flex-col min-h-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedContainer className="mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2">
            ¡Hola! ¿Qué te gustaría descubrir hoy?
          </h1>
          <p className="text-secondary">
            Explora emprendimientos locales y encuentra productos únicos
          </p>
        </AnimatedContainer>

        {/* Filter Toggle */}
        <AnimatedContainer className="mb-6">
          <div className="flex bg-brand/5 rounded-lg p-1 max-w-full md:max-w-md">
            <SoftButton
              onClick={() => {
                setViewMode('emprendimientos');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                viewMode === 'emprendimientos'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-brand/10'
              }`}
            >
              Emprendimientos
            </SoftButton>
            <SoftButton
              onClick={() => {
                setViewMode('productos');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                viewMode === 'productos'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-brand/10'
              }`}
            >
              Productos
            </SoftButton>
          </div>
        </AnimatedContainer>

        {viewMode === 'emprendimientos' ? (
          <>
            {/* Emprendimiento del Día */}
            {viewMode === 'emprendimientos' && (
  <AnimatedContainer className="mb-8">
    <FeaturedEntrepreneurOfDay entrepreneurships={entrepreneurships} loading={loading} />
  </AnimatedContainer>
)}
              {/* Search Bar + Zone Selector */}
              <div className="mb-8 rounded-lg">
                <h2 className="text-base font-semibold text-primary mb-2">Buscar emprendimientos</h2>

                <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                  {/* Search Bar (un poco más largo) */}
                  <div className="relative flex-[1] w-full">
                    <Search
                      sx={{ fontSize: 20 }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary"
                    />
                    <input
                      type="text"
                      placeholder="Buscar emprendimientos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full pl-12 pr-4 py-3 md:py-4 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white md:text-base lg:text-base text-sm"
                    />
                    {/* Search Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <AnimatedContainer className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-brand/10 transition-colors border-b border-border last:border-b-0 flex items-center gap-3"
                          >
                            <Search sx={{ fontSize: 16 }} className="text-secondary" />
                            <span className="text-primary">{suggestion}</span>
                          </button>
                        ))}
                      </AnimatedContainer>
                    )}
                  </div>

                  {/* Province Selector */}
                  <div className="w-full md:w-52 relative">
                    <select
                      value={selectedProvince || 'Todos'}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 pr-10 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white appearance-none md:text-base lg:text-base text-sm before:"
                    >
                      <option value="Todos">Todas las provincias</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Zone Selector */}
                  <div className="w-full md:w-52 relative">
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 pr-10 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white appearance-none md:text-base lg:text-base text-sm"
                    >
                      <option value="Todas">Todos los cantones</option>
                      {zones.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>



            {/* Categories */}
            <Categories
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Featured Businesses */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Apps sx={{ fontSize: 20 }} />
                  {selectedCategory === 'Todos' ? 'Emprendimientos' : `Categoría: ${selectedCategory}`}
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <SkeletonEntrepreneurCard key={`skeleton-entrepreneur-${index}`} />
                  ))}
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business: any) => (
                  (() => {
                    
                    return (
                      <Link
                        key={business.id}
                        to={`/business/${business.id}`}
                        className="block"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
                      >
                        <AnimatedCard className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col">
                          <div className="aspect-square bg-gray-50 relative overflow-hidden">
                            <img
                              src={business.image_url || 'https://placehold.co/600x600?text=Sin+imagen'}
                              alt={business.name || 'Imagen del emprendimiento'}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{business.name}</h3>
                              <button
                                className="text-secondary hover:text-brand transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const bizId = Number(business.id);
                                  const existing = favByEntreId.get(bizId);
                                  if (existing?.id) {
                                    setPendingRemove({ favoriteId: existing.id, bizId });
                                    setConfirmOpen(true);
                                  } else {
                                    setPendingById((p) => ({ ...p, [bizId]: true }));
                                    addFav.mutate(bizId, {
                                      onSettled: () => setPendingById((p) => ({ ...p, [bizId]: false })),
                                    });
                                  }
                                }}
                                disabled={pendingById[Number(business.id)]}
                                aria-label={favByEntreId.has(Number(business.id)) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                              >
                                {favByEntreId.has(Number(business.id)) ? (
                                  <Favorite sx={{ fontSize: 18 }} className="text-[#0A5B7A]" />
                                ) : (
                                  <FavoriteBorder sx={{ fontSize: 18 }} />
                                )}
                              </button>
                            </div>
                            <p className="text-gray-600 text-xs mb-3 line-clamp-2">{business.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-1 text-secondary">
                                <BusinessStars entrepreneurshipId={Number(business.id)} />
                              </div>
                              <span className="bg-brand/5 text-secondary px-2 py-1 rounded text-xs">
                                {business.category_relation?.nombre || 'General'}
                              </span>
                            </div>
                          </div>
                        </AnimatedCard>
                      </Link>
                    );
                  })()
                ))}
              </div>
              )}
              {hasNextPage && (
                <div ref={loadMoreRef} className="mt-6 h-10 flex items-center justify-center text-secondary text-sm">
                  {isFetchingNextPage ? 'Cargando más…' : 'Desplázate para cargar más'}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Categories */}
            <Categories
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Popular Products */}
            <AnimatedContainer className="mb-6">
              <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
                <FloatingElement>
                  <Star sx={{ fontSize: 20 }} />
                </FloatingElement>
                Productos Populares
              </h2>
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <SkeletonProductCard key={`skeleton-product-${index}`} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="block"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
                    >
                      <AnimatedCard>
                    <ProductCard
                      title={product.name}
                      description={product.description || ''}
                      price={product.price}
                      imgUrl={product.image_url || 'https://placehold.co/600x600?text=Sin+imagen'}
                      categoryName={product?.category_id != null ? (categoryNameById.get(Number(product.category_id)) || 'General') : undefined}
                      productId={String(product.id)}
                      entrepreneurshipId={String(product.entrepreneurship_id)}
                      entrepreneurshipName={product.entrepreneurship?.name || (entrepreneurships.find((e: any) => e.id === product.entrepreneurship_id)?.name ?? 'Emprendimiento')}
                    />
                  </AnimatedCard>
                    </Link>
                  ))}
                </div>
              )}
            </AnimatedContainer>
          </>
        )}
        {/* Bottom spacer to separate last content from footer */}
  <div className="h-4 md:h-6" />
        </div>
        {/* Footer */}
        <footer id="contacto" className="bg-brand text-white py-6 rounded-t-2xl w-full">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 border-b border-white pb-4 w-full">
              <div className="flex align-middle items-center gap-4 md:gap-6">
                <img src={footerHero} alt="Logo" className="w-8 p-1 rounded-full" />
                <a href="/faqs" className="text-white text-sm">Preguntas frecuentes</a>
                <a href="/contactUs" className="text-white text-sm">Contáctanos</a>
              </div>
              <div className="flex gap-4 md:gap-6">
                <a href="https://www.instagram.com/emprendecr_nova?igsh=cmhjbndjYzVhZmQy"><img src={insta} alt="instagram" className=" h-8" /></a>
                <a href="https://youtube.com/@novateam-s3l4x?si=FIbBSBjPS5_3a1Ks"><img src={youtube} alt="youtube" className=" h-7" /></a>
                <a href="https://www.tiktok.com/@emprendecr?_t=ZM-90dL2vVlq0G&_r=1"><img src={tiktok} alt="tiktok" className=" h-7"/></a>
              </div>
            </div>
            <p className="text-sm text-center mt-4">© 2025 EmprendU. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
      {/* Confirm remove favorite (Home) */}
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
                  const { favoriteId, bizId } = pendingRemove;
                  setPendingById((p) => ({ ...p, [bizId]: true }));
                  removeFav.mutate(favoriteId, {
                    onSettled: () => setPendingById((p) => ({ ...p, [bizId]: false })),
                  });
                }
                setConfirmOpen(false);
                setPendingRemove(null);
              }}
              className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brandDark"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
