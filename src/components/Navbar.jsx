import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from './CartContext';
import logoImg from '../assets/img/logo-dj.png';

const Nav = styled(motion.nav)`
  background-color: ${({ scrolled }) =>
    scrolled ? 'var(--black)' : 'transparent'};
  padding: 1rem 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  backdrop-filter: blur(4px);
  transition: background-color 0.3s ease;
`;

const Container = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(motion(Link))`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 40px;
`;

const Toggle = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--white);
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Menu = styled(motion.ul)`
  list-style: none;
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    position: absolute;
    top: 60px;
    right: 0;
    flex-direction: column;
    background-color: var(--black);
    width: 100%;
    display: ${({ open }) => (open ? 'flex' : 'none')};
  }

  li a {
    color: var(--white);
    padding: 0.5rem 1rem;

    &.active {
      color: var(--green);
    }
  }
`;

const MenuItem = styled(motion.li)`
  a {
    display: block;
    color: var(--white);
    padding: 0.5rem 1rem;
  }
`;

const CartLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    color: var(--white);
  }
`;

const CartCount = styled.span`
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: var(--green);
  color: var(--white);
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
`;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Nav scrolled={scrolled} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
      <Container>
        <Logo whileHover={{ rotate: 2 }} to="/">
          <LogoImage src={logoImg} alt="Djscovery logo" />
        </Logo>
        <Toggle onClick={() => setOpen(!open)}>&#9776;</Toggle>
        <Menu open={open} initial={{opacity:0}} animate={{opacity:1}}>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          </MenuItem>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to="/eventi" onClick={() => setOpen(false)}>Eventi</NavLink>
          </MenuItem>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to="/shop" onClick={() => setOpen(false)}>Shop</NavLink>
          </MenuItem>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <CartLink to="/carrello" aria-label="Carrello" onClick={() => setOpen(false)}>
              <FaShoppingCart size={20} />
              {items.length > 0 && <CartCount>{items.length}</CartCount>}
            </CartLink>
          </MenuItem>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to="/chi-siamo" onClick={() => setOpen(false)}>Chi Siamo</NavLink>
          </MenuItem>
          <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <NavLink to="/contatti" onClick={() => setOpen(false)}>Contatti</NavLink>
          </MenuItem>
        </Menu>
      </Container>
    </Nav>
  );
};

export default Navbar;
