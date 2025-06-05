import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className="container">
        <Link to="/" className={styles.logo}>DJSCOVERY</Link>
        <button className={styles.toggle} onClick={() => setOpen(!open)}>
          &#9776;
        </button>
        <ul className={`${styles.menu} ${open ? styles.show : ''}`}> 
          <li><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/eventi" onClick={() => setOpen(false)}>Eventi</NavLink></li>
          <li><NavLink to="/shop" onClick={() => setOpen(false)}>Shop</NavLink></li>
          <li><NavLink to="/chi-siamo" onClick={() => setOpen(false)}>Chi Siamo</NavLink></li>
          <li><NavLink to="/contatti" onClick={() => setOpen(false)}>Contatti</NavLink></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
