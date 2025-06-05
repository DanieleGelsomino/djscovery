import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import EventiSection from './components/EventiSection';
import ShopSection from './components/ShopSection';
import ChiSiamoSection from './components/ChiSiamoSection';
import ContattiSection from './components/ContattiSection';
import Footer from './components/Footer';

const App = () => {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HeroSection />} />
          <Route path="/eventi" element={<EventiSection />} />
          <Route path="/shop" element={<ShopSection />} />
          <Route path="/chi-siamo" element={<ChiSiamoSection />} />
          <Route path="/contatti" element={<ContattiSection />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </>
  );
};

export default App;
