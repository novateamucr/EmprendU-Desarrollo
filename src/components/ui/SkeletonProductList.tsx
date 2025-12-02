import { Skeleton } from '@mui/material';

export function SkeletonProductList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-2xl">
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={40} 
            className="rounded-md bg-gray-50 dark:bg-gray-700"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white dark:bg-cardDark dark:border-cardDark">
        {/* Desktop / Table skeleton */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-cardDark">
              <thead className="bg-gray-50 dark:bg-backgroundDark">
                <tr>
                  {['Producto', 'Descripción', 'Precio', 'Estado', 'Fecha', 'Acciones'].map((header) => (
                    <th 
                      key={header}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-secondaryDark"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-cardDark dark:divide-cardDark">
                {Array.from({ length: count }).map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-cardDark">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton 
                          variant="circular" 
                          width={40} 
                          height={40} 
                          className="mr-3 bg-gray-50 dark:bg-gray-700 rounded-full"
                        />
                        <div className="text-sm">
                          <Skeleton 
                            variant="text" 
                            width={100} 
                            height={20} 
                            className="bg-gray-50 dark:bg-gray-700 w-full"
                          />
                          <Skeleton 
                            variant="text" 
                            width={60} 
                            height={16} 
                            className="mt-1 bg-gray-50 dark:bg-gray-700 w-full"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton 
                        variant="text" 
                        width={150} 
                        height={20}
                        className="bg-gray-50 dark:bg-gray-700 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton 
                        variant="text" 
                        width={60} 
                        height={20}
                        className="mx-auto bg-gray-50 dark:bg-gray-700 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton 
                        variant="rectangular" 
                        width={80} 
                        height={24}
                        className="mx-auto rounded-full bg-gray-50 dark:bg-gray-700"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton 
                        variant="text" 
                        width={80} 
                        height={20}
                        className="mx-auto bg-gray-50 dark:bg-gray-700 rounded-md"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Skeleton 
                          variant="circular" 
                          width={32} 
                          height={32}
                          className="bg-gray-50 dark:bg-gray-700 rounded-full"
                        />
                        <Skeleton 
                          variant="circular" 
                          width={32} 
                          height={32}
                          className="bg-gray-50 dark:bg-gray-700 rounded-full"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card skeletons */}
        <div className="md:hidden space-y-3 p-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm dark:bg-cardDark dark:border-cardDark">
              <div className="flex items-start gap-3">
                <Skeleton variant="rectangular" width={64} height={64} className="rounded-md flex-shrink-0 bg-gray-50 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Skeleton variant="text" width="60%" height={18} className="bg-gray-50 dark:bg-gray-700 w-full" />
                      <Skeleton variant="text" width="30%" height={14} className="bg-gray-50 dark:bg-gray-700 w-full" />
                    </div>
                    <Skeleton variant="text" width={60} height={20} className="bg-gray-50 dark:bg-gray-700 rounded-md" />
                  </div>
                  <div className="mt-2">
                    <Skeleton variant="text" width="100%" height={14} className="bg-gray-50 dark:bg-gray-700 w-full" />
                    <Skeleton variant="text" width="80%" height={14} className="mt-1 bg-gray-50 dark:bg-gray-700 w-full" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton variant="rectangular" width={96} height={28} className="rounded-full bg-gray-50 dark:bg-gray-700" />
                    <div className="flex space-x-2">
                      <Skeleton variant="circular" width={36} height={36} className="bg-gray-50 dark:bg-gray-700 rounded-full" />
                      <Skeleton variant="circular" width={36} height={36} className="bg-gray-50 dark:bg-gray-700 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
