import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import EventiSection from './components/EventiSection';
import GallerySection from './components/GallerySection';
import TappeSection from './components/TappeSection';
import ChiSiamoSection from './components/ChiSiamoSection';
import ContattiSection from './components/ContattiSection';
import Footer from './components/Footer';
import SpotifyFloatingWidget from './components/SpotifyFloatingWidget';
import TicketBookingForm from './components/TicketBookingForm';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import AdminRoute from './components/AdminRoute';
import NotFound from "./components/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy"; // 👈 aggiunta
import Thanks from "./components/Thanks";
import CookieBanner from "./components/CookieBanner";
import { CookieConsentProvider } from "./components/CookieConsentContext";
import Terms from "./components/Terms";
import CookiePolicy from "./components/CookiePolicy";
import AnalyticsGate from "./components/AnalyticsGate";
import SkipToContent from "./components/SkipToContent";

const Main = styled.main`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const App = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <CookieConsentProvider>
            <AnalyticsGate />
            <SkipToContent />
            {!isAdminRoute && <Navbar />}
            <Main id="main-content">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {/* Pubbliche */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/eventi" element={<EventiSection />} />
                        <Route path="/gallery" element={<GallerySection />} />
                        <Route path="/tappe" element={<TappeSection />} />
                        <Route path="/chi-siamo" element={<ChiSiamoSection />} />
                        <Route path="/contatti" element={<ContattiSection />} />
                        <Route path="/prenota" element={<TicketBookingForm />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/tos" element={<Terms />} />
                        <Route path="/cookie" element={<CookiePolicy />} />
                        <Route path="/thanks" element={<Thanks />} />


                        {/* Admin: login (puoi lasciare /admin oppure usare /admin/login) */}
                        <Route path="/admin" element={<AdminLogin />} />
                        {/* <Route path="/admin/login" element={<AdminLogin />} /> */}

                        {/* Admin: protetta da claim admin */}
                        <Route
                            path="/admin/panel"
                            element={
                                <AdminRoute>
                                    <AdminPanel />
                                </AdminRoute>
                            }
                        />

                        {/* opzionale: 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AnimatePresence>
            </Main>
            {!isAdminRoute && <CookieBanner />}
            {!isAdminRoute && <SpotifyFloatingWidget />}
            {!isAdminRoute && <Footer />}
        </CookieConsentProvider>
    );
};

export default App;
