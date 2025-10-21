import React, { useState } from "react";
import { Modal } from '../components/Modal';
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import { deleteProduct } from '../services/productService';

const button = (
  <Link
    to="/admin/Añadirproductos"
    className="bg-brand text-white rounded-full px-6 py-3 text-base font-medium hover:opacity-90 transition-colors"
  >
    + Añadir producto
  </Link>
);

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatPrice = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === '') return '-';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n || 0);
};

export default function Gestorproductos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Usar el hook de productos con paginación
  const { products: allProducts, loading, error, pagination, refetch } = useProducts({ page: currentPage });
  const [products, setProducts] = useState<any[]>(allProducts || []);

  React.useEffect(() => {
    if (allProducts) setProducts(allProducts);
    if (pagination && (pagination.last_page || pagination.lastPage)) setTotalPages(pagination.last_page || pagination.lastPage);
  }, [allProducts, pagination]);

  // Filtrar productos por nombre o propietario
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    if (!searchTerm.trim()) return products;
    const searchLower = searchTerm.toLowerCase().trim();
    return products.filter(p =>
      (p.name?.toLowerCase() || '').includes(searchLower) ||
      (p.entrepreneurship?.name?.toLowerCase() || '').includes(searchLower)
    );
  }, [products, searchTerm]);

  const handleActionClick = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleOptionClick = async (option: string, id: number) => {
    if (option === 'Eliminar') {
      const p = products.find(e => e.id === id) || null;
      setProductToDelete(p);
      setShowDeleteModal(true);
      return;
    }
    // Aquí puedes agregar lógica para habilitar/deshabilitar productos si la API lo permite
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      setProducts(prev => prev.filter(e => e.id !== productToDelete.id));
      refetch();
      setShowDeleteModal(false);
      setOpenMenuId(null);
      setProductToDelete(null);
    } catch (error) {
      console.error('Ocurrió un error al eliminar el producto', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      
      <div className="pt-20 px-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        <div className="flex flex-col gap-4 mt-6">
          <h1 className="text-2xl font-semibold text-primary text-center mb-2">Gestión de productos</h1>
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-2">
            <div className="w-full md:w-1/2">
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-full text-base text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="w-full md:w-auto flex justify-end">
              {button}
            </div>
          </div>
        </div>
        <div className="mt-10">
          <table className="w-full text-center border-collapse bg-white rounded-card shadow-soft border border-border">
            <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-2">Nombre</th>
                  <th className="py-3 px-2">Propietario</th>
                  <th className="py-3 px-2">Precio</th>
                  <th className="py-3 px-2">Stock</th>
                  <th className="py-3 px-2">Última modificación</th>
                  <th className="py-3 px-2">Añadido en</th>
                  <th className="py-3 px-2"></th>
                </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-red-500">
                    Error al cargar los productos: {error.message}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                filteredProducts.map(ent => (
                  <tr key={ent.id} className="relative hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <div className="font-medium">{ent.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">{ent.entrepreneurship?.name || '-'}</td>
                    <td className="py-3 px-2">{formatPrice(ent.price)}</td>
                    <td className="py-3 px-2">{ent.stock_quantity ?? ent.stock ?? '-'}</td>
                    <td className="py-3 px-2">{formatDate(ent.updated_at)}</td>
                    <td className="py-3 px-2">{formatDate(ent.created_at)}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(ent.id);
                        }}
                        className="px-2 py-1 hover:bg-gray-100 rounded-full"
                        aria-label="Acciones"
                      >
                        ⋮
                      </button>
                      {openMenuId === ent.id && (
                        <div
                          className="absolute right-0 mt-1 z-50 bg-white min-w-[140px] shadow-lg border border-gray-200 rounded-md overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/admin/Añadirproductos/${ent.id}`}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            Editar
                          </Link>
                          <button
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
                            onClick={() => handleOptionClick("Eliminar", ent.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* PAGINACIÓN */}
          <div className="flex justify-center mt-6 gap-2">
            <button
              className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-brand/10 text-brand disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
        {/* Modal de confirmación de eliminación */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setProductToDelete(null); }}
          title="Confirmar eliminación"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">¿Desea eliminar el producto <span className="font-semibold">{productToDelete?.name}</span>?</p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setProductToDelete(null); }}
                className="px-6 py-2 bg-gray-200 text-secondary rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
