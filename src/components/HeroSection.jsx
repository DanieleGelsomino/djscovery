import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import heroImg from '../assets/img/hero.png';
import { useLanguage } from './LanguageContext';

const Section = styled(motion.section)`
  position: relative;
  height: 80vh;
  color: var(--white);
  text-align: center;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Background = styled(motion.div)`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform-origin: center;
`;

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  padding: 0 1rem;
`;

const CTAWrapper = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const BtnPrimary = styled(motion(Link))`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  background-color: var(--green);
  color: var(--white);
  font-weight: bold;
`;

const BtnSecondary = styled(motion(Link))`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  background-color: var(--yellow);
  color: var(--black);
  font-weight: bold;
`;

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Background
        style={{ backgroundImage: `url(${heroImg})` }}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Content>
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
        >
          {t('hero.title')}
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {t('hero.subtitle')}
        </motion.p>
        <CTAWrapper>
          <BtnPrimary to="/eventi" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t('hero.cta_events')}
          </BtnPrimary>
          <BtnSecondary to="/shop" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t('hero.cta_shop')}
          </BtnSecondary>
        </CTAWrapper>
      </Content>
    </Section>
  );
};

export default HeroSection;
