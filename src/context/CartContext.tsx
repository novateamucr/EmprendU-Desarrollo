import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Types
export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
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
  isPlaced: (entrepreneurshipId: string) => boolean;
  clearCart: () => void;
  getItemCount: () => number;
  getGroupItemCount: (entrepreneurshipId: string) => number;
};

const CART_STORAGE_KEY = 'app_cart';
const CART_PLACED_IDS_KEY = 'app_cart_placed_ids';

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
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

  const addItem: CartContextValue['addItem'] = (entrepreneurshipId, entrepreneurshipName, item) => {
    setGroups(prev => {
      // Create a deep copy of the previous state to avoid direct mutations
      const updatedGroups = [...prev];
      
      // Ensure we have valid entrepreneurship ID and name
      if (!entrepreneurshipId || !entrepreneurshipName) {
        console.error('Missing entrepreneurship ID or name');
        return prev;
      }
      
      // Find the group for this entrepreneurship
      let groupIndex = updatedGroups.findIndex(g => g.entrepreneurshipId === entrepreneurshipId);
      const quantity = item.quantity ?? 1;

      // Create the new item with all necessary properties
      const newItem = {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: quantity,
        imageUrl: item.imageUrl
      };

      if (groupIndex === -1) {
        // If no group exists for this entrepreneurship, create a new one
        updatedGroups.push({
          entrepreneurshipId,
          entrepreneurshipName,
          items: [newItem]
        });
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

  const placeOrder: CartContextValue['placeOrder'] = async (entrepreneurshipId) => {
    // TODO: integrate API to create an order or send notification
    await new Promise(res => setTimeout(res, 400));
    // keep items, since the flow is to notify and coordinate offline; if you want clear, call clearGroup
    setPlacedIds(prev => prev.includes(entrepreneurshipId) ? prev : [...prev, entrepreneurshipId]);
  };

  const isPlaced: CartContextValue['isPlaced'] = (id) => placedIds.includes(id);

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
    const group = groups.find(g => g.entrepreneurshipId === entrepreneurshipId);
    return group ? group.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
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
  }), [groups, placedIds]);

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
