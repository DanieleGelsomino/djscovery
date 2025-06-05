import React from 'react';
import styles from './ShopSection.module.css';

const products = [
  { id: 1, name: 'T-shirt Logo', price: '20€', image: 'https://source.unsplash.com/300x300/?tshirt' },
  { id: 2, name: 'Cappellino DJ', price: '15€', image: 'https://source.unsplash.com/300x300/?cap' },
  { id: 3, name: 'Sticker Pack', price: '5€', image: 'https://source.unsplash.com/300x300/?sticker' },
];

const ShopSection = () => {
  return (
    <section className={styles.shop}>
      <div className="container">
        <h2>Shop</h2>
        <div className={styles.grid}>
          {products.map(product => (
            <div key={product.id} className={styles.item}>
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>{product.price}</p>
              <button className={styles.btn}>Aggiungi al carrello</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopSection;
