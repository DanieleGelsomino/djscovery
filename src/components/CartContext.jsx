import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // initialize cart from localStorage to persist items across sessions
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // keep localStorage in sync with cart state
  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    const id = item.id ?? uuid();
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, id, quantity: 1 }];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const increaseItem = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  };

  const decreaseItem = (id) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id === id) {
          if (i.quantity > 1) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return [];
        }
        return i;
      })
    );
  };

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, increaseItem, decreaseItem }}
    >
      {children}
    </CartContext.Provider>
  );
};
