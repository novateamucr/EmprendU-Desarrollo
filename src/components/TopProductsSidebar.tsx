import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { productApi } from '../services/entrepreneurshipService';
import { Skeleton } from '@mui/material';
import { LocalFireDepartment, TrendingUp } from '@mui/icons-material';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeInUp} 0.5s ease-out;
`;

const Card = styled.div`
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
`;

export const TopProductsSidebar = ({ onViewAllClick }: { onViewAllClick?: () => void }) => {
    const { data: topProducts, isLoading } = useQuery({
        queryKey: ['products', 'top-selling'],
        queryFn: async () => {
            const products = await productApi.getTopSelling();
            return products;
        },
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton variant="text" width="60%" height={32} />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton variant="rounded" width={60} height={60} />
                        <div className="flex-1">
                            <Skeleton variant="text" width="80%" />
                            <Skeleton variant="text" width="40%" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!topProducts || topProducts.length === 0) return null;

    return (
        <Container className="bg-white dark:bg-cardDark dark:border-backgroundDark dark:rounded-xl rounded-xl border border-gray-100 p-5 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <div className="bg-orange-100 p-1.5 rounded-full text-orange-600">
                    <LocalFireDepartment sx={{ fontSize: 20 }} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg dark:text-white">Lo más vendido</h3>
            </div>

            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 snap-x scrollbar-hide">
                {topProducts.map((product: any, index: number) => (
                    <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="group min-w-[85%] sm:min-w-[300px] lg:min-w-0 snap-center"
                    >
                        <Card className="flex gap-3 items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-backgroundDark border border-gray-100 lg:border-none h-full">
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                                <img
                                    src={product.image_url || "https://placehold.co/100x100?text=Product"}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-0 left-0 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-md backdrop-blur-sm">
                                    #{index + 1}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-secondaryDark line-clamp-2 hover:text-primary dark:hover:text-secondaryDark transition-colors">
                                    {product.name}
                                </h4>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-sm font-bold text-primary dark:text-white">
                                        ₡{Number(product.price).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-500 dark:text-brandDark flex items-center gap-0.5">
                                        <TrendingUp sx={{ fontSize: 12 }} />
                                        {product.total_sold || 0} ventas
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <button
                onClick={(e) => {
                    e.preventDefault();
                    onViewAllClick?.();
                }}
                className="block w-full mt-5 text-center text-sm font-medium text-primary dark:text-secondaryDark hover:text-primary/80 hover:underline transition-all"
            >
                Ver todos los productos →
            </button>
        </Container>
    );
};
