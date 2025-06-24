import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { FaUserCircle } from 'react-icons/fa';
import HeroSection from './HeroSection';
import HomeGallerySlider from './HomeGallerySlider';
import NewsletterSection from './NewsletterSection';

const LoginLink = styled(motion(Link))`
  position: fixed;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  color: var(--yellow);
  z-index: 1500;
`;

const HomePage = () => (
  <>
    <LoginLink to="/admin" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} aria-label="Admin login">
      <FaUserCircle />
    </LoginLink>
    <HeroSection />
    <HomeGallerySlider />
    <NewsletterSection />
  </>
);

export default HomePage;
