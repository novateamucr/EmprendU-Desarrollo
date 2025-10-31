import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProduct, Product } from '../services/productService';
import AñadirProductos from './AñadirProducto';

export default function AdminEditProductRoute() {
  const { id } = useParams();
  const productId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading, error } = useQuery<Product>({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId),
    enabled: !isNaN(productId),
  });

  if (isLoading) {
    return <div className="p-6">Cargando producto...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-600">No se pudo cargar el producto</div>;
  }

  const derivedBizId = (data.entrepreneurship_id ?? data.entrepreneurship?.id) ?? null;
  const businessId = derivedBizId !== null && derivedBizId !== undefined ? String(derivedBizId) : null;

  return (
    <AñadirProductos businessId={businessId} initialData={data} />
  );
}
