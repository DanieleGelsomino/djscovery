import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import App from './App';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles, theme } from './styles/globalStyles';
import { CartProvider } from './components/CartContext';
import { LanguageProvider } from './components/LanguageContext';
import { ToastProvider } from './components/ToastContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ThemeProvider theme={theme}>
    <GlobalStyles />
    <LanguageProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <App />
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </LanguageProvider>
  </ThemeProvider>
);
