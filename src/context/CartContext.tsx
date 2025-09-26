import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type CartGroup = {
  entrepreneurshipId: string;
  entrepreneurshipName: string;
  items: CartItem[];
};

type CartContextValue = {
  groups: CartGroup[];
  addItem: (entrepreneurshipId: string, entrepreneurshipName: string, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQty: (entrepreneurshipId: string, productId: string, quantity: number) => void;
  removeItem: (entrepreneurshipId: string, productId: string) => void;
  placeOrder: (entrepreneurshipId: string) => Promise<void>;
  clearGroup: (entrepreneurshipId: string) => void;
  isPlaced: (entrepreneurshipId: string) => boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [placedIds, setPlacedIds] = useState<string[]>([]);

  // Hydrate placed state from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('cart_placed_ids');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPlacedIds(parsed);
      } catch {}
    }
  }, []);

  // Persist placed state on change
  useEffect(() => {
    localStorage.setItem('cart_placed_ids', JSON.stringify(placedIds));
  }, [placedIds]);

  // Demo mode via env flag
  useEffect(() => {
    const demo = import.meta.env.VITE_CART_DEMO === 'true';
    if (!demo) return;
    setGroups([
      {
        entrepreneurshipId: 'e1',
        entrepreneurshipName: 'Café La Montaña',
        items: [
          { productId: 'p1', name: 'Café tostado 500g', price: 4500, quantity: 1 },
          { productId: 'p2', name: 'Taza artesanal', price: 3500, quantity: 2 },
          { productId: 'p3', name: 'Filtros de papel (x50)', price: 1200, quantity: 1 },
        ],
      },
      {
        entrepreneurshipId: 'e2',
        entrepreneurshipName: 'Dulces Doña Ana',
        items: [
          { productId: 'p4', name: 'Cajeta tradicional', price: 2500, quantity: 3 },
          { productId: 'p5', name: 'Tapitas de dulce', price: 1800, quantity: 2 },
        ],
      },
      {
        entrepreneurshipId: 'e3',
        entrepreneurshipName: 'Artesanías El Roble',
        items: [
          { productId: 'p6', name: 'Portavasos de madera (x4)', price: 5200, quantity: 1 },
          { productId: 'p7', name: 'Tabla para picar', price: 7800, quantity: 1 },
          { productId: 'p8', name: 'Llaveros tallados (x2)', price: 2600, quantity: 2 },
        ],
      },
      {
        entrepreneurshipId: 'e4',
        entrepreneurshipName: 'Huerta Verde',
        items: [
          { productId: 'p9', name: 'Lechuga orgánica', price: 900, quantity: 2 },
          { productId: 'p10', name: 'Tomate cherry (bandeja)', price: 1500, quantity: 1 },
          { productId: 'p11', name: 'Hierbabuena fresca', price: 700, quantity: 3 },
          { productId: 'p12', name: 'Zanahoria orgánica (kg)', price: 1100, quantity: 1 },
        ],
      },
    ]);
  }, []);

  const addItem: CartContextValue['addItem'] = (entrepreneurshipId, entrepreneurshipName, item) => {
    setGroups(prev => {
      const copy = [...prev];
      const gIdx = copy.findIndex(g => g.entrepreneurshipId === entrepreneurshipId);
      if (gIdx === -1) {
        copy.push({
          entrepreneurshipId,
          entrepreneurshipName,
          items: [{ ...item, quantity: item.quantity ?? 1 }],
        });
        return copy;
      }
      const group = { ...copy[gIdx] };
      const iIdx = group.items.findIndex(i => i.productId === item.productId);
      if (iIdx === -1) {
        group.items = [...group.items, { ...item, quantity: item.quantity ?? 1 }];
      } else {
        const found = { ...group.items[iIdx] };
        found.quantity += item.quantity ?? 1;
        group.items = group.items.slice();
        group.items[iIdx] = found;
      }
      copy[gIdx] = group;
      return copy;
    });
  };

  const updateQty: CartContextValue['updateQty'] = (entrepreneurshipId, productId, quantity) => {
    setGroups(prev => prev.map(g => {
      if (g.entrepreneurshipId !== entrepreneurshipId) return g;
      const items = g.items.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i);
      return { ...g, items };
    }));
  };

  const removeItem: CartContextValue['removeItem'] = (entrepreneurshipId, productId) => {
    setGroups(prev => prev.map(g => {
      if (g.entrepreneurshipId !== entrepreneurshipId) return g;
      const items = g.items.filter(i => i.productId !== productId);
      return { ...g, items };
    }).filter(g => g.items.length > 0));
  };

  const clearGroup: CartContextValue['clearGroup'] = (entrepreneurshipId) => {
    setGroups(prev => prev.filter(g => g.entrepreneurshipId !== entrepreneurshipId));
  };

  const placeOrder: CartContextValue['placeOrder'] = async (entrepreneurshipId) => {
    // TODO: integrate API to create an order or send notification
    await new Promise(res => setTimeout(res, 400));
    // keep items, since the flow is to notify and coordinate offline; if you want clear, call clearGroup
    setPlacedIds(prev => prev.includes(entrepreneurshipId) ? prev : [...prev, entrepreneurshipId]);
  };

  const isPlaced: CartContextValue['isPlaced'] = (id) => placedIds.includes(id);

  const value = useMemo<CartContextValue>(() => ({ groups, addItem, updateQty, removeItem, placeOrder, clearGroup, isPlaced }), [groups, placedIds]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
