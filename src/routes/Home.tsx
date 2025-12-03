import React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import footerHero from "../assets/hero-w.png";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import {
  productApi,
  categoryApi,
  entrepreneurshipApi,
  type Product,
  type Category,
} from "../services/entrepreneurshipService";
import { api } from "../lib/api";
import {
  useProfile,
  useAddFavorite,
  useRemoveFavorite,
} from "../domain/profile/queries";
import type { UserProfile } from "../domain/profile/types";
import { useAuth } from "../context/AuthContext";
import { categoryColor, categoryIconUrl } from "../utils/categoryIcons";
import { Modal } from "../components/Modal";
import FeaturedEntrepreneurOfDay from "../components/FeaturedEntrepreneurOfDay";
import {
  Search,
  Star,
  Apps,
  Palette,
  Diamond,
  Favorite,
  FavoriteBorder,
  Restaurant,
  Fastfood,
  Cake,
  LocalBar,
  LocalCafe,
  Icecream,
  LocalPizza,
  DinnerDining,
  RamenDining,
  RestaurantMenu,
  SetMeal,
  LunchDining,
  BreakfastDining,
  OutdoorGrill,
  SportsBar,
} from "@mui/icons-material";
import { Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import { Skeleton } from "@mui/material";
import {
  SkeletonEntrepreneurCard,
  SkeletonFeaturedEntrepreneur,
  SkeletonProductCard,
} from "../components/ui/Skeleton";
import { TopProductsSidebar } from "../components/TopProductsSidebar";

// Custom hook to fetch all reviews at once




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

interface CategoriesProps {
  categories: {
    name: string;
    count: number;
    color: string;
  }[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  loading: boolean;
}

const Categories = React.memo(({ categories, selectedCategory, setSelectedCategory, loading }: CategoriesProps) => {
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="mb-8" id="categories-section">
      <h2 className="text-xl md:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-primary dark:text-white mb-6 flex items-center gap-2">
        <FloatingElement>
          <Apps sx={{ fontSize: 24 }} />
        </FloatingElement>
        Categorías
      </h2>
      <div className="relative">
        <div
          ref={categoryScrollRef}
          className="flex gap-2 pb-2 overflow-x-auto scrollbar-hide scroll-smooth w-full"
        >
          {loading ? (
            <div className="flex gap-3 w-full">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={`skeleton-category-${i}`}
                  className="w-28 sm:w-40 flex flex-col items-center px-3 py-2"
                >
                  <Skeleton
                    variant="rounded"
                    width="100%"
                    height={48}
                    className="rounded-full"
                  />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="w-full text-center py-4 text-gray-500">
              No hay categorías disponibles
            </div>
          ) : (
            categories.map((category) => {
              const categoryName =
                String(category.name || "").trim() || "General";
              const isSelected = selectedCategory === categoryName;
              const iconColor = isSelected
                ? "#FFFFFF"
                : category.color || "#5b98b8";

              // Build classNames and styles for selected vs unselected states
              const baseClass =
                "flex-shrink-0 flex items-center gap-2 px-4 py-2 4xl:px-6 4xl:py-3 rounded-full transition-all duration-200";

              if (isSelected) {
                return (
                  <button
                    key={categoryName}
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`${baseClass} shadow-md border`}
                    style={{
                      backgroundColor: category.color || "#4F46E5",
                      color: "#FFFFFF",
                      borderColor: category.color || "#4F46E5",
                    }}
                  >
                    <img
                      src={categoryIconUrl(categoryName, "#FFFFFF")}
                      alt={categoryName}
                      className="w-4 h-4 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6 flex-shrink-0"
                    />
                    <span className="font-medium text-sm 3xl:text-base 4xl:text-xl whitespace-nowrap">
                      {categoryName}
                    </span>
                    <span className="text-xs 3xl:text-sm 4xl:text-lg font-medium opacity-80 text-white/90">
                      ({category.count})
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={categoryName}
                  onClick={() => setSelectedCategory(categoryName)}
                  className={`${baseClass} hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-cardDark text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-cardDark`}
                >
                  <img
                    src={categoryIconUrl(categoryName, iconColor)}
                    alt={categoryName}
                    className="w-4 h-4 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6 flex-shrink-0"
                  />
                  <span className="font-medium text-sm 3xl:text-base 4xl:text-xl whitespace-nowrap">
                    {categoryName}
                  </span>
                  <span className="text-xs 3xl:text-sm 4xl:text-lg font-medium opacity-80">
                    ({category.count})
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"emprendimientos" | "productos">(
    "emprendimientos"
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedZone, setSelectedZone] = useState("Todas");
  // Infinite entrepreneurships
  const {
    data: entrepPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: entrepStatus,
  } = useInfiniteQuery({
    queryKey: ["entrepreneurships", "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      entrepreneurshipApi.getAll({ page: pageParam, per_page: 15 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      return lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
  const entrepreneurships = useMemo(
    () => (entrepPages?.pages ?? []).flatMap((p: any) => p?.data ?? []),
    [entrepPages]
  );
  const loading = entrepStatus === "pending";
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  // Fetch all categories with their details
  const { data: allCategories, isLoading: isLoadingCategories } = useQuery<
    Category[]
  >({
    queryKey: ["all-categories"],
    queryFn: async () => {
      try {
        const response = await categoryApi.getAll();
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create a map of category IDs to their full category objects
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    if (allCategories) {
      allCategories.forEach((category) => {
        if (category?.id != null) {
          map.set(category.id, category);
        }
      });
    }
    return map;
  }, [allCategories]);

  // Map de categoría del emprendimiento (id -> { name, color })
  const bizCategoryInfo = useMemo(() => {
    const businessCategoryMap = new Map<
      number,
      { name: string; color: string }
    >();

    // Process each entrepreneurship to extract category information
    entrepreneurships.forEach((biz: any) => {
      let categoryName = "General";
      let categoryId: number | null = null;
      let category: Category | null = null;

      // Check if category is directly on the business object
      if (biz.category) {
        if (typeof biz.category === "object" && biz.category.id) {
          // If category is an object with id and name
          categoryId = biz.category.id;
          categoryName = biz.category.name || "General";
        } else if (typeof biz.category === "string") {
          // If category is a string, use it as the name
          categoryName = biz.category;
        } else if (typeof biz.category === "number") {
          // If category is a number, try to look it up
          categoryId = biz.category;
          category = categoryMap.get(categoryId) || null;
          categoryName = category?.name || `Categoría ${categoryId}`;
        }
      }
      // Fallback to category_relation if category is not found
      else if (biz?.category_relation) {
        categoryName = biz.category_relation.name || "General";
        categoryId = biz.category_relation.id || null;
      }

      // If we found a valid category, use its name
      if (category) {
        categoryName = category.nombre || categoryName;
      }

      // Assign a color using centralized categoryColor util (keeps colors consistent with ProductCard)
      const color = categoryColor(categoryName || "General");

      // Map this business to its category info
      businessCategoryMap.set(biz.id, {
        name: categoryName,
        color,
      });
    });

    return businessCategoryMap;
  }, [entrepreneurships, categoryMap]);

  // Helper function to generate consistent hash codes
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // Load user interests from profile (cast to UserProfile to access interests safely)
  const { data: profileData } = useProfile() as unknown as {
    data?: UserProfile;
  };
  // Favorites support
  const favorites = (profileData?.favorites ?? []) as any[];
  const favByEntreId = useMemo(
    () =>
      new Map<number, any>(
        favorites.map((f: any) => [Number(f.entrepreneurship_id), f])
      ),
    [favorites]
  );
  const [pendingById, setPendingById] = useState<Record<number, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    favoriteId: number;
    bizId: number;
  } | null>(null);
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const { user: authUser } = useAuth();
  const authInterests: string[] = Array.isArray(authUser?.interests)
    ? (authUser!.interests as any[])
      .map((i) => (typeof i === "string" ? i : i?.name ?? i?.interest ?? ""))
      .filter(Boolean)
    : [];
  // Derive interest names directly from backend (format=names)
  const { data: derivedInterestNames } = useQuery<string[]>({
    queryKey: ["interests", "home", authUser?.id],
    enabled:
      !!authUser?.id &&
      !(profileData?.interests && profileData.interests.length > 0) &&
      authInterests.length === 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api
        .get("/interests", {
          params: { user_id: authUser!.id, format: "names" },
        })
        .then((r) => r.data);
      const names = Array.isArray(res?.interests) ? res.interests : [];
      return Array.from(new Set(names as string[]));
    },
  });
  // Merge and de-duplicate interests from both sources
  const mergedInterests = Array.from(
    new Set([
      ...((profileData?.interests ?? []) as string[]),
      ...authInterests,
      ...(derivedInterestNames ?? []),
    ])
  );
  const userInterests: string[] = mergedInterests;
  const interestsSet = useMemo(
    () =>
      new Set(userInterests.map((i) => removeAccents((i || "").toLowerCase()))),
    [userInterests]
  );

  // Estado para provincia seleccionada
  const [selectedProvince, setSelectedProvince] = useState<string>("Todos");

  // Derive zones from backend data if available (owner.canton or address)
  const zones = [
    ...new Set(
      entrepreneurships
        .map((b) => (b as any)?.owner?.canton || (b.address ? "Zona" : null))
        .filter(Boolean) as string[]
    ),
  ];

  // Provincias únicas a partir de owner.province
  const provinces = [
    ...new Set(
      entrepreneurships
        .map((b) => (b as any)?.owner?.province || null)
        .filter(Boolean) as string[]
    ),
  ];

  // Products view placeholder (global products listing not connected yet)
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["products", "all", viewMode],
    queryFn: async () => {
      const res = await productApi.getAll({ per_page: 60 });
      return (res?.data ?? []) as Product[];
    },
    enabled: viewMode === "productos",
    staleTime: 2 * 60 * 1000,
  });

  const allProducts: Product[] = products ?? [];

  // Build counts depending on view: products per category or entrepreneurships per category
  const counts = useMemo(() => {
    const map = new Map<string, number>();

    if (viewMode === "productos") {
      // For products view, get categories from products
      const productCategories = new Map<string, number>();

      (allProducts || []).forEach((p: any) => {
        // Get category from product's category_id if available, otherwise from its entrepreneurship
        let categoryName = "General";

        if (p.category_id && categoryMap.has(Number(p.category_id))) {
          const category = categoryMap.get(Number(p.category_id));
          categoryName = category?.name || "General";
        } else if (p.entrepreneurship_id) {
          const biz = entrepreneurships.find(
            (e: any) => e.id === p.entrepreneurship_id
          );
          if (biz?.category) {
            if (typeof biz.category === "object" && biz.category.name) {
              categoryName = biz.category.name;
            } else if (typeof biz.category === "string") {
              categoryName = biz.category;
            }
          }
        }

        productCategories.set(
          categoryName,
          (productCategories.get(categoryName) || 0) + 1
        );
      });

      // Add all product categories to the main map
      productCategories.forEach((count, name) => map.set(name, count));
    } else {
      // For businesses view, count entrepreneurships per category
      const businessCategories = new Map<string, number>();

      entrepreneurships.forEach((b: any) => {
        let categoryName = "General";

        if (b.category) {
          if (typeof b.category === "object" && b.category.name) {
            categoryName = b.category.name;
          } else if (typeof b.category === "string") {
            categoryName = b.category;
          } else if (
            typeof b.category === "number" &&
            categoryMap.has(b.category)
          ) {
            const category = categoryMap.get(b.category);
            categoryName = category?.name || "General";
          }
        } else if (b.category_relation) {
          categoryName = b.category_relation.name || "General";
        }

        businessCategories.set(
          categoryName,
          (businessCategories.get(categoryName) || 0) + 1
        );
      });

      // Add all business categories to the main map
      businessCategories.forEach((count, name) => map.set(name, count));
    }

    return map;
  }, [viewMode, entrepreneurships, allProducts, bizCategoryInfo, categoryMap]);

  const totalCount =
    viewMode === "productos"
      ? allProducts?.length || 0
      : entrepreneurships.length;

  // Count items for "Intereses"
  const misInteresesCount = useMemo(() => {
    if (!userInterests.length) return 0;
    return Array.from(counts.entries()).reduce((acc, [name, c]) => {
      const normalized = removeAccents((name || "").toLowerCase());
      return acc + (interestsSet.has(normalized) ? c : 0);
    }, 0);
  }, [userInterests.length, counts, interestsSet]);

  // Count items for "Favoritos"
  const favoritosCount = useMemo(() => {
    if (viewMode === "productos") {
      return (allProducts || []).filter((p) =>
        favByEntreId.has(Number(p.entrepreneurship_id))
      ).length;
    } else {
      return entrepreneurships.filter((b) =>
        favByEntreId.has(Number(b.id))
      ).length;
    }
  }, [viewMode, allProducts, entrepreneurships, favByEntreId]);

  // Compose final category list
  const categories = useMemo(() => {
    // First, collect all unique category names and their counts from bizCategoryInfo
    const categoryCounts = new Map<
      string,
      { count: number; color: string; icon: any }
    >();

    // Count occurrences of each category using bizCategoryInfo
    entrepreneurships.forEach((b: any) => {
      const categoryInfo = bizCategoryInfo.get(b.id) || {
        name: "General",
        color: "#4F46E5",
        icon: Palette,
      };

      const categoryName = categoryInfo.name;
      const existing = categoryCounts.get(categoryName);

      if (existing) {
        existing.count++;
      } else {
        categoryCounts.set(categoryName, {
          count: 1,
          color: categoryInfo.color,
          icon: categoryInfo.icon || Palette,
        });
      }
    });

    const categoryItems = Array.from(categoryCounts.entries()).map(
      ([name, { count, color }]) => ({
        name,
        count,
        color,
      })
    );

    const allCats = [
      {
        name: "Todos",
        count: totalCount,
        color: "#4F46E5",
      },
      ...(userInterests.length > 0
        ? [
          {
            name: "Intereses",
            count: misInteresesCount,
            color: "#D97706",
          },
        ]
        : []),
      ...(favorites.length > 0
        ? [
          {
            name: "Favoritos",
            count: favoritosCount,
            color: "#E11D48",
          },
        ]
        : []),
      ...categoryItems
        .filter((cat) => cat.count > 0)
        .map((cat) => ({
          ...cat,
          color: categoryColor(cat.name) || "#6B7280",
        }))
        .sort((a, b) => b.count - a.count),
    ];

    if (allCats.every((cat) => cat.count === 0)) {
      return [];
    }

    return allCats;
  }, [
    totalCount,
    userInterests.length,
    misInteresesCount,
    entrepreneurships,
    bizCategoryInfo,
    favoritosCount,
    favorites.length,
  ]);
  const filteredBusinesses = useMemo(() => {
    return entrepreneurships.filter((business: any) => {
      // Get the category name from bizCategoryInfo which has the correct mapping
      const categoryInfo = bizCategoryInfo.get(business.id) || {
        name: "General",
      };
      // Ensure categoryName is always a string
      const categoryName = String(categoryInfo.name || "General").trim();
      const normalizedCat = removeAccents(categoryName.toLowerCase());
      const normalizedSearch = searchQuery
        ? removeAccents(String(searchQuery).toLowerCase())
        : "";

      // Match by selected category
      const matchesCategory =
        selectedCategory === "Todos" ||
        (selectedCategory === "Intereses"
          ? interestsSet.has(normalizedCat)
          : selectedCategory === "Favoritos"
            ? favByEntreId.has(Number(business.id))
            : normalizedCat === removeAccents(selectedCategory.toLowerCase()));

      // Match by search query
      const matchesSearch =
        searchQuery === "" ||
        removeAccents((business.name || "").toLowerCase()).includes(
          normalizedSearch
        ) ||
        removeAccents((business.description || "").toLowerCase()).includes(
          normalizedSearch
        ) ||
        normalizedCat.includes(normalizedSearch);

      // Match by selected province (if any)
      const matchesProvince =
        selectedProvince === "Todos" ||
        (business.owner?.province || "").toLowerCase() ===
        selectedProvince.toLowerCase();

      // Match by selected zone/canton (if any)
      // Note: selectedZone default value is "Todas"
      const matchesCanton =
        selectedZone === "Todas" ||
        (business.owner?.canton || "").toLowerCase() ===
        selectedZone.toLowerCase();

      return matchesCategory && matchesSearch && matchesProvince && matchesCanton;
    });
  }, [
    entrepreneurships,
    selectedCategory,
    searchQuery,
    selectedProvince,
    interestsSet,
    bizCategoryInfo,
  ]);



  // Filtrado de productos por categoría efectiva del producto
  const filteredProducts: Product[] = allProducts.filter((p) => {
    // Get product category name from category_id if available
    let effectiveCategoryName = "General";

    if (p?.category_id != null) {
      const category = categoryMap.get(Number(p.category_id));
      effectiveCategoryName = category?.name || "General";
    } else if (p.entrepreneurship_id) {
      // Fallback to business category if product doesn't have a direct category
      const bizInfo = bizCategoryInfo.get(p.entrepreneurship_id);
      effectiveCategoryName = bizInfo?.name || "General";
    }

    // Normalize category names for comparison
    const normalizedEffectiveCat = removeAccents(
      effectiveCategoryName.toLowerCase().trim()
    );
    const normalizedSelectedCat = removeAccents(
      selectedCategory.toLowerCase().trim()
    );

    // Match by selected category
    const matchesCategory =
      selectedCategory === "Todos"
        ? true
        : selectedCategory === "Intereses"
          ? interestsSet.has(normalizedEffectiveCat)
          : selectedCategory === "Favoritos"
            ? favByEntreId.has(Number(p.entrepreneurship_id))
            : normalizedEffectiveCat === normalizedSelectedCat;

    // Match by search query
    const normalizedSearch = removeAccents(searchQuery.toLowerCase().trim());
    const matchesSearch =
      searchQuery === "" ||
      removeAccents((p.name || "").toLowerCase()).includes(normalizedSearch) ||
      removeAccents((p.description || "").toLowerCase()).includes(
        normalizedSearch
      ) ||
      normalizedEffectiveCat.includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  // Sugerencias de búsqueda solo para emprendimientos
  const searchSuggestions =
    searchQuery.length > 0
      ? [
        ...new Set(
          viewMode === "emprendimientos"
            ? [
              ...entrepreneurships
                .filter((b) =>
                  removeAccents((b.name || "").toLowerCase()).includes(
                    removeAccents(searchQuery.toLowerCase())
                  )
                )
                .map((b) => b.name),
              ...entrepreneurships
                .filter((b) =>
                  removeAccents(
                    (b.category_relation?.nombre || "").toLowerCase()
                  ).includes(removeAccents(searchQuery.toLowerCase()))
                )
                .map((b) => b.category_relation?.nombre || ""),
              ...entrepreneurships
                .filter((b) =>
                  removeAccents(
                    (b.description || "").toLowerCase()
                  ).includes(removeAccents(searchQuery.toLowerCase()))
                )
                .map((b) => b.name),
            ]
            : []
        ),
      ].slice(0, 5)
      : [];

  const filteredSuggestions = searchSuggestions.filter((suggestion) =>
    removeAccents(suggestion.toLowerCase()).includes(
      removeAccents(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      {/* Main Content */}
      <div className="pt-20 md:pt-24 flex flex-col min-h-full dark:bg-backgroundDark">
        <div className="w-full px-4 sm:px-6 lg:px-8 3xl:px-12 4xl:px-16 max-w-7xl 2xl:max-w-[96rem] 3xl:max-w-[110rem] 4xl:max-w-[140rem] mx-auto">
          {/* Header */}
          <AnimatedContainer className="mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl 3xl:text-4xl 4xl:text-6xl font-semibold text-primary dark:text-white mb-2">
              ¡Hola! ¿Qué te gustaría descubrir hoy?
            </h1>
            <p className="text-secondary dark:text-secondaryDark text-sm md:text-base 3xl:text-lg 4xl:text-3xl">
              Explora emprendimientos locales y encuentra productos únicos
            </p>
          </AnimatedContainer>

          {/* Filter Toggle */}
          <AnimatedContainer className="mb-6">
            <div className="flex bg-brand/5 rounded-lg p-1 3xl:p-2 4xl:p-3 max-w-full md:max-w-md">
              <SoftButton
                onClick={() => {
                  setViewMode("emprendimientos");
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                className={`flex-1 py-2 md:py-2.5 3xl:py-3 4xl:py-4 px-4 3xl:px-6 4xl:px-8 rounded-md text-sm 3xl:text-base 4xl:text-2xl font-medium transition-all ${viewMode === "emprendimientos"
                  ? "bg-white dark:bg-brandDark dark:text-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-brand/10"
                  }`}
              >
                Emprendimientos
              </SoftButton>
              <SoftButton
                onClick={() => {
                  setViewMode("productos");
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                className={`flex-1 py-2 md:py-2.5 3xl:py-3 4xl:py-4 px-4 3xl:px-6 4xl:px-8 rounded-md text-sm 3xl:text-base 4xl:text-2xl font-medium transition-all ${viewMode === "productos"
                  ? "bg-white dark:bg-brandDark dark:text-white text-primary shadow-sm"
                  : "text-secondary hover:text-primary hover:bg-brand/10"
                  }`}
              >
                Productos
              </SoftButton>
            </div>
          </AnimatedContainer>

          {/* Mobile Top Products (Carousel style) - Shown first on mobile */}
          <div className="lg:hidden mb-8">
            <TopProductsSidebar
              onViewAllClick={() => {
                setViewMode("productos");
                setSearchQuery("");
                setShowSuggestions(false);
              }}
            />
          </div>

          {viewMode === "emprendimientos" ? (
            <>
              {/* Emprendimiento del Día */}
              {viewMode === "emprendimientos" && (
                <AnimatedContainer className="mb-8">
                  <FeaturedEntrepreneurOfDay
                    entrepreneurships={entrepreneurships}
                    loading={loading}
                  />
                </AnimatedContainer>
              )}
              <AnimatedContainer className="mb-8">

                {loading ? (
                  <SkeletonFeaturedEntrepreneur />
                ) : (
                  (() => {
                    const featured =
                      entrepreneurships.find((b: any) => b?.id === 1) ||
                      filteredBusinesses[0] ||
                      entrepreneurships[0];
                    const featuredId = featured?.id ?? "";
                    return (
                      <Link
                        to={`/business/${featuredId}`}
                        className="block"
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "auto" })
                        }
                      ></Link>
                    );
                  })()
                )}
              </AnimatedContainer>

              {/* Search Bar + Zone Selector */}
              <div className="mb-8 rounded-lg">
                <h2 className="text-base md:text-lg 3xl:text-xl 4xl:text-2xl font-semibold text-primary dark:text-white mb-2">
                  Buscar emprendimientos
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                  {/* Search Bar (un poco más largo) */}
                  <div className="relative flex-[1] w-full">
                    <Search
                      sx={{ fontSize: 20 }}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary dark:text-secondaryDark"
                    />
                    <input
                      type="text"
                      placeholder="Buscar emprendimientos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 200)
                      }
                      className="w-full pl-12 pr-4 py-3 md:py-4 3xl:py-5 4xl:py-6 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-cardDark dark:border-cardDark text-base dark:text-secondaryDark 3xl:text-lg 4xl:text-4xl"
                    />
                    {/* Search Suggestions */}
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <AnimatedContainer className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-cardDark border border-border dark:border-cardDark rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchQuery(suggestion);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left dark:bg-cardDark px-4 py-3 4xl:py-4 hover:bg-brand/10 dark:hover:bg-brandDark/20 transition-colors border-b border-border dark:border-cardDark last:border-b-0 flex items-center gap-3 4xl:gap-4"
                          >
                            <Search
                              sx={{ fontSize: 18 }}
                              className="text-secondary dark:text-secondaryDark"
                            />
                            <span className="text-primary dark:text-secondaryDark text-sm md:text-base 3xl:text-lg 4xl:text-xl">
                              {suggestion}
                            </span>
                          </button>
                        ))}
                      </AnimatedContainer>
                    )}
                  </div>

                  {/* Province Selector */}
                  <div className="w-full md:w-52 3xl:w-64 4xl:w-72 relative">
                    <select
                      value={selectedProvince || "Todos"}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 3xl:py-5 4xl:py-6 pr-10 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-cardDark dark:border-cardDark dark:text-secondaryDark appearance-none text-base 3xl:text-lg 4xl:text-2xl"
                    >
                      <option value="Todos">Todas las provincias</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg
                        className="w-5 h-5 4xl:w-6 4xl:h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Zone Selector */}
                  <div className="w-full md:w-52 3xl:w-64 4xl:w-72 relative">
                    <select
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                      className="w-full px-4 py-3 md:py-4 3xl:py-5 4xl:py-6 pr-10 rounded-navbar border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-cardDark dark:border-cardDark dark:text-secondaryDark appearance-none text-base 3xl:text-lg 4xl:text-2xl"
                    >
                      <option value="Todas">Todos los cantones</option>
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                      <svg
                        className="w-5 h-5 4xl:w-6 4xl:h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {viewMode !== "productos" && (
                <Categories
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  loading={isLoadingCategories}
                />
              )}

              {/* Featured Businesses/Products */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-primary dark:text-white flex items-center gap-2 4xl:gap-3">
                    <Apps sx={{ fontSize: 24 }} />
                    {viewMode === "productos"
                      ? "Productos"
                      : selectedCategory === "Todos"
                        ? "Emprendimientos"
                        : `Categoría: ${selectedCategory}`}
                  </h2>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-3 gap-6 3xl:gap-8 4xl:gap-10">
                    {[...Array(6)].map((_, index) => (
                      <SkeletonEntrepreneurCard
                        key={`skeleton-entrepreneur-${index}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 3xl:gap-8">
                        {filteredBusinesses.map((business: any) =>
                          (() => {
                            return (
                              <Link
                                key={business.id}
                                to={`/business/${business.id}`}
                                className="block"
                                onClick={() =>
                                  window.scrollTo({ top: 0, behavior: "auto" })
                                }
                              >
                                <AnimatedCard className="bg-white dark:bg-cardDark dark:border-cardDark dark:text-secondaryDark rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col">
                                  <div className="aspect-square bg-gray-50 dark:bg-cardDark relative overflow-hidden">
                                    <img
                                      src={
                                        business.image_url ||
                                        "https://placehold.co/600x600?text=Sin+imagen"
                                      }
                                      alt={
                                        business.name || "Imagen del emprendimiento"
                                      }
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  </div>
                                  <div className="p-4 3xl:p-5 4xl:p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h3 className=" text-gray-900 dark:text-white text-sm 3xl:text-base 4xl:text-4xl line-clamp-2 font-semibold">
                                        {business.name}
                                      </h3>
                                      <button
                                        className="text-secondary dark:text-secondaryDark hover:text-brand transition-colors font-medium"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const bizId = Number(business.id);
                                          const existing = favByEntreId.get(bizId);
                                          if (existing?.id) {
                                            setPendingRemove({
                                              favoriteId: existing.id,
                                              bizId,
                                            });
                                            setConfirmOpen(true);
                                          } else {
                                            setPendingById((p) => ({
                                              ...p,
                                              [bizId]: true,
                                            }));
                                            addFav.mutate(bizId, {
                                              onSettled: () =>
                                                setPendingById((p) => ({
                                                  ...p,
                                                  [bizId]: false,
                                                })),
                                            });
                                          }
                                        }}
                                        disabled={pendingById[Number(business.id)]}
                                        aria-label={
                                          favByEntreId.has(Number(business.id))
                                            ? "Quitar de favoritos"
                                            : "Agregar a favoritos"
                                        }
                                      >
                                        {favByEntreId.has(Number(business.id)) ? (
                                          <Favorite
                                            sx={{ fontSize: 22 }}
                                            className="text-[#0A5B7A]"
                                          />
                                        ) : (
                                          <FavoriteBorder sx={{ fontSize: 22 }} />
                                        )}
                                      </button>
                                    </div>
                                    <p className="text-gray-600 dark:text-secondaryDark text-xs 3xl:text-sm 4xl:text-2xl mb-3 line-clamp-2 font-medium">
                                      {business.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">

                                      {(() => {
                                        const categoryInfo = bizCategoryInfo.get(
                                          business.id
                                        ) || { name: "General", color: "#4F46E5" };
                                        const iconUrl = categoryIconUrl(categoryInfo.name, categoryInfo.color);

                                        return (
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setSelectedCategory(
                                                categoryInfo.name
                                              );
                                              // Scroll to categories section for better UX
                                              document
                                                .getElementById(
                                                  "categories-section"
                                                )
                                                ?.scrollIntoView({
                                                  behavior: "smooth",
                                                });
                                            }}
                                            className={`hover:opacity-90 px-2 py-1 4xl:px-3 4xl:py-1.5 rounded-full text-xs 3xl:text-sm 4xl:text-2xl font-medium transition-all duration-200 flex items-center gap-1`}
                                            style={{
                                              backgroundColor: `${categoryInfo.color}1a`, // Add 10% opacity
                                              color: categoryInfo.color,
                                              border: `1px solid ${categoryInfo.color}33`, // 20% opacity border
                                            }}
                                          >
                                            {iconUrl && (
                                              <img
                                                src={iconUrl}
                                                alt=""
                                                className="w-3 h-3 3xl:w-4 3xl:h-4 4xl:w-6 4xl:h-6"
                                                style={{
                                                  minWidth: '12px',
                                                  minHeight: '12px',
                                                }}
                                              />
                                            )}
                                            {categoryInfo.name}
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </AnimatedCard>
                              </Link>
                            );
                          })()
                        )}
                      </div>
                      {hasNextPage && (
                        <div
                          ref={loadMoreRef}
                          className="mt-6 h-10 flex items-center justify-center text-secondary text-sm 4xl:text-3xl"
                        >
                          {isFetchingNextPage
                            ? "Cargando más…"
                            : "Desplázate para cargar más"}
                        </div>
                      )}
                    </div>

                    {/* Sidebar for Top Products - Desktop */}
                    <aside className="hidden lg:block w-80 flex-shrink-0 sticky top-24 dark:bg-backgroundDark">
                      <TopProductsSidebar
                        onViewAllClick={() => {
                          setViewMode("productos");
                          setSearchQuery("");
                          setShowSuggestions(false);
                        }}
                      />
                    </aside>
                  </div>
                )}
              </div>


            </>
          ) : (
            <>
              {/* Categories */}
              <Categories
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                loading={isLoadingCategories}
              />

              {/* Popular Products */}
              <AnimatedContainer className="mb-6">
                <h2 className="text-xl md:text-2xl 3xl:text-3xl 4xl:text-4xl font-semibold text-primary dark:text-white mb-6 flex items-center gap-2 4xl:gap-3">
                  <FloatingElement>
                    <Star sx={{ fontSize: 24 }} />
                  </FloatingElement>
                  Productos Populares
                </h2>
                {loadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-3 gap-6 3xl:gap-8 4xl:gap-10">
                    {[...Array(6)].map((_, index) => (
                      <SkeletonProductCard key={`skeleton-product-${index}`} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-3 gap-6 3xl:gap-8 4xl:gap-10 ">
                    {filteredProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="block"
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "auto" })
                        }
                      >
                        <AnimatedCard>
                          <ProductCard
                            title={product.name}
                            description={product.description || ""}
                            price={product.price}
                            imgUrl={
                              product.image_url ||
                              "https://placehold.co/600x600?text=Sin+imagen"
                            }
                            categoryName={
                              product?.category_id != null
                                ? categoryMap.get(Number(product.category_id))
                                  ?.name || "General"
                                : undefined
                            }
                            productId={String(product.id)}
                            entrepreneurshipId={String(
                              product.entrepreneurship_id
                            )}
                            entrepreneurshipName={
                              product.entrepreneurship?.name ||
                              (entrepreneurships.find(
                                (e: any) => e.id === product.entrepreneurship_id
                              )?.name ??
                                "Emprendimiento")
                            }
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
        <footer
          id="contacto"
          className="bg-brand dark:bg-brandDark text-white py-6 rounded-t-2xl w-full"
        >
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 border-b border-white pb-4 w-full">
              <div className="flex align-middle items-center gap-4 md:gap-6">
                <img
                  src={footerHero}
                  alt="Logo"
                  className="w-8 p-1 rounded-full"
                />
                <Link to="/faqs" className="hover:underline dark:hover:underline hover:text-brand dark:text-white text-white text-xs md:text-sm">Preguntas frecuentes</Link>
                <Link to="/contactUs" className="hover:underline hover:text-brand dark:hover:underline dark:text-white text-white text-xs md:text-sm">Contáctanos</Link>
              </div>
              <div className="flex gap-4 md:gap-6">
                <a
                  href="https://www.instagram.com/empowerup_cr/?utm_source=ig_web_button_share_sheet"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                  title="Instagram"
                  aria-label="Instagram EmpowerUp"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a
                  href="http://www.youtube.com/@empowerup-novateam"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                  title="YouTube"
                  aria-label="YouTube EmpowerUp"
                >
                  <Youtube className="w-5 h-5 text-white" />
                </a>
                <a
                  href="https://www.tiktok.com/@empowerup_?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                  title="TikTok"
                  aria-label="TikTok EmpowerUp"
                >
                  <Music2 className="w-5 h-5 text-white" />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61584385864554"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
                  title="Facebook"
                  aria-label="Facebook EmpowerUp"
                >
                  <Facebook className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
            <p className="text-sm text-center mt-4">
              © 2025 EmpowerUp. Todos los derechos reservados.
            </p>
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
          <p className="text-sm text-secondary dark:text-white">
            ¿Estás seguro de que deseas eliminar este emprendimiento de tus
            favoritos?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg border border-border dark:border-cardDark hover:bg-gray-50 dark:hover:bg-cardDark dark:text-secondaryDark dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (pendingRemove) {
                  const { favoriteId, bizId } = pendingRemove;
                  setPendingById((p) => ({ ...p, [bizId]: true }));
                  removeFav.mutate(favoriteId, {
                    onSettled: () =>
                      setPendingById((p) => ({ ...p, [bizId]: false })),
                  });
                }
                setConfirmOpen(false);
                setPendingRemove(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-brandDark dark:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
