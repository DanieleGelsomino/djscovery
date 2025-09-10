import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useLanguage } from './LanguageContext';

const Wrapper = styled.div`
  position: relative;
`;

const Chip = styled.button`
  appearance: none;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.06);
  color: var(--white);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-med), border-color var(--transition-med);
  &:hover { transform: translateY(-1px); border-color: rgba(255,255,255,.28); background: rgba(255,255,255,.12); }
  &:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
`;

const Flag = styled.span`
  font-size: 1rem;
  line-height: 1;
`;

const Code = styled.span`
  font-weight: 800;
  letter-spacing: .3px;
`;

const Menu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  min-width: 160px;
  background: rgba(17,17,17,.95);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0,0,0,.45);
  padding: 6px;
  z-index: 3000;
  backdrop-filter: blur(6px);
`;

const Item = styled.button`
  appearance: none;
  border: 0;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition-med), transform var(--transition-fast);
  &:hover { background: rgba(255,255,255,.08); transform: translateY(-1px); }
  &.active { background: rgba(255,213,79,.18); color: var(--yellow); }
`;

const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const current = lang === 'it' ? { flag: '🇮🇹', code: 'IT', label: 'Italiano' } : { flag: '🇬🇧', code: 'EN', label: 'English' };

  return (
    <Wrapper ref={ref}>
      <Chip onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Language">
        <Flag aria-hidden>{current.flag}</Flag>
        <Code>{current.code}</Code>
      </Chip>
      {open && (
        <Menu role="menu" aria-label="Select language">
          <Item
            role="menuitemradio"
            aria-checked={lang === 'it'}
            className={lang === 'it' ? 'active' : ''}
            onClick={() => { setLang('it'); setOpen(false); }}
          >
            <span aria-hidden>🇮🇹</span>
            <span>Italiano</span>
          </Item>
          <Item
            role="menuitemradio"
            aria-checked={lang === 'en'}
            className={lang === 'en' ? 'active' : ''}
            onClick={() => { setLang('en'); setOpen(false); }}
          >
            <span aria-hidden>🇬🇧</span>
            <span>English</span>
          </Item>
        </Menu>
      )}
    </Wrapper>
  );
};

export default LanguageSelector;
