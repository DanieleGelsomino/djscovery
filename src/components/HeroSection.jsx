import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className="container">
        <h1>Music &amp; Travel</h1>
        <p>DJSCOVERY was born from the idea of blending music with the discovery of authentic places.</p>
        <div className={styles.ctaWrapper}>
          <Link to="/eventi" className={styles.btnPrimary}>Scopri i prossimi eventi</Link>
          <Link to="/shop" className={styles.btnSecondary}>Visita lo shop</Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
