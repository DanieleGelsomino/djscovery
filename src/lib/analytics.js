// src/lib/analytics.js
// Minimal Google Analytics (gtag) init gated by consent

let loaded = false;

function hasDNT() {
  try {
    const dnt = (navigator && (navigator.doNotTrack || navigator.msDoNotTrack)) || (window && window.doNotTrack);
    return String(dnt) === '1' || String(dnt) === 'yes';
  } catch {
    return false;
  }
}

function loadScript(id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById('ga-gtag')) return resolve();
    const s = document.createElement('script');
    s.id = 'ga-gtag';
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function updateConsent(prefs) {
  try {
    const analyticsGranted = !!prefs?.analytics;
    const marketingGranted = !!prefs?.marketing;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: analyticsGranted ? 'granted' : 'denied',
        ad_storage: marketingGranted ? 'granted' : 'denied',
      });
    }
  } catch {}
}

export async function initAnalytics(prefs) {
  try {
    if (loaded) {
      updateConsent(prefs);
      return true;
    }
    const MEASUREMENT_ID = (import.meta && import.meta.env && import.meta.env.VITE_GA_MEASUREMENT_ID) || '';
    if (!MEASUREMENT_ID) return false;
    if (hasDNT()) return false;

    // Pre-init dataLayer + consent defaults before loading gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      functionality_storage: 'granted', // necessary cookies allowed
      security_storage: 'granted',
    });
    gtag('js', new Date());

    await loadScript(MEASUREMENT_ID);

    // Configure GA4 with privacy-friendly defaults
    gtag('config', MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    loaded = true;
    updateConsent(prefs);
    return true;
  } catch {
    return false;
  }
}

