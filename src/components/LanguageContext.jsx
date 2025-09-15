import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '../locales/en.json';
import it from '../locales/it.json';

const translations = { en, it };

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('it');

  // Keep <html lang="..."> in sync for screen readers and SEO
  useEffect(() => {
    try { document.documentElement.setAttribute('lang', lang || 'it'); } catch {}
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      result = result ? result[k] : undefined;
    }
    return result !== undefined ? result : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
