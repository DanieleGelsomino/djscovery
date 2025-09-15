import { useEffect } from "react";
import { useCookieConsent } from "./CookieConsentContext";
import { initAnalytics, updateConsent } from "../lib/analytics";

// This component bridges cookie consent with Analytics loading.
// Place it inside CookieConsentProvider.
export default function AnalyticsGate() {
  const { prefs, accepted } = useCookieConsent();

  useEffect(() => {
    // Initialize GA only when analytics is granted.
    if (accepted && prefs?.analytics) {
      initAnalytics(prefs);
    } else {
      // If already loaded, still update consent to reflect current prefs.
      updateConsent(prefs);
    }
  }, [accepted, prefs]);

  return null;
}

