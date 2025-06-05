import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Foot = styled.footer`
  background-color: #111;
  padding: 2rem 0;
  color: var(--white);
  text-align: center;
`;

const Social = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;

  a {
    color: var(--yellow);
  }
`;

const Menu = styled.div`
  margin-top: 1rem;
  a {
    color: var(--yellow);
    margin: 0 0.5rem;
  }
`;

const Copy = styled.p`
  margin-top: 1rem;
  color: var(--green);
`;

const Footer = () => (
  <Foot>
    <div className="container">
      <Social>
        <motion.a whileHover={{ scale: 1.2 }} href="https://instagram.com/djscovery.tv" target="_blank" rel="noopener noreferrer">Instagram</motion.a>
        <motion.a whileHover={{ scale: 1.2 }} href="#">Facebook</motion.a>
        <motion.a whileHover={{ scale: 1.2 }} href="#">YouTube</motion.a>
      </Social>
      <Menu>
        <Link to="/">Home</Link>
        <Link to="/eventi">Eventi</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/chi-siamo">Chi Siamo</Link>
        <Link to="/contatti">Contatti</Link>
      </Menu>
      <Copy>&copy; {new Date().getFullYear()} DJSCOVERY</Copy>
    </div>
  </Foot>
);

export default Footer;
