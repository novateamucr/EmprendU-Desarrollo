import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { cartApi } from '../services/cartService';
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
  notes?: string;
};

type CartContextValue = {
  groups: CartGroup[];
  addItem: (entrepreneurshipId: string, entrepreneurshipName: string, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQty: (entrepreneurshipId: string, productId: string, quantity: number) => void;
  removeItem: (entrepreneurshipId: string, productId: string) => void;
  placeOrder: (entrepreneurshipId: string) => Promise<{ success: boolean; orderId?: number; error?: string }>;
  isPlaced: (entrepreneurshipId: string) => boolean;
  clearCart: () => void;
  getItemCount: () => number;
  getGroupItemCount: (entrepreneurshipId: string) => number;
  showJustAdded: boolean;
  cancelOrder: (groupId: string) => Promise<void>;
  isPlacingOrder: boolean;
  orderError: string | null;
};

const CART_STORAGE_KEY = 'app_cart';
const CART_PLACED_IDS_KEY = 'app_cart_placed_ids';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
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
  // No server-side order fetching - using local storage only

  const addItem: CartContextValue['addItem'] = (entrepreneurshipId, entrepreneurshipName, item) => {
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
        // If no DRAFT group exists for this entrepreneurship, create a new one
        const newGroup = {
          entrepreneurshipId,
          entrepreneurshipName,
          groupId: `${entrepreneurshipId}-${Date.now()}`,
          status: 'draft',
          items: [newItem]
        } as CartGroup;
        updatedGroups.unshift(newGroup);
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

  const placeOrder = useCallback(async (entrepreneurshipId: string) => {
    // Check if user is authenticated and has a valid ID
    const token = localStorage.getItem('token');
    if (!token) {
      const errorMsg = 'No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.';
      setOrderError(errorMsg);
      console.error('Auth error:', errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!user || !user.id) {
      const errorMsg = 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.';
      setOrderError(errorMsg);
      console.error('User error:', errorMsg);
      return { success: false, error: errorMsg };
    }

    const group = groups.find(g => g.entrepreneurshipId === entrepreneurshipId);
    if (!group || group.items.length === 0) {
      const errorMsg = 'No hay productos en el carrito';
      setOrderError(errorMsg);
      console.error('Cart error:', errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      // Step 1: Create draft order
      const phone = user.phone?.replace(/\D/g, '').slice(-8) || '00000000';
      
      console.log('Creating order with user ID:', user.id);
      console.log('Order details:', {
        entrepreneurship_id: parseInt(entrepreneurshipId, 10),
        customer_name: user.name || 'Cliente',
        customer_phone_8: phone,
        customer_email: user.email || '',
        notes: group.notes,
        user_id: user.id
      });

      const order = await cartApi.createDraftOrder(
        {
          entrepreneurship_id: parseInt(entrepreneurshipId, 10),
          customer_name: user.name || 'Cliente',
          customer_phone_8: phone,
          customer_email: user.email || '',
          notes: group.notes
        },
        user.id
      );

      // Validate order ID
      if (!order?.id) {
        throw new Error('No se pudo crear la orden: ID de orden no recibido');
      }
      const orderId = order.id;
      console.log('Created order with ID:', orderId);

      // Step 2: Add all items to the order
      console.log('Adding items to order:', group.items);
      
      for (const item of group.items) {
        try {
          // Prepare order item options from selections (what the backend expects)
          const orderItemOptions: {
            product_option_id?: number;
            product_option_value_id?: number;
            option_name: string;
            option_value?: string;
            price_delta: number;
          }[] = [];

          // 1) Options (select/multiselect) -> cada valor seleccionado se vuelve una opción
          item.selections?.options?.forEach(option => {
            const { optionId, optionName, valueIds, valueLabels } = option;
            if (!optionId || !valueIds || valueIds.length === 0) return;

            valueIds.forEach((valueId, idx) => {
              const label = valueLabels && valueLabels[idx] ? valueLabels[idx] : undefined;
              orderItemOptions.push({
                product_option_id: optionId,
                product_option_value_id: valueId,
                option_name: optionName || 'Opción',
                option_value: label,
                price_delta: 0,
              });
            });
          });

          // 2) Custom forms (preguntas de formulario) -> una opción por campo
          item.selections?.customs?.forEach(custom => {
            const value = custom.value;
            if (value === undefined || value === null || String(value).trim() === '') return;

            orderItemOptions.push({
              option_name: custom.formLabel || 'Campo',
              option_value: String(value),
              price_delta: 0,
            });
          });

          // Add the item to the order
          await cartApi.addOrderItem(orderId, {
            product_id: parseInt(item.productId, 10),
            quantity: item.quantity,
            unit_price: item.price,
            order_item_options: orderItemOptions,
          });
          
          console.log(`Added item ${item.productId} to order ${orderId}`);
        } catch (error) {
          console.error(`Failed to add item ${item.productId} to order:`, error);
          throw new Error(`Error al agregar el producto ${item.name} al pedido`);
        }
      }

      // Step 3: Update order status to 'requested' after all items are added
      console.log('Updating order status to requested for order ID:', orderId);
      const updatedOrder = await cartApi.updateOrderStatus(orderId, 'requested');
      
      if (!updatedOrder?.id) {
        throw new Error('No se pudo actualizar el estado de la orden');
      }
      
      // Update the group with the order ID and status
      setGroups(groups.map(g => 
        g.entrepreneurshipId === entrepreneurshipId 
          ? { ...g, status: 'requested', orderId: updatedOrder.id } 
          : g
      ));
      
      // Add to placed IDs
      setPlacedIds([...placedIds, group.groupId]);
      
      return { success: true, orderId: updatedOrder.id };
    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorData = error.response?.data;
      let errorMessage = 'Error al procesar el pedido. Por favor, inténtalo de nuevo.';
      
      if (errorData?.errors) {
        // Format validation errors
        errorMessage = Object.entries(errorData.errors)
          .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
          .join('\n');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      setOrderError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsPlacingOrder(false);
    }
  }, [groups, user, placedIds]);

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

  const cancelOrder = async (groupId: string) => {
    const groupIndex = groups.findIndex(g => g.groupId === groupId);
    if (groupIndex === -1) return;

    const group = groups[groupIndex];
    if (group.status !== 'requested') return;

    // Update local state
    setGroups(prev => {
      const updated = [...prev];
      updated[groupIndex] = {
        ...updated[groupIndex],
        status: 'draft',
      };
      return updated;
    });

    // Remove from placed IDs
    setPlacedIds(prev => prev.filter(id => id !== groupId));
  };

  // Filter out requested orders from the cart display
  const activeGroups = React.useMemo(() => 
    groups.filter(group => group.status === 'draft'),
    [groups]
  );

  // Create the context value with useMemo to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    groups: activeGroups, // Only show draft orders in the cart
    allGroups: groups, // Keep all groups for other operations
    addItem,
    updateQty,
    removeItem,
    placeOrder: async (entrepreneurshipId: string) => {
      const result = await placeOrder(entrepreneurshipId);
      if (result.success) {
        // Clear the cart after successful order
        clearCart();
      }
      return result;
    },
    isPlaced,
    clearCart,
    getItemCount: () => {
      return activeGroups.reduce((total, group) => {
        return total + group.items.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);
    },
    getGroupItemCount: (entrepreneurshipId: string) => {
      const draft = activeGroups.find(g => g.entrepreneurshipId === entrepreneurshipId);
      return draft ? draft.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    },
    showJustAdded,
    cancelOrder,
    isPlacingOrder,
    orderError,
  }), [activeGroups, groups, showJustAdded, isPlacingOrder, orderError]);

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
