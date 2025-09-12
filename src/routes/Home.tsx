import { useState } from 'react';
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
  FavoriteBorder
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

const GlowingCard = styled.div`
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
  will-change: transform, box-shadow;
  
  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(59, 130, 246, 0.08);
    transform: translateY(-1px);
  }
`;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [viewMode, setViewMode] = useState<'emprendimientos' | 'productos'>('emprendimientos');
  const [showSuggestions, setShowSuggestions] = useState(false);


  const categories = [
    { name: 'Todos', icon: Apps, count: 120 },
    { name: 'Comida', icon: Restaurant, count: 45 },
    { name: 'Joyería', icon: Diamond, count: 23 },
    { name: 'Ropa', icon: Checkroom, count: 18 },
    { name: 'Arte', icon: Palette, count: 15 },
    { name: 'Tecnología', icon: Computer, count: 12 },
    { name: 'Deportes', icon: SportsBaseball, count: 7 }
  ];

  const featuredBusinesses = [
    {
      id: 1,
      name: "Café Luna",
      description: "Café artesanal con granos locales y ambiente acogedor",
      category: "Comida",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&h=300&fit=crop",
      products: [
        {
          title: "Café Especial",
          description: "Mezcla única de granos tostados artesanalmente",
          price: 3500,
          imgUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop"
        },
        {
          title: "Pastel de Chocolate",
          description: "Delicioso pastel casero con chocolate belga",
          price: 2800,
          imgUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"
        }
      ]
    },
    {
      id: 2,
      name: "Artesanías Bella",
      description: "Productos hechos a mano con materiales sostenibles",
      category: "Arte",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=300&fit=crop",
      products: [
        {
          title: "Maceta Decorativa",
          description: "Maceta de cerámica pintada a mano",
          price: 8500,
          imgUrl: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop"
        }
      ]
    },
    {
      id: 3,
      name: "Tech Solutions",
      description: "Soluciones tecnológicas innovadoras para empresas",
      category: "Tecnología",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop",
      products: [
        {
          title: "App Móvil",
          description: "Desarrollo de aplicaciones móviles personalizadas",
          price: 150000,
          imgUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop"
        }
      ]
    },
    {
      id: 4,
      name: "Joyería Elegante",
      description: "Joyas únicas diseñadas con piedras preciosas",
      category: "Joyería",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=300&fit=crop",
      products: [
        {
          title: "Collar de Plata",
          description: "Collar artesanal de plata 925 con diseño único",
          price: 15000,
          imgUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop"
        }
      ]
    }
  ];

  // Filter businesses by category and search query
  const filteredBusinesses = featuredBusinesses.filter(business => {
    const matchesCategory = selectedCategory === 'Todos' || business.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter products by category and search query for products view
  const filteredProducts = featuredBusinesses
    .filter(business => selectedCategory === 'Todos' || business.category === selectedCategory)
    .flatMap(business => 
      business.products.filter(product => 
        searchQuery === '' ||
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(product => ({ ...product, businessName: business.name, businessCategory: business.category }))
    );

  // Generate search suggestions based on current view mode
  const searchSuggestions = searchQuery.length > 0 ? [
    ...new Set(
      viewMode === 'emprendimientos' ? [
        // Suggest business names
        ...featuredBusinesses
          .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(b => b.name),
        // Suggest categories
        ...featuredBusinesses
          .filter(b => b.category.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(b => b.category),
        // Suggest business descriptions
        ...featuredBusinesses
          .filter(b => b.description.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(b => b.name)
      ] : [
        // Suggest product titles
        ...featuredBusinesses
          .flatMap(b => b.products)
          .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(p => p.title),
        // Suggest product descriptions
        ...featuredBusinesses
          .flatMap(b => b.products)
          .filter(p => p.description.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(p => p.title),
        // Suggest categories for products
        ...featuredBusinesses
          .filter(b => b.category.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(b => b.category)
      ]
    )
  ].slice(0, 5) : [];

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
          <div className="flex bg-gray-100 rounded-lg p-1 max-w-md">
            <SoftButton
              onClick={() => {
                setViewMode('emprendimientos');
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                viewMode === 'emprendimientos'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
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
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Productos
            </SoftButton>
          </div>
        </AnimatedContainer>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search sx={{ fontSize: 20 }} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder={`Buscar ${viewMode}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-12 pr-4 py-3 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
            
            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <AnimatedContainer className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                  >
                    <Search sx={{ fontSize: 16 }} className="text-gray-400" />
                    <span className="text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </AnimatedContainer>
            )}
          </div>
        </div>

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
              <GlowingCard className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-32 md:h-32 w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop" 
                      alt="HASU"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">HASU</h3>
                      <div className="flex items-center gap-1">
                        <Star sx={{ fontSize: 16 }} className="text-amber-500" />
                        <span className="text-sm text-gray-600">4.8</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      Flores eternas hechas a mano, detalles hermosos para regalar en ocasiones especiales. 
                      Cada pieza es única y creada con amor y dedicación.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="bg-white text-gray-700 px-3 py-1 rounded-full text-xs border flex items-center gap-1">
                        <Palette sx={{ fontSize: 12 }} />
                        Arte
                      </span>
                      <Link 
                        to="/feed/emprendimiento"
                        className="text-gray-900 hover:text-gray-700 text-sm font-medium"
                      >
                        Ver emprendimiento →
                      </Link>
                    </div>
                  </div>
                </div>
              </GlowingCard>
            </AnimatedContainer>

            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-primary mb-4">Categorías</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-card border transition-all ${
                        selectedCategory === category.name
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      <IconComponent sx={{ fontSize: 16 }} />
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs opacity-75">({category.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Businesses */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Apps sx={{ fontSize: 20 }} />
                  {selectedCategory === 'Todos' ? 'Emprendimientos Destacados' : `Categoría: ${selectedCategory}`}
                </h2>
                <Link 
                  to="/feed/emprendimiento"
                  className="text-primary hover:text-primary/80 font-medium text-sm"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business, index) => (
                  <AnimatedCard key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={business.image} 
                        alt={business.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{business.name}</h3>
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <FavoriteBorder sx={{ fontSize: 18 }} />
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{business.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star sx={{ fontSize: 14 }} className="text-amber-500" />
                          <span className="text-sm text-gray-600">{business.rating}</span>
                        </div>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {business.category}
                        </span>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Categories */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-primary mb-4">Categorías</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-card border transition-all ${
                        selectedCategory === category.name
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-secondary border-border hover:border-primary/50'
                      }`}
                    >
                      <IconComponent sx={{ fontSize: 16 }} />
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs opacity-75">({category.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

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