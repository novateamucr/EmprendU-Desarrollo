import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Diamond, Palette } from '@mui/icons-material';
import { featuredBusinessApi } from '../services/featuredBusinessService';

interface FeaturedEntrepreneurProps {
  entrepreneurships: any[];
  loading: boolean;
}

// Animaciones
const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.99); }
  to { opacity: 1; transform: scale(1); }
`;

const glow = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
`;

// Componentes estilizados
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

  @media (prefers-color-scheme: dark) {
    &:hover {
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
    }

    &::before {
      background: radial-gradient(120% 120% at 0% 0%, rgba(16, 185, 129, 0.1), transparent 60%),
                  radial-gradient(120% 120% at 100% 100%, rgba(59, 130, 246, 0.1), transparent 60%);
    }
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

export default function FeaturedEntrepreneurOfDay({  loading }: FeaturedEntrepreneurProps) {
  const [businessOfDay, setBusinessOfDay] = useState<any>(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!loading) {
        try {
          const result = await featuredBusinessApi.getToday();
          setBusinessOfDay(result);
        } catch (err) {
          console.error('Error fetching featured business:', err);
          // Guardamos un valor explícito para indicar que no hay negocio destacado
          setBusinessOfDay({ business: null });
        }
      }
    };

    fetchBusiness();
  }, [loading]);

  if (loading) return null;

  const biz = businessOfDay?.business ?? null;

  // Si no hay negocio destacado, mostramos un fallback amigable en lugar de nada
  if (!biz) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primary dark:text-white mb-4 flex items-center gap-2">
          <FloatingElement>
            <Diamond sx={{ fontSize: 20 }} />
          </FloatingElement>
          Emprendimiento del Día
        </h2>

        <GlowingCard className="bg-gradient-to-r dark:from-brand/10 dark:to-cardDark from-brand/5 to-white rounded-lg p-4 md:p-6 border border-border dark:border-cardDark">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-brand/10 dark:bg-brand/20 rounded-md flex items-center justify-center">
              <Palette sx={{ fontSize: 26 }} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-primary dark:text-white">No hay emprendimiento destacado</h3>
              <p className="text-secondary dark:text-secondaryDark text-sm">Todavía no hay un emprendimiento seleccionado para el día.</p>
            </div>
          </div>
        </GlowingCard>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-primary dark:text-white mb-4 flex items-center gap-2">
        <FloatingElement>
          <Diamond sx={{ fontSize: 20 }} />
        </FloatingElement>
        Emprendimiento del Día
      </h2>

      <Link
        to={`/business/${businessOfDay.business.id}`}
        className="block"
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <GlowingCard className="bg-gradient-to-r dark:from-brand/10 dark:to-cardDark from-brand/5 to-white rounded-lg p-4 md:p-6 border border-border dark:border-cardDark">
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <div className="w-full md:w-40 md:h-40 h-44 bg-brand/10 dark:bg-brand/20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={businessOfDay.business.image_url || "https://placehold.co/400x300?text=Sin+imagen"}
                alt={businessOfDay.business.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-primary dark:text-white line-clamp-2">
                  {businessOfDay.business.name}
                </h3>
                <p className="text-secondary dark:text-secondaryDark font-medium text-sm mb-3 line-clamp-3">
                  {businessOfDay.business.description || "Descubre productos únicos de nuestro emprendimiento destacado."}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="bg-white dark:bg-cardDark text-secondary dark:text-secondaryDark px-3 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                  <Palette sx={{ fontSize: 12 }} />
                  {businessOfDay.business.category_relation?.nombre || "General"}
                </span>
                <span className="text-brand dark:text-brandDark hover:text-brandDark dark:hover:text-brand text-sm font-medium">
                  Detalles →
                </span>
              </div>
            </div>
          </div>
        </GlowingCard>
      </Link>
    </div>
  );
}
