import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    // ensure each item stored in the cart has an id property
    const id = item.id ?? Date.now() + Math.random();
    setItems((prev) => [...prev, { ...item, id }]);
  };

  const removeItem = (id) => {
    // remove item by matching its id instead of using the array index
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};
