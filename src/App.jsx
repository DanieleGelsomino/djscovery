import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import EventiSection from './components/EventiSection';
import GallerySection from './components/GallerySection';
import ChiSiamoSection from './components/ChiSiamoSection';
import ContattiSection from './components/ContattiSection';
import Footer from './components/Footer';
import TicketBookingForm from './components/TicketBookingForm';

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const App = () => {
  const location = useLocation();
  return (
    <>
      <Navbar />
      <Main>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/eventi" element={<EventiSection />} />
            <Route path="/gallery" element={<GallerySection />} />
            <Route path="/chi-siamo" element={<ChiSiamoSection />} />
            <Route path="/contatti" element={<ContattiSection />} />
            <Route path="/prenota" element={<TicketBookingForm />} />
          </Routes>
        </AnimatePresence>
      </Main>
      <Footer />
    </>
  );
};

export default App;
