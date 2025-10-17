import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createOrder, type CreateOrderPayload, addOrderItem, updateOrderStatus, deleteOrder, listMyOrders } from '../services/orderService';
import { useAuth } from './AuthContext';

// Types
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  // Optional selection details captured from product form
  selections?: {
    options?: Array<{ optionId: number; valueIds: number[]; optionName?: string; valueLabels?: string[] }>;
    customs?: Array<{ formId: number; value: string | number | boolean; formLabel?: string }>;
  };
  // Human-friendly summary for quick display in the cart
  selectionSummary?: string[];
};
export type CartGroup = {
  entrepreneurshipId: string;
  entrepreneurshipName: string;
  groupId: string;
  status: 'draft' | 'requested';
  orderId?: number;
  items: CartItem[];
};

type CartContextValue = {
  groups: CartGroup[];
  addItem: (entrepreneurshipId: string, entrepreneurshipName: string, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQty: (entrepreneurshipId: string, productId: string, quantity: number) => void;
  removeItem: (entrepreneurshipId: string, productId: string) => void;
  placeOrder: (entrepreneurshipId: string, userId: number) => Promise<void>;
  isPlaced: (entrepreneurshipId: string) => boolean;
  clearCart: () => void;
  getItemCount: () => number;
  getGroupItemCount: (entrepreneurshipId: string) => number;
  showJustAdded: boolean;
  cancelOrder: (groupId: string) => Promise<void>;
};

const CART_STORAGE_KEY = 'app_cart';
const CART_PLACED_IDS_KEY = 'app_cart_placed_ids';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CartGroup[]>(() => {
    // Load cart from localStorage on initial render
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (e) {
        console.error('Failed to load cart from localStorage', e);
        return [];
      }
    }
    return [];
  });

  const [showJustAdded, setShowJustAdded] = useState(false);
  const justAddedTimer = useRef<number | null>(null);

  const [placedIds, setPlacedIds] = useState<string[]>(() => {
    // Load placed IDs from localStorage on initial render
    if (typeof window !== 'undefined') {
      try {
        const savedPlaced = localStorage.getItem(CART_PLACED_IDS_KEY);
        return savedPlaced ? JSON.parse(savedPlaced) : [];
      } catch (e) {
        console.error('Failed to load placed items from localStorage', e);
        return [];
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(groups));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [groups]);

  // Save placed IDs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_PLACED_IDS_KEY, JSON.stringify(placedIds));
      } catch (e) {
        console.error('Failed to save placed items to localStorage', e);
      }
    }
  }, [placedIds]);

  // Cart starts empty by default
  // Fetch user's draft/requested orders from backend and merge into groups
  useEffect(() => {
    let aborted = false;
    (async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!user?.id && !token) return;
      try {
        // Try multiple query formats to be compatible with backend
        const attempts: any[] = [];
        const uid = user?.id ? Number(user.id) : undefined;
        const email = (user as any)?.email as string | undefined;
        // 1) with user_id param + status comma string
        if (uid) attempts.push(await listMyOrders({ user_id: uid, status: 'draft,requested' } as any).catch(() => null));
        // 2) with customer_email param + status comma string
        if (email) attempts.push(await listMyOrders({ customer_email: email, status: 'draft,requested' } as any).catch(() => null));
        // 3) status as array (auth user or query params handled server-side)
        attempts.push(await listMyOrders({ status: ['draft','requested'] } as any).catch(() => null));
        // 4) no params (server filters by auth user if available)
        attempts.push(await listMyOrders(undefined as any).catch(() => null));

        // Pick first non-empty array-like result
        let raw: any = [];
        for (const res of attempts) {
          const arr = (res?.data && Array.isArray(res.data)) ? res.data : (Array.isArray(res) ? res : (res?.data?.data || res?.data || []));
          if (Array.isArray(arr) && arr.length) { raw = arr; break; }
        }
        if (!Array.isArray(raw) || raw.length === 0) return;

        const serverGroups: CartGroup[] = raw.map((o: any) => {
          const status = String(o.status ?? '').toLowerCase();
          const mappedStatus = status === 'requested' ? 'requested' : 'draft';
          const entre = o.entrepreneurship || o.business || {};
          const entrepreneurshipId = String(o.entrepreneurship_id ?? entre.id ?? '');
          const entrepreneurshipName = String(entre.name ?? o.entrepreneurship_name ?? `Emprendimiento #${o.entrepreneurship_id ?? ''}`);
          const orderId = Number(o.id);
          const itemsSrc = o.items || o.order_items || [];
          const items: CartItem[] = Array.isArray(itemsSrc) ? itemsSrc.map((it: any) => ({
            productId: String(it.product_id ?? it.product?.id ?? ''),
            name: String(it.product?.name ?? it.product_name ?? it.name ?? 'Producto'),
            price: Number(it.unit_price ?? it.price ?? 0),
            quantity: Number(it.quantity ?? 1),
            imageUrl: it.product?.image_url ?? undefined,
          })) : [];
          return {
            entrepreneurshipId,
            entrepreneurshipName,
            groupId: `${entrepreneurshipId}-${orderId}`,
            status: mappedStatus,
            orderId,
            items,
          } as CartGroup;
        }).filter(g => g.entrepreneurshipId && g.orderId);

        if (aborted) return;
        if (serverGroups.length === 0) return;
        setGroups(prev => {
          const byKey = new Map<string, CartGroup>();
          // seed with existing groups
          prev.forEach(g => byKey.set(g.groupId, g));
          // merge server groups: override if same groupId, else add
          serverGroups.forEach(sg => {
            const existing = byKey.get(sg.groupId);
            if (!existing) {
              byKey.set(sg.groupId, sg);
            } else {
              byKey.set(sg.groupId, {
                ...existing,
                // Always refresh identity fields from server
                entrepreneurshipId: String(sg.entrepreneurshipId),
                entrepreneurshipName: sg.entrepreneurshipName || existing.entrepreneurshipName,
                status: sg.status,
                orderId: sg.orderId,
                items: existing.items?.length ? existing.items : sg.items,
              });
            }
          });
          return Array.from(byKey.values());
        });
      } catch (e) {
        // keep local cart but log for diagnostics
        console.error('Failed to load backend orders for cart', e);
      }
    })();
    return () => { aborted = true; };
  }, [user?.id]);

  const addItem: CartContextValue['addItem'] = (entrepreneurshipId, entrepreneurshipName, item) => {
    // Precompute selection for persistence
    let targetGroupId: string | null = null;
    let persistedItem: CartItem | null = null;
    setGroups(prev => {
      // Create a deep copy of the previous state to avoid direct mutations
      const updatedGroups = [...prev];
      
      // Ensure we have valid entrepreneurship ID and name
      if (!entrepreneurshipId || !entrepreneurshipName) {
        console.error('Missing entrepreneurship ID or name');
        return prev;
      }
      
      // Find a DRAFT group for this entrepreneurship; if only REQUESTED exist, create a new group
      let groupIndex = updatedGroups.findIndex(g => g.entrepreneurshipId === entrepreneurshipId && g.status === 'draft');
      const quantity = item.quantity ?? 1;

      // Create the new item with all necessary properties
      const newItem = {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: quantity,
        imageUrl: item.imageUrl,
        selections: item.selections,
        selectionSummary: item.selectionSummary
      };

      if (groupIndex === -1) {
        // If no DRAFT group exists for this entrepreneurship, create a new one and
        // place it at the beginning so UI prefers the editable draft over requested groups
        const newGroup = {
          entrepreneurshipId,
          entrepreneurshipName,
          groupId: `${entrepreneurshipId}-${Date.now()}`,
          status: 'draft',
          items: [newItem]
        } as CartGroup;
        updatedGroups.unshift(newGroup);
        groupIndex = 0;
        targetGroupId = newGroup.groupId;
        persistedItem = newItem;
      } else {
        // If group exists, check if the product is already in the cart
        const existingItemIndex = updatedGroups[groupIndex].items.findIndex(
          i => i.productId === item.productId
        );

        if (existingItemIndex === -1) {
          // Add new item to existing group
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            items: [...updatedGroups[groupIndex].items, newItem]
          };
          targetGroupId = updatedGroups[groupIndex].groupId;
          persistedItem = newItem;
        } else {
          // Update quantity of existing item
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            items: updatedGroups[groupIndex].items.map((i, idx) => 
              idx === existingItemIndex 
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          };
          targetGroupId = updatedGroups[groupIndex].groupId;
          // Persist delta as separate line item in backend
          persistedItem = { ...newItem, quantity };
        }
      }

      return updatedGroups;
    });

    // Trigger transient UI flag for "Producto agregado"
    setShowJustAdded(true);
    if (justAddedTimer.current) {
      window.clearTimeout(justAddedTimer.current);
    }
    justAddedTimer.current = window.setTimeout(() => {
      setShowJustAdded(false);
      justAddedTimer.current = null;
    }, 1600);

    // Persist to backend asynchronously
    (async () => {
      try {
        if (!targetGroupId || !persistedItem) return;
        // Find current group
        const current = groups.find(g => g.groupId === targetGroupId);
        // Ensure user info
        if (!user?.name || !user?.phone || !user?.email) return; // UI handles prompting
        let orderId = current?.orderId;
        if (!orderId) {
          const orderRes = await createOrder({
            entrepreneurship_id: Number(entrepreneurshipId),
            customer_name: String(user.name),
            customer_phone_8: String(user.phone).replace(/\D/g, '').slice(-8),
            customer_email: String(user.email),
            status: 'draft',
          } as CreateOrderPayload);
          orderId = Number(orderRes?.data?.id ?? orderRes?.id);
          setGroups(prev => prev.map(g => g.groupId === targetGroupId ? { ...g, orderId } : g));
        }
        // Map selections to order_item_options
        const pi = persistedItem as CartItem;
        const optionEntries = (pi.selections?.options || []).flatMap((sel: { optionId: number; valueIds: number[]; optionName?: string; valueLabels?: string[] }) => {
          const labels = sel.valueLabels ?? [];
          const vIds = sel.valueIds ?? [];
          return vIds.map((vId: number, idx: number) => ({
            product_option_id: sel.optionId,
            product_option_value_id: vId,
            option_name: sel.optionName || `option:${sel.optionId}`,
            option_value: labels[idx] ?? null,
            price_delta: 0,
          }));
        });
        const customEntries = (pi.selections?.customs || []).map((c: { formId: number; value: string | number | boolean; formLabel?: string }) => ({
          product_option_id: null,
          product_option_value_id: null,
          option_name: c.formLabel || `field:${c.formId}`,
          option_value: c.value != null ? String(c.value) : null,
          price_delta: 0,
        }));
        await addOrderItem(orderId!, {
          product_id: Number(pi.productId),
          quantity: pi.quantity,
          unit_price: pi.price,
          order_item_options: [...optionEntries, ...customEntries],
        });
      } catch (e) {
        // Fail silently; UI remains local, confirmation will retry persistence
      }
    })();
  };

  const updateQty: CartContextValue['updateQty'] = (entrepreneurshipId, productId, quantity) => {
    setGroups(prev => prev.map(g => {
      if (g.entrepreneurshipId !== entrepreneurshipId) return g;
      if (g.status === 'requested') return g; // block edits on requested
      const items = g.items.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i);
      return { ...g, items };
    }));
  };

  const removeItem: CartContextValue['removeItem'] = (entrepreneurshipId, productId) => {
    setGroups(prev => prev.map(g => {
      if (g.entrepreneurshipId !== entrepreneurshipId) return g;
      if (g.status === 'requested') return g; // block edits on requested
      const items = g.items.filter(i => i.productId !== productId);
      return { ...g, items };
    }).filter(g => g.items.length > 0));
  };

  const placeOrder: CartContextValue['placeOrder'] = async (entrepreneurshipId, userId) => {
    const group = groups.find(g => g.entrepreneurshipId === entrepreneurshipId && g.status === 'draft');
    if (!group) return;

    // Ensure order exists and items are persisted
    let orderId = group.orderId;
    if (!orderId) {
      if (!user?.name || !user?.phone || !user?.email) {
        throw new Error('Faltan datos del cliente (nombre, teléfono, email).');
      }
      const orderRes = await createOrder({
        entrepreneurship_id: Number(entrepreneurshipId),
        customer_name: String(user.name),
        customer_phone_8: String(user.phone).replace(/\D/g, '').slice(-8),
        customer_email: String(user.email),
        status: 'draft',
      } as CreateOrderPayload);
      orderId = Number(orderRes?.data?.id ?? orderRes?.id);
      setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, orderId } : g));
      // Persist all items
      for (const it of group.items) {
        const options = (it.selections?.options || []).flatMap(sel => {
          const labels = sel.valueLabels || [];
          return (sel.valueIds || []).map((vId, idx) => ({
            product_option_id: sel.optionId,
            product_option_value_id: vId,
            option_name: sel.optionName || `option:${sel.optionId}`,
            option_value: labels[idx] || null,
            price_delta: 0,
          }));
        });
        const customs = (it.selections?.customs || []).map(c => ({
          product_option_id: null,
          product_option_value_id: null,
          option_name: c.formLabel || `field:${c.formId}`,
          option_value: c.value != null ? String(c.value) : null,
          price_delta: 0,
        }));
        await addOrderItem(orderId!, {
          product_id: Number(it.productId),
          quantity: it.quantity,
          unit_price: it.price,
          order_item_options: [...options, ...customs],
        });
      }
    }

    // Move to requested
    await updateOrderStatus(orderId!, 'requested');
    setGroups(prev => prev.map(g => g.groupId === group.groupId ? { ...g, status: 'requested' } : g));
  };

  const isPlaced: CartContextValue['isPlaced'] = (id) => {
    // Derive from current groups to avoid stale per-entrepreneurship flags
    return groups.some(g => g.entrepreneurshipId === id && g.status === 'requested');
  };

  const clearCart = () => {
    setGroups([]);
    setPlacedIds([]);
  };

  const getItemCount = () => {
    return groups.reduce((total, group) => {
      return total + group.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  };

  const getGroupItemCount = (entrepreneurshipId: string) => {
    // Prefer the draft group for counts to reflect the editable cart
    const draft = groups.find(g => g.entrepreneurshipId === entrepreneurshipId && g.status === 'draft');
    if (draft) return draft.items.reduce((sum, item) => sum + item.quantity, 0);
    const any = groups.find(g => g.entrepreneurshipId === entrepreneurshipId);
    return any ? any.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  };

  // Create the context value with useMemo to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    groups,
    addItem,
    updateQty,
    removeItem,
    placeOrder,
    isPlaced,
    clearCart,
    getItemCount,
    getGroupItemCount,
    showJustAdded,
    cancelOrder: async (groupId: string) => {
      const target = groups.find(g => g.groupId === groupId);
      if (!target?.orderId) {
        // If it's a purely local group with no order yet, just remove it
        setGroups(prev => prev.filter(g => g.groupId !== groupId));
        return;
      }
      const params: Record<string, any> = {};
      if (user?.id) params.user_id = Number(user.id);
      if ((user as any)?.email) params.customer_email = String((user as any).email);
      try {
        await deleteOrder(target.orderId, params);
      } finally {
        // Optimistic removal from UI
        setGroups(prev => prev.filter(g => g.groupId !== groupId));
      }
    },
  }), [groups, showJustAdded]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
