import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ProductForm from "./entrepreneur/inventory/components/ProductForm";
import { getProduct, type Product } from "../services/productService";
import { useToast } from "../hooks/useToast";

export default function AñadirProducto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // businessId can be provided via query string ?businessId=123
  const search = new URLSearchParams(location.search);
  const businessId = search.get("businessId");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const pid = parseInt(id, 10);
        const product = await getProduct(pid);
        if (mounted) setInitialData(product);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        toast({ title: "Error", description: "No se pudo cargar el producto", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <ProductForm
      businessId={businessId}
      initialData={initialData}
      onSuccess={() => navigate(-1)}
      onCancel={() => navigate(-1)}
    />
  );
}
