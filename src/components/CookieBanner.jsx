import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useCookieConsent } from "./CookieConsentContext";
import { useLanguage } from "./LanguageContext";

const Bar = styled(motion.section)`
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 20000;
  color: #fff;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(0,0,0,0.5);
  background: radial-gradient(120% 140% at 10% 10%, rgba(40,40,40,0.95) 0%, rgba(18,18,18,0.95) 60%);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  max-height: min(90vh, 560px);
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  @media (max-width: 560px) {
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
    border-radius: 14px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  @media (max-width: 560px) {
    font-size: 1.05rem;
    text-align: center;
  }
`;

const Body = styled.div`
  padding: 0 16px calc(14px + env(safe-area-inset-bottom)) 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const Btn = styled.button`
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: transform var(--transition-fast, 120ms), background 180ms, border-color 180ms, opacity 180ms;
  &:hover { transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid var(--yellow, #ffd166); outline-offset: 2px; }
  @media (max-width: 560px) {
    min-height: 44px; /* tap target */
  }
`;

const Primary = styled(Btn)`
  background: linear-gradient(90deg, #ffd166, #f4c65a);
  color: #1a1a1a;
  border: 1px solid rgba(0,0,0,0.15);
  @media (max-width: 560px) { width: 100%; }
`;

const Ghost = styled(Btn)`
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.22);
  @media (max-width: 560px) { width: 100%; }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: 560px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`;

const ToggleWrap = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
`;

const Toggle = styled.span`
  position: relative;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  display: inline-block;
  vertical-align: middle;
  transition: background 180ms;
  &:after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    transition: transform 180ms;
  }
  &.on { background: #21bf73; }
  &.on:after { transform: translateX(18px); }
`;

const Switch = ({ label, help, checked, onChange, disabled }) => (
  <ToggleWrap aria-disabled={disabled} title={help || ''}>
    <div style={{ display: 'grid' }}>
      <strong style={{ fontSize: '0.92rem' }}>{label}</strong>
      {help ? (
        <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>{help}</span>
      ) : null}
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      disabled={disabled}
      aria-checked={checked}
    />
    <Toggle className={checked ? 'on' : ''} aria-hidden />
  </ToggleWrap>
);

export default function CookieBanner() {
  const { accepted, prefs, setPrefs, acceptAll, rejectAll, managerOpen, closeManager } = useCookieConsent();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [local, setLocal] = useState(prefs);
  const firstFocusable = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

  useEffect(() => {
    const willOpen = !accepted || managerOpen;
    setOpen(willOpen);
    setExpanded(willOpen && managerOpen); // se aperto dal footer, apri direttamente preferenze
  }, [accepted, managerOpen]);

  // Body scroll lock while banner is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Focus management + trap within banner
  useEffect(() => {
    if (!open) return;
    // set initial focus
    setTimeout(() => { firstFocusable.current?.focus?.(); }, 0);
    const root = barRef.current;
    if (!root) return;
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const getFocusables = () => Array.from(root.querySelectorAll(selector)).filter(el => !el.hasAttribute('disabled'));
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (expanded) { setExpanded(false); e.stopPropagation(); }
      } else if (e.key === 'Tab') {
        const list = getFocusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [open, expanded]);

  const onSave = () => {
    setPrefs(local);
    setExpanded(false);
    closeManager();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <Bar
        ref={barRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        aria-describedby="cookie-desc"
      >
        <Header>
          <Title id="cookie-title">{t("cookies.title")}</Title>
          <Actions>
            <Ghost
              ref={firstFocusable}
              onClick={() => {
                rejectAll();
                setExpanded(false);
                closeManager();
              }}
              aria-label={t("cookies.reject_all") + " (non necessari)"}
            >
              {t("cookies.reject_all")}
            </Ghost>
            <Primary onClick={() => { acceptAll(); closeManager(); setExpanded(false); }} aria-label={t("cookies.accept_all") + " cookie"}>
              {t("cookies.accept_all")}
            </Primary>
          </Actions>
        </Header>
        <Body>
          <p id="cookie-desc" style={{ margin: 0, opacity: 0.9 }}>
            {t("cookies.description")} {" "}
            <a href="/cookie" style={{ color: '#ffd166' }}>{t("cookies.cookie_policy")}</a>{" • "}
            <a href="/privacy" style={{ color: '#ffd166' }}>{t("cookies.privacy_policy")}</a>.
          </p>

          <div style={{ height: 10 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="cookie-prefs">
              {expanded ? t("cookies.close_prefs") : t("cookies.manage_prefs")}
            </Btn>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                id="cookie-prefs"
                key="prefs"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ height: 10 }} />
                <div style={{ display: "grid", gap: 8 }}>
                  <Switch
                    label={t("cookies.categories.necessary.label")}
                    help={t("cookies.categories.necessary.help")}
                    checked={true}
                    onChange={() => {}}
                    disabled
                  />
                  <Switch
                    label={t("cookies.categories.functional.label")}
                    help={t("cookies.categories.functional.help")}
                    checked={!!local.functional}
                    onChange={(v) => setLocal((s) => ({ ...s, functional: v }))}
                  />
                  <Switch
                    label={t("cookies.categories.analytics.label")}
                    help={t("cookies.categories.analytics.help")}
                    checked={!!local.analytics}
                    onChange={(v) => setLocal((s) => ({ ...s, analytics: v }))}
                  />
                  <Switch
                    label={t("cookies.categories.marketing.label")}
                    help={t("cookies.categories.marketing.help")}
                    checked={!!local.marketing}
                    onChange={(v) => setLocal((s) => ({ ...s, marketing: v }))}
                  />
                </div>
                <div style={{ height: 10 }} />
                <Row>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Primary onClick={onSave}>{t("cookies.save_prefs")}</Primary>
                    <Ghost onClick={() => { closeManager(); setOpen(false); }}>{t("cookies.close_prefs")}</Ghost>
                  </div>
                </Row>
              </motion.div>
            )}
          </AnimatePresence>
        </Body>
      </Bar>
    </AnimatePresence>
  );
}
