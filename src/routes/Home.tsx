import { useState, useRef, useEffect } from 'react';
import useEntrepreneurships from '../hooks/useEntrepreneurships';

import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProductCard } from '../components/ProductCard';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { 
  Search, 
  Star, 
  Apps,
  Restaurant,
  Diamond,
  Checkroom,
  Palette,
  Computer,
  SportsBaseball,
  FavoriteBorder,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';


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
const glow = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

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
const GlowingCard = styled.div`
  position: relative;
  border-radius: 0.5rem;
  animation: ${scaleIn} 0.25s ease-out;
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  will-change: transform, box-shadow;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: radial-gradient(120% 120% at 0% 0%, rgba(16, 185, 129, 0.18), transparent 60%),
                radial-gradient(120% 120% at 100% 100%, rgba(59, 130, 246, 0.18), transparent 60%);
    filter: blur(10px);
    z-index: -1;
    pointer-events: none;
    animation: ${glow} 4s ease-in-out infinite;
  }
`;

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
  const { entrepreneurships, loading } = useEntrepreneurships();

  interface CategoriesProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}
const Categories: React.FC<CategoriesProps> = ({ selectedCategory, setSelectedCategory }) => {
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const categories = [
    { name: 'Todos', icon: Apps, count: 120 },
    { name: 'Comida', icon: Restaurant, count: 45 },
    { name: 'Joyería', icon: Diamond, count: 23 },
    { name: 'Ropa', icon: Checkroom, count: 18 },
    { name: 'Arte', icon: Palette, count: 15 },
    { name: 'Tecnología', icon: Computer, count: 12 },
    { name: 'Deportes', icon: SportsBaseball, count: 7 }
  ];
  const scrollCategories = (direction: "left" | "right") => {
    if (!categoryScrollRef.current) return;
    const scrollAmount = 220;
    categoryScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  const checkScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
  };

  useEffect(() => {
    checkScroll();
    const ref = categoryScrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      ref?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-primary mb-4">Categorías</h2>
      <div className="relative overflow-hidden">
        {showLeftArrow && (
          <button
            onClick={() => scrollCategories("left")}
            aria-label="Anterior categorías"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full shadow z-20 hover:bg-brand/10 transition-colors focus-brand"
          >
            <ChevronLeft sx={{ fontSize: 20 }} />
          </button>
        )}

        <div
          ref={categoryScrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-8 category-scroll"
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  selectedCategory === category.name
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-secondary border-border hover:border-brand/50"
                }`}
              >
                <IconComponent sx={{ fontSize: 16 }} />
                <span className="font-medium">{category.name}</span>
                <span className="text-xs opacity-75">({category.count})</span>
              </button>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scrollCategories("right")}
            aria-label="Siguiente categorías"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full shadow z-20 hover:bg-brand/10 transition-colors focus-brand"
          >
            <ChevronRight sx={{ fontSize: 20 }} />
          </button>
        )}
      </div>
    </div>
  );
};


  // Derive zones from backend data if available (owner.canton or address)
  const zones = [
    ...new Set(
      entrepreneurships
        .map(b => (b as any)?.owner?.canton || (b.address ? 'Zona' : null))
        .filter(Boolean) as string[]
    )
  ];
  

  // Filter businesses by category, search query, and selected zone (backend data)
 const filteredBusinesses = entrepreneurships.filter((business: any) => {
  const categoryName = business?.category_relation?.nombre || '';
  const matchesCategory = selectedCategory === 'Todos' || categoryName === selectedCategory;
  const matchesSearch = searchQuery === '' ||
    removeAccents((business.name || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())) ||
    removeAccents((business.description || '').toLowerCase()).includes(removeAccents(searchQuery.toLowerCase())) ||
    removeAccents(categoryName.toLowerCase()).includes(removeAccents(searchQuery.toLowerCase()));
  const businessZone = (business as any)?.owner?.canton || null;
  const matchesZone = selectedZone === 'Todas' || businessZone === selectedZone;
  return matchesCategory && matchesSearch && matchesZone;
});


  // Products view placeholder (global products listing not connected yet)
  const filteredProducts: any[] = [];

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
    <Layout>
      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <AnimatedContainer className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
            ¡Hola! ¿Qué te gustaría descubrir hoy?
          </h1>
          <p className="text-secondary">
            Explora emprendimientos locales y encuentra productos únicos
          </p>
        </AnimatedContainer>

        {/* Filter Toggle */}
        <AnimatedContainer className="mb-6">
          <div className="flex bg-brand/5 rounded-lg p-1 max-w-md">
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
            <AnimatedContainer className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                <FloatingElement>
                  <Diamond sx={{ fontSize: 20 }} />
                </FloatingElement>
                Emprendimiento del Día
              </h2>
              <GlowingCard className="bg-gradient-to-r from-brand/5 to-white rounded-lg p-6 border border-border">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-32 md:h-32 w-full h-48 bg-brand/10 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={(filteredBusinesses[0] ?? entrepreneurships[0])?.image_url || "https://placehold.co/400x300?text=Sin+imagen"} 
                      alt={(filteredBusinesses[0] ?? entrepreneurships[0])?.name || "Emprendimiento"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-primary">{(filteredBusinesses[0] ?? entrepreneurships[0])?.name || "Emprendimiento"}</h3>
                      <div className="flex items-center gap-1">
                        <Star sx={{ fontSize: 16 }} className="text-amber-500" />
                        <span className="text-sm text-secondary">-</span>
                      </div>
                    </div>
                    <p className="text-secondary text-sm mb-3">
                      {(filteredBusinesses[0] ?? entrepreneurships[0])?.description || "Descubre productos únicos de nuestro emprendimiento destacado."}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="bg-white text-secondary px-3 py-1 rounded-full text-xs border flex items-center gap-1">
                        <Palette sx={{ fontSize: 12 }} />
                        {(filteredBusinesses[0] ?? entrepreneurships[0])?.category_relation?.nombre || "General"}
                      </span>
                      <Link 
                        to={`/feed/emprendimiento/${(filteredBusinesses[0] ?? entrepreneurships[0])?.id ?? ''}`}
                        className="text-brand hover:text-brandDark text-sm font-medium"
                      >
                        Ver emprendimiento →
                      </Link>
                    </div>
                  </div>
                </div>
              </GlowingCard>
            </AnimatedContainer>

            {/* Search Bar + Zone Selector */}
            <div className="mb-8  rounded-lg ">
              <h2 className="text-lg font-semibold text-primary mb-4">Buscar emprendimientos</h2>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <div className="relative flex-1 w-full">
                  <Search sx={{ fontSize: 20 }} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar emprendimientos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full pl-12 pr-4 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
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
                {/* Zone Selector */}
                <div className="w-full md:w-64">
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-3 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    <option value="Todas">Todas las zonas</option>
                    {zones.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
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
                <div className="text-secondary">Cargando emprendimientos...</div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business: any) => (
                  <Link 
                    key={business.id} 
                    to={`/feed/emprendimiento/${business.id}`} 
                    className="block"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
                  >
                    <AnimatedCard className="bg-white rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-48 bg-brand/10 overflow-hidden">
                        <img 
                          src={business.image_url || "https://placehold.co/600x300?text=Sin+imagen"} 
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-primary">{business.name}</h3>
                          <button className="text-secondary hover:text-red-500 transition-colors">
                            <FavoriteBorder sx={{ fontSize: 18 }} />
                          </button>
                        </div>
                        <p className="text-secondary text-sm mb-3">{business.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star sx={{ fontSize: 14 }} className="text-amber-500" />
                            <span className="text-sm text-secondary">-</span>
                          </div>
                          <span className="bg-brand/5 text-secondary px-2 py-1 rounded text-xs">
                            {business.category_relation?.nombre || 'General'}
                          </span>
                        </div>
                      </div>
                    </AnimatedCard>
                  </Link>
                ))}
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
            <AnimatedContainer>
              <h2 className="text-xl font-semibold text-primary mb-6 flex items-center gap-2">
                <FloatingElement>
                  <Star sx={{ fontSize: 20 }} />
                </FloatingElement>
                Productos Populares
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <AnimatedCard key={`${product.businessName}-${index}`}>
                    <ProductCard
                      title={product.title}
                      description={product.description}
                      price={product.price}
                      imgUrl={product.imgUrl}
                      onBuy={() => alert(`Compraste: ${product.title}`)}
                    />
                  </AnimatedCard>
                ))}
              </div>
            </AnimatedContainer>
          </>
        )}
      </div>
    </Layout>
  );
}
