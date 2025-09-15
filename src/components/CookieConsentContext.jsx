import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "cookie-consent:v1";
const CONSENT_MAX_AGE_DAYS = 180; // re-chiedi il consenso dopo ~6 mesi

const defaultPrefs = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

const CookieCtx = createContext({
  prefs: defaultPrefs,
  accepted: false,
  setPrefs: () => {},
  acceptAll: () => {},
  openManager: () => {},
  closeManager: () => {},
  managerOpen: false,
});

export function CookieConsentProvider({ children }) {
  const [prefs, setPrefsState] = useState(defaultPrefs);
  const [accepted, setAccepted] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const j = JSON.parse(raw);
        if (j && typeof j === "object") {
          const stored = { ...defaultPrefs, ...j.prefs };
          const ts = Number(j.ts || 0);
          let isExpired = false;
          if (ts) {
            const ageMs = Date.now() - ts;
            const maxMs = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
            isExpired = ageMs > maxMs;
          }
          setPrefsState(stored);
          setAccepted(!isExpired && !!j.accepted);
          if (isExpired) {
            // ripropone banner ma mantiene le preferenze precedenti come base
            setManagerOpen(true);
          }
        }
      }
    } catch {}
  }, []);

  const persist = (p, a) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ prefs: p, accepted: a, ts: Date.now() }));
    } catch {}
  };

  const setPrefs = (next) => {
    const merged = { ...prefs, ...next, necessary: true };
    setPrefsState(merged);
    setAccepted(true);
    persist(merged, true);
    // fire-and-forget log to backend (best effort)
    try {
      fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: merged }),
      });
    } catch {}
  };

  const acceptAll = () => setPrefs({ functional: true, analytics: true, marketing: true });
  const rejectAll = () => setPrefs({ functional: false, analytics: false, marketing: false });

  const value = useMemo(
    () => ({
      prefs,
      accepted,
      setPrefs,
      acceptAll,
      rejectAll,
      managerOpen,
      openManager: () => setManagerOpen(true),
      closeManager: () => setManagerOpen(false),
    }),
    [prefs, accepted, managerOpen]
  );

  return <CookieCtx.Provider value={value}>{children}</CookieCtx.Provider>;
}

export function useCookieConsent() {
  return useContext(CookieCtx);
}
