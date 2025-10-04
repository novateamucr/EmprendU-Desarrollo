import { Skeleton } from '../ui/Skeleton';

export function BusinessDetailSkeleton() {
  return (
    <div className="pt-24 pb-8 px-4 max-w-6xl mx-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Image Skeleton */}
        <Skeleton variant="rounded" width="100%" height="300px" className="rounded-2xl" />
        
        {/* Category Skeleton */}
        <div className="flex justify-center">
          <Skeleton variant="rounded" width="120px" height="24px" className="rounded-full" />
        </div>

        {/* Title and Rating */}
        <div className="space-y-2 text-center">
          <Skeleton variant="text" width="80%" height="32px" className="mx-auto" />
          <Skeleton variant="text" width="60%" height="24px" className="mx-auto" />
          
          {/* Stars */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="circular" width={24} height={24} />
            ))}
          </div>
          
          <Skeleton variant="text" width="40%" height="20px" className="mx-auto" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height="20px" />
          <Skeleton variant="text" width="90%" height="20px" />
          <Skeleton variant="text" width="80%" height="20px" />
          <Skeleton variant="text" width="60%" height="20px" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton variant="rounded" width="180px" height="40px" className="rounded-full" />
          <Skeleton variant="rounded" width="180px" height="40px" className="rounded-full" />
        </div>

        {/* Products Section */}
        <div className="mt-12">
          <Skeleton variant="text" width="40%" height="28px" className="mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton variant="rounded" width="100%" height="120px" className="rounded-lg" />
                <Skeleton variant="text" width="80%" height="24px" />
                <Skeleton variant="text" width="60%" height="20px" />
                <Skeleton variant="text" width="40%" height="20px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
