import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Section = styled(motion.section)`
  position: relative;
  background: url('https://source.unsplash.com/1600x900/?music,party') center/cover no-repeat;
  color: var(--white);
  text-align: center;
  padding: 4rem 0;
  overflow: hidden;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
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

const BtnPrimary = styled(Link)`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  background-color: var(--green);
  color: var(--white);
  font-weight: bold;
`;

const BtnSecondary = styled(Link)`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  background-color: var(--yellow);
  color: var(--black);
  font-weight: bold;
`;

const HeroSection = () => (
  <Section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <Overlay />
    <Content>
      <h1>Music &amp; Travel</h1>
      <p>DJSCOVERY was born from the idea of blending music with the discovery of authentic places.</p>
      <CTAWrapper>
        <BtnPrimary to="/eventi">Scopri i prossimi eventi</BtnPrimary>
        <BtnSecondary to="/shop">Visita lo shop</BtnSecondary>
      </CTAWrapper>
    </Content>
  </Section>
);

export default HeroSection;
