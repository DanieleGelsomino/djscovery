import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Section = styled(motion.section)`
  position: relative;
  height: 70vh;
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

const images = [
  'https://source.unsplash.com/1600x900/?music,party',
  'https://source.unsplash.com/1600x900/?concert',
  'https://source.unsplash.com/1600x900/?dj'
];

const HeroSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {images.map((img, i) => (
        <Background
          key={img}
          style={{ backgroundImage: `url(${img})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
      ))}
      <Overlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <Content>
        <motion.h1 initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          Music &amp; Travel
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae vehicula magna.
        </motion.p>
        <CTAWrapper>
          <BtnPrimary to="/eventi" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Scopri i prossimi eventi
          </BtnPrimary>
          <BtnSecondary to="/shop" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Visita lo shop
          </BtnSecondary>
        </CTAWrapper>
      </Content>
    </Section>
  );
};

export default HeroSection;
