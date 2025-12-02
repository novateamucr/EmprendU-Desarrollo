import { SxProps, Theme } from '@mui/material';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  sx?: SxProps<Theme>;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  animation = 'pulse',
  sx = {},
}: SkeletonProps) {
  const baseStyles: SxProps<Theme> = {
    display: 'block',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    height: height,
    width: width,
    ...(variant === 'rounded' && { borderRadius: '4px' }),
    ...(variant === 'circular' && { borderRadius: '50%' }),
    ...(animation === 'pulse' && {
      animation: 'pulse 1.5s ease-in-out 0.5s infinite',
      '@keyframes pulse': {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.4 },
        '100%': { opacity: 1 },
      },
    }),
    ...(animation === 'wave' && {
      position: 'relative',
      overflow: 'hidden',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        transform: 'translateX(-100%)',
        background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.04), transparent)',
        animation: 'shimmer 2s infinite',
        '@keyframes shimmer': {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
    }),
    ...sx,
  };

  return <div className={`skeleton ${className}`} style={baseStyles as any} />;
}

export function SkeletonEntrepreneurCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden dark:bg-cardDark dark:border-cardDark">
      <div className="aspect-square bg-gray-50 relative overflow-hidden dark:bg-gray-700">
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="circular" width={20} height={20} />
        </div>
        <Skeleton variant="text" width="90%" height={16} className="mb-3" />
        <Skeleton variant="text" width="40%" height={16} className="mb-2" />
        <div className="flex items-center justify-between mt-3">
          <Skeleton variant="text" width={60} height={16} />
          <Skeleton variant="rounded" width={80} height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden dark:bg-cardDark dark:border-cardDark">
      <div className="aspect-square bg-gray-50 relative overflow-hidden dark:bg-gray-700">
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      </div>
      <div className="p-4">
        <Skeleton variant="text" width="80%" height={20} className="mb-2" />
        <Skeleton variant="text" width="100%" height={16} className="mb-1" />
        <Skeleton variant="text" width="90%" height={16} className="mb-3" />
        <div className="flex items-center justify-between mt-auto">
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="rounded" width={100} height={36} className="rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonFeaturedEntrepreneur() {
  return (
    <div className="bg-gradient-to-r from-brand/5 to-brand/10 rounded-xl p-6 shadow-sm border border-brand/20 dark:bg-cardDark dark:border-cardDark">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-32 md:h-32 w-full h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 dark:bg-gray-700">
          <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton variant="text" width="60%" height={24} />
            <div className="flex items-center gap-1 ml-auto">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={20} height={16} className="ml-1" />
            </div>
          </div>
          <Skeleton variant="text" width="100%" height={16} className="mb-2" />
          <Skeleton variant="text" width="90%" height={16} className="mb-4" />
          <div className="flex items-center justify-between">
            <Skeleton variant="rounded" width={120} height={28} />
            <Skeleton variant="text" width={100} height={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 dark:bg-cardDark dark:border-cardDark">
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant="text" width="25%" height={20} />
            <Skeleton variant="rectangular" width={50} height={50} />
          </div>
          <Skeleton variant="text" width="20%" height={24} className="mb-2" />
          <div className="flex items-center">
            <Skeleton variant="text" width="70%" height={16} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBusinessCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow dark:bg-cardDark dark:border-cardDark">
      <div className="h-40 bg-gray-100 relative dark:bg-gray-700">
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="circular" width={24} height={24} />
        </div>
        <Skeleton variant="text" width="40%" height={20} className="mb-3" />
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={40} height={16} />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rounded" width={32} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonBusinessList({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBusinessCard key={`skeleton-business-${i}`} />
      ))}
    </div>
  );
}

export function SkeletonCategoryList({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={`skeleton-category-${i}`} 
          className="flex-shrink-0 w-32 flex flex-col items-center px-4 py-2"
        >
          <Skeleton 
            variant="circular" 
            width={24} 
            height={24} 
            className="mb-2 bg-gray-50 dark:bg-gray-700 rounded-full"
          />
          <Skeleton 
            variant="text" 
            width={80} 
            height={20} 
            className="rounded-md bg-gray-50 dark:bg-gray-700 w-full"
          />
        </div>
      ))}
    </div>
  );
}
