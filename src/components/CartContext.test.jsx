import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

  it('adds items and persists to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem({ id: '1', name: 'Item' }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ id: '1', quantity: 1 });
    expect(JSON.parse(localStorage.getItem('cart_items'))).toHaveLength(1);
  });

  it('increments and decrements item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem({ id: '2', name: 'Item' }));
    act(() => result.current.increaseItem('2'));
    expect(result.current.items[0].quantity).toBe(2);

    act(() => result.current.decreaseItem('2'));
    expect(result.current.items[0].quantity).toBe(1);

    act(() => result.current.decreaseItem('2'));
    expect(result.current.items).toHaveLength(0);
  });

  it('removes items from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem({ id: '3', name: 'Item' }));
    act(() => result.current.removeItem('3'));

    expect(result.current.items).toHaveLength(0);
  });
});
