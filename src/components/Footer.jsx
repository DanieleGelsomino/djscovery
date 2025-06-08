import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';

const Foot = styled(motion.footer)`
  background-color: #111;
  padding: 2rem 0;
  color: var(--white);
  text-align: center;
  border-top: 1px solid var(--gray);
`;

const Social = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;

  a {
    color: var(--yellow);
    font-size: 1.5rem;
    transition: color 0.3s, filter 0.3s;

    &:hover {
      color: var(--green);
      filter: drop-shadow(0 0 6px var(--yellow));
    }
  }
`;

const Menu = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  a {
    color: var(--yellow);
    margin: 0 0.25rem;
  }
`;

const Copy = styled.p`
  margin-top: 1rem;
  color: var(--green);
`;

const Footer = () => {
  const { t } = useLanguage();
  return (
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
      <p>{t('footer.text')}</p>
      <Menu>
        <Link to="/">{t('nav.home')}</Link>
        <Link to="/eventi">{t('nav.events')}</Link>
        <Link to="/shop">{t('nav.shop')}</Link>
        <Link to="/chi-siamo">{t('nav.about')}</Link>
        <Link to="/contatti">{t('nav.contacts')}</Link>
      </Menu>
      <Copy>&copy; {new Date().getFullYear()} {t('footer.copy')}</Copy>
    </div>
  </Foot>
  );
};

export default Footer;
