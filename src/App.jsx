import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import EventiSection from './components/EventiSection';
import ShopSection from './components/ShopSection';
import ChiSiamoSection from './components/ChiSiamoSection';
import ContattiSection from './components/ContattiSection';
import Footer from './components/Footer';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/eventi" element={<EventiSection />} />
        <Route path="/shop" element={<ShopSection />} />
        <Route path="/chi-siamo" element={<ChiSiamoSection />} />
        <Route path="/contatti" element={<ContattiSection />} />
      </Routes>
      <Footer />
    </>
  );
};

export default App;
