import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: any;
  is_active: boolean;
}

interface CartItem {
  plan: SubscriptionPlan;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (plan: SubscriptionPlan) => void;
  removeFromCart: (planId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (planId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (plan: SubscriptionPlan) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.plan.id === plan.id);
      if (existingItem) {
        // For subscriptions, we typically don't allow multiple quantities
        return prevItems;
      }
      return [...prevItems, { plan, quantity: 1 }];
    });
  };

  const removeFromCart = (planId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.plan.id !== planId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.plan.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (planId: string) => {
    return cartItems.some(item => item.plan.id === planId);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};