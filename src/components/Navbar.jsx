import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Nav = styled(motion.nav)`
  background-color: ${({ scrolled }) => (scrolled ? 'var(--black)' : 'transparent')};
  padding: 1rem 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
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

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--yellow);
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

const Menu = styled.ul`
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

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Nav scrolled={scrolled} initial={{ y: -80 }} animate={{ y: 0 }}>
      <Container>
        <Logo to="/">DJSCOVERY</Logo>
        <Toggle onClick={() => setOpen(!open)}>&#9776;</Toggle>
        <Menu open={open}>
          <li><NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/eventi" onClick={() => setOpen(false)}>Eventi</NavLink></li>
          <li><NavLink to="/shop" onClick={() => setOpen(false)}>Shop</NavLink></li>
          <li><NavLink to="/chi-siamo" onClick={() => setOpen(false)}>Chi Siamo</NavLink></li>
          <li><NavLink to="/contatti" onClick={() => setOpen(false)}>Contatti</NavLink></li>
        </Menu>
      </Container>
    </Nav>
  );
};

export default Navbar;
