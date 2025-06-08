import React from 'react';
import styled from 'styled-components';
import { useLanguage } from './LanguageContext';

const Select = styled.select`
  background: none;
  border: 1px solid var(--yellow);
  color: var(--white);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;

const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();
  return (
    <Select value={lang} onChange={(e) => setLang(e.target.value)}>
      <option value="it">IT</option>
      <option value="en">EN</option>
    </Select>
  );
};

export default LanguageSelector;
