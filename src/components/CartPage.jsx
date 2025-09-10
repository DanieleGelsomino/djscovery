import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { useCart } from './CartContext';
import Spinner from './Spinner';
import { CartItemSkeleton } from './Skeletons';
import { useLanguage } from './LanguageContext';

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
  grid-template-columns: auto 1fr auto auto auto;
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
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    text-align: left;

    button {
      width: auto;
      margin-top: 0.5rem;
    }
  }
`;

const ItemImage = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
`;

const Quantity = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Control = styled.button`
  background-color: var(--gray);
  color: var(--white);
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const Total = styled.p`
  font-weight: bold;
  font-size: 1.25rem;
  color: var(--yellow);
  margin-top: 1rem;
`;

const CartPage = () => {
  const { items, removeItem, increaseItem, decreaseItem } = useCart();
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <Section>
        <div className="container">
          <CartWrapper>
            <h2>{t('cart.title')}</h2>
            {Array.from({ length: 3 }).map((_, i) => (
              <CartItemSkeleton key={i} />
            ))}
          </CartWrapper>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="container">
        <CartWrapper>
          <h2>{t('cart.title')}</h2>
          {items.length === 0 && <p>{t('cart.empty')}</p>}
          {items.map((item) => (
            <Item key={item.id}>
              {item.image && <ItemImage src={item.image} alt={item.name} />}
              <span>{item.name}</span>
              <Quantity>
                <Control aria-label={t('cart.decrease')} onClick={() => decreaseItem(item.id)}>
                  <FaMinus size={12} />
                </Control>
                <span>{item.quantity}</span>
                <Control aria-label={t('cart.increase')} onClick={() => increaseItem(item.id)}>
                  <FaPlus size={12} />
                </Control>
              </Quantity>
              <span>{item.price * item.quantity}€</span>
              <button onClick={() => removeItem(item.id)}>{t('cart.remove')}</button>
            </Item>
          ))}
          {items.length > 0 && <Total>{t('cart.total')}: {total}€</Total>}
        </CartWrapper>
      </div>
    </Section>
  );
};

export default CartPage;
