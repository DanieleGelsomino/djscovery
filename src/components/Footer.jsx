import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';

const Foot = styled(motion.footer)`
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
    font-size: 1.5rem;
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
  <Foot initial={{opacity:0}} animate={{opacity:1}}>
    <div className="container">
      <Social>
        <motion.a whileHover={{ scale: 1.2 }} href="https://instagram.com/djscovery.tv" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </motion.a>
        <motion.a whileHover={{ scale: 1.2 }} href="#">
          <FaFacebook />
        </motion.a>
        <motion.a whileHover={{ scale: 1.2 }} href="#">
          <FaYoutube />
        </motion.a>
      </Social>
      <p>Lorem ipsum dolor sit amet.</p>
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
