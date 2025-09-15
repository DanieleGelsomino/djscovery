import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { useCookieConsent } from "./CookieConsentContext";

const Section = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 0 2rem;
`;

const Container = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled(motion.h1)`
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  margin: 0 0 1rem 0;
`;

const Subtitle = styled(motion.p)`
  font-size: clamp(1rem, 2vw, 1.1rem);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
`;

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 70vh;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background: #111;

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const TappeSection = () => {
  const { t } = useLanguage();
  const { prefs, openManager } = useCookieConsent();

  // Google My Maps embed URL built from the provided viewer link
  const mapSrc =
    "https://www.google.com/maps/d/embed?mid=1S-o7lJgNp51i45jvwc1xdgLxvEW4NGs&ll=44.47578008542562,11.31696511077221&z=5";

  return (
    <Section>
      <Container>
        <Title initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {t("tappe.title") || t("nav.tappe") || "Tappe"}
        </Title>
        <Subtitle initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {t("tappe.subtitle") ||
            "Consulta la mappa aggiornata con tutte le tappe e i segnaposti già presenti. Clicca su un punto per vedere dettagli e indicazioni."}
        </Subtitle>
        {prefs.functional ? (
          <MapWrapper>
            <iframe
              title="Tappe Djscovery - Mappa"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              aria-label="Mappa tappe Djscovery con segnaposti"
            />
          </MapWrapper>
        ) : (
          <MapWrapper style={{ display: "grid", placeItems: "center", padding: 16 }}>
            <div style={{ textAlign: "center", maxWidth: 520 }}>
              <p style={{ opacity: 0.9 }}>
                Per visualizzare la mappa abilita i cookie funzionali nelle preferenze.
              </p>
              <button
                onClick={openManager}
                style={{
                  marginTop: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Gestisci cookie
              </button>
            </div>
          </MapWrapper>
        )}
      </Container>
    </Section>
  );
};

export default TappeSection;
