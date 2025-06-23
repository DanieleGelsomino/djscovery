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
  background-repeat: no-repeat;
  background-position: center;
  transform-origin: center;
`;

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  padding: 0 1rem;

  h1 {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 700;
  }

  p {
    font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  }
`;

const CTAWrapper = styled(motion.div)`
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
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
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
        <CTAWrapper
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <BtnPrimary
            to="/eventi"
            whileHover={{ scale: 1.05, boxShadow: '0 0 12px var(--yellow)' }}
            whileTap={{ scale: 0.95 }}
          >
            {t('hero.cta_events')}
          </BtnPrimary>
        </CTAWrapper>
      </Content>
    </Section>
  );
};

export default HeroSection;
