import { Skeleton } from '../ui/Skeleton';

export function BusinessDetailSkeleton() {
  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto bg-white dark:bg-backgroundDark">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Image Skeleton */}
        <div className="w-full h-44 sm:h-56 md:h-72 rounded-2xl overflow-hidden">
          <Skeleton variant="rounded" width="100%" height={'100%'} className="rounded-2xl bg-gray-50 dark:bg-gray-700" />
        </div>
        
        {/* Category Skeleton */}
        <div className="flex justify-center">
          <Skeleton variant="rounded" width="120px" height="24px" className="rounded-full bg-gray-50 dark:bg-gray-700" />
        </div>

        {/* Title and Rating */}
        <div className="space-y-2 text-center">
          <Skeleton variant="text" width="80%" height="32px" className="mx-auto bg-gray-50 dark:bg-gray-700 w-full" />
          <Skeleton variant="text" width="60%" height="24px" className="mx-auto bg-gray-50 dark:bg-gray-700 w-full" />
          
          {/* Stars */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="circular" width={24} height={24} className="bg-gray-50 dark:bg-gray-700 rounded-full" />
            ))}
          </div>
          
          <Skeleton variant="text" width="40%" height="20px" className="mx-auto bg-gray-50 dark:bg-gray-700 w-full" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height="20px" className="bg-gray-50 dark:bg-gray-700 w-full" />
          <Skeleton variant="text" width="90%" height="20px" className="bg-gray-50 dark:bg-gray-700 w-full" />
          <Skeleton variant="text" width="80%" height="20px" className="bg-gray-50 dark:bg-gray-700 w-full" />
          <Skeleton variant="text" width="60%" height="20px" className="bg-gray-50 dark:bg-gray-700 w-full" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton variant="rounded" width="180px" height="40px" className="rounded-full bg-gray-50 dark:bg-gray-700" />
          <Skeleton variant="rounded" width="180px" height="40px" className="rounded-full bg-gray-50 dark:bg-gray-700" />
        </div>

        {/* Products Section */}
        <div className="mt-12">
          <Skeleton variant="text" width="40%" height="28px" className="mb-6 bg-gray-50 dark:bg-gray-700 w-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-cardDark dark:border-cardDark">
                <Skeleton variant="rounded" width="100%" height="120px" className="rounded-lg bg-gray-50 dark:bg-gray-700" />
                <Skeleton variant="text" width="80%" height={24} className="bg-gray-50 dark:bg-gray-700 w-full" />
                <Skeleton variant="text" width="60%" height={20} className="bg-gray-50 dark:bg-gray-700 w-full" />
                <Skeleton variant="text" width="40%" height={20} className="bg-gray-50 dark:bg-gray-700 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
