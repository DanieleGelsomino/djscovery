import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCart } from './CartContext';
import Spinner from './Spinner';

const Section = styled.section`
  padding: 2rem 0;
  text-align: center;
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

const CartPage = () => {
  const { items, removeItem } = useCart();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  if (loading) return <Spinner />;

  return (
    <Section>
      <div className="container">
        <h2>Carrello</h2>
        {items.length === 0 && <p>Nessun elemento nel carrello.</p>}
        {items.map((item, idx) => (
          <Item key={idx}>
            <span>{item.name}</span>
            <span>{item.price}€</span>
            <button onClick={() => removeItem(idx)}>Rimuovi</button>
          </Item>
        ))}
        {items.length > 0 && <p>Total: {total}€</p>}
      </div>
    </Section>
  );
};

export default CartPage;
