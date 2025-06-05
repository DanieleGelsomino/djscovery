import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.social}>
          {/* Social links placeholders */}
          <a href="https://instagram.com/djscovery.tv" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="#">Facebook</a>
          <a href="#">YouTube</a>
        </div>
        <div className={styles.menu}>
          <Link to="/">Home</Link>
          <Link to="/eventi">Eventi</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/chi-siamo">Chi Siamo</Link>
          <Link to="/contatti">Contatti</Link>
        </div>
        <p className={styles.copy}>&copy; {new Date().getFullYear()} DJSCOVERY</p>
      </div>
    </footer>
  );
};

export default Footer;
