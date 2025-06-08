import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCart } from './CartContext';
import { FaEuroSign } from 'react-icons/fa';
import { useLanguage } from './LanguageContext';

const products = [
  { id: 1, name: 'T-shirt Logo', price: 20, image: 'https://source.unsplash.com/300x300/?tshirt' },
  { id: 2, name: 'Cappellino DJ', price: 15, image: 'https://source.unsplash.com/300x300/?cap' },
  { id: 3, name: 'Sticker Pack', price: 5, image: 'https://source.unsplash.com/300x300/?sticker' },
];

const Section = styled.section`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const Item = styled(motion.div)`
  background-color: #111;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid var(--gray);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  h3 {
    color: var(--yellow);
    margin-top: 0.5rem;
  }
`;

const Button = styled(motion.button)`
  margin-top: 1rem;
  background-color: var(--green);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

const ShopSection = () => {
  const { addItem } = useCart();
  const [message, setMessage] = useState('');
  const { t } = useLanguage();
  return (
  <Section>
    <div className="container">
      <h2>{t('shop.title')}</h2>
      <p>{t('shop.subtitle')}</p>
      <Grid>
        {products.map(product => (
          <Item key={product.id} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} whileHover={{ scale: 1.05 }}>
            <motion.img src={product.image} alt={product.name} whileHover={{ scale: 1.1 }} />
            <h3>{product.name}</h3>
            <p><FaEuroSign /> {product.price}</p>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addItem({ id: product.id, name: product.name, price: product.price });
                setMessage(t('shop.added'));
                setTimeout(() => setMessage(''), 2000);
              }}
            >
              {t('shop.add_to_cart')}
            </Button>
          </Item>
        ))}
      </Grid>
      {message && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--green)', marginTop: '1rem' }}>{message}</motion.p>}
    </div>
  </Section>
  );
};

export default ShopSection;
