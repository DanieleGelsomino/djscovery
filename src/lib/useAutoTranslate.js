import { useEffect, useMemo, useRef, useState } from 'react';

// Lightweight client-side auto-translate with localStorage cache.
// Uses MyMemory public API as a best-effort fallback. If it fails, returns original text.
// Cache key: tr::<from>::<to>::<hash(text)>

function hashText(s) {
  try {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  } catch { return String(Date.now()); }
}

function getCache(from, to, text) {
  const key = `tr::${from}::${to}::${hashText(text || '')}`;
  try { return [key, localStorage.getItem(key)]; } catch { return [key, null]; }
}

export default function useAutoTranslate(text, from = 'it', to = 'en') {
  const base = String(text || '').trim();
  const [translated, setTranslated] = useState(base);
  const lastReqRef = useRef(null);

  // Avoid translating if same language or empty
  const shouldTranslate = useMemo(() => {
    if (!base) return false;
    if (!to || from === to) return false;
    return true;
  }, [base, from, to]);

  useEffect(() => {
    if (!shouldTranslate) { setTranslated(base); return; }
    const [key, cached] = getCache(from, to, base);
    if (cached) { setTranslated(cached); return; }

    const ctrl = new AbortController();
    lastReqRef.current = ctrl;

    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', base);
    url.searchParams.set('langpair', `${from}|${to}`);
    // best-effort fetch with timeout
    const tid = setTimeout(() => ctrl.abort(), 4000);
    fetch(url.toString(), { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const out = String(data?.responseData?.translatedText || '').trim();
        if (out) {
          setTranslated(out);
          try { localStorage.setItem(key, out); } catch {}
        } else {
          setTranslated(base);
        }
      })
      .catch(() => setTranslated(base))
      .finally(() => clearTimeout(tid));

    return () => { try { ctrl.abort(); } catch {} };
  }, [base, from, to, shouldTranslate]);

  return translated;
}

