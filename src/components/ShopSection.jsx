import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const products = [
  { id: 1, name: 'T-shirt Logo', price: '20€', image: 'https://source.unsplash.com/300x300/?tshirt' },
  { id: 2, name: 'Cappellino DJ', price: '15€', image: 'https://source.unsplash.com/300x300/?cap' },
  { id: 3, name: 'Sticker Pack', price: '5€', image: 'https://source.unsplash.com/300x300/?sticker' },
];

const Section = styled.section`
  padding: 2rem 0;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Item = styled(motion.div)`
  background-color: #111;
  padding: 1rem;
  border-radius: 4px;

  h3 {
    color: var(--yellow);
    margin-top: 0.5rem;
  }
`;

const Button = styled.button`
  margin-top: 1rem;
  background-color: var(--green);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

const ShopSection = () => (
  <Section>
    <div className="container">
      <h2>Shop</h2>
      <Grid>
        {products.map(product => (
          <Item key={product.id} whileHover={{ scale: 1.05 }}>
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price}</p>
            <Button>Aggiungi al carrello</Button>
          </Item>
        ))}
      </Grid>
    </div>
  </Section>
);

export default ShopSection;
