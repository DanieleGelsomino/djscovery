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
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import AdminRoute from './components/AdminRoute';
import NotFound from "./components/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy"; // 👈 aggiunta

const Main = styled.main`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const App = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Navbar />}
            <Main>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {/* Pubbliche */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/eventi" element={<EventiSection />} />
                        <Route path="/gallery" element={<GallerySection />} />
                        <Route path="/chi-siamo" element={<ChiSiamoSection />} />
                        <Route path="/contatti" element={<ContattiSection />} />
                        <Route path="/prenota" element={<TicketBookingForm />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />


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
            {!isAdminRoute && <Footer />}
        </>
    );
};

export default App;
