import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useCart } from './CartContext';
import Spinner from './Spinner';

const Section = styled.section`
  display: flex;
  justify-content: center;
  text-align: center;
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
`;

const CartWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);

  @media (min-width: 768px) {
    max-width: 800px;
    padding: 3rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background-color: #111;
  border-radius: 4px;

  span:first-child {
    text-align: left;
  }

  button {
    background-color: var(--red);
    color: var(--white);
    border: none;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
  }

  @media (min-width: 768px) {
    gap: 2rem;
    padding: 1rem 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    text-align: center;

    button {
      width: 100%;
      margin-top: 0.5rem;
    }
  }
`;

const Total = styled.p`
  font-weight: bold;
  font-size: 1.25rem;
  color: var(--yellow);
  margin-top: 1rem;
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
        <CartWrapper>
          <h2>Carrello</h2>
          {items.length === 0 && <p>Nessun elemento nel carrello.</p>}
          {items.map((item, idx) => (
            <Item key={idx}>
              <span>{item.name}</span>
              <span>{item.price}€</span>
              <button onClick={() => removeItem(idx)}>Rimuovi</button>
            </Item>
          ))}
          {items.length > 0 && <Total>Total: {total}€</Total>}
        </CartWrapper>
      </div>
    </Section>
  );
};

export default CartPage;
