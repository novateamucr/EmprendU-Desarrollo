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
            className="rounded-md"
            sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Producto', 'Descripción', 'Precio', 'Estado', 'Fecha', 'Acciones'].map((header) => (
                  <th 
                    key={header}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: count }).map((_, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton 
                        variant="circular" 
                        width={40} 
                        height={40} 
                        className="mr-3"
                        sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                      />
                      <div className="text-sm">
                        <Skeleton 
                          variant="text" 
                          width={100} 
                          height={20} 
                          sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                        />
                        <Skeleton 
                          variant="text" 
                          width={60} 
                          height={16} 
                          className="mt-1"
                          sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton 
                      variant="text" 
                      width={150} 
                      height={20}
                      sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton 
                      variant="text" 
                      width={60} 
                      height={20}
                      className="mx-auto"
                      sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton 
                      variant="rectangular" 
                      width={80} 
                      height={24}
                      className="mx-auto rounded-full"
                      sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Skeleton 
                      variant="text" 
                      width={80} 
                      height={20}
                      className="mx-auto"
                      sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <Skeleton 
                        variant="circular" 
                        width={32} 
                        height={32}
                        sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                      />
                      <Skeleton 
                        variant="circular" 
                        width={32} 
                        height={32}
                        sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
