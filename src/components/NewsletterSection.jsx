import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { FaWhatsapp } from "react-icons/fa";
import heroImg from "../assets/img/newsletter.jpg";

const Section = styled.section`
  position: relative;
  padding: 5rem 0; /* + altezza verticale */
  min-height: 55vh; /* assicura presenza visiva della sezione */
  color: var(--white);
  text-align: center;
  overflow: hidden;
  background-image: url(${heroImg});
  background-size: cover;
  background-position: center;

  @media (max-width: 640px) {
    padding: 4rem 0;
    min-height: 50vh;
  }
`;
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
  z-index: 0;
`;
const Content = styled.div`
  position: relative;
  z-index: 1;
`;
const CTAGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin: 1rem auto 0;
  width: 100%;
  max-width: 800px; /* più ampio su desktop */
  grid-template-columns: 1fr; /* una sola colonna: card a piena larghezza */
  align-items: stretch; /* assicura altezze uguali tra le card */
`;

// Widget card con bordo sfumato animato
const Card = styled(motion.article)`
  position: relative;
  isolation: isolate;
  background: rgba(0, 0, 0, 0.32);
  padding: 1.25rem;
  border-radius: 16px;
  color: var(--white);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  display: flex; /* layout verticale per uniformare gli spazi */
  flex-direction: column;
  height: 100%;

  /* tipografia coerente */
  h3 {
    margin: 0 0 0.25rem;
  }
  p {
    margin: 0 0 1rem;
  }

  &:before {
    content: "";
    position: absolute;
    inset: -2px;
    background: conic-gradient(
      from 180deg at 50% 50%,
      #00ffab,
      #ffe066,
      #00c2ff,
      #ff6ec7,
      #00ffab
    );
    filter: blur(18px);
    opacity: 0.18;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  &:hover:before {
    opacity: 0.3;
  }

  @media (prefers-reduced-motion: reduce) {
    &:before {
      display: none;
    }
  }
`;

const ButtonRow = styled.div`
  margin-top: auto; /* spinge il bottone in basso per allinearlo tra le card */
  display: grid;
  justify-items: stretch; /* piena larghezza su mobile */

  @media (min-width: 520px) {
    justify-items: center; /* su desktop torna centrato */
  }
`;

const CTAButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--yellow);
  color: var(--black);
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  outline: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  width: 100%; /* piena larghezza su mobile */
  text-align: center;
  transition: color var(--transition-med);

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(255, 213, 79, 0.65),
      0 6px 18px rgba(0, 0, 0, 0.35);
  }

  @media (min-width: 520px) {
    width: auto; /* desktop: dimensione in base al contenuto */
    min-width: 220px;
  }

  &:hover {
    color: var(--red);
  }
`;

const IconBubble = styled(motion.div)`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
`;

const NewsletterSection = () => {
  const { t } = useLanguage();
  const waUrl =
    import.meta.env.VITE_WHATSAPP_COMMUNITY_URL ||
    "https://chat.whatsapp.com/HheBIUyTc9R6MuPcGu7guj?mode=ems_sms_t";

  return (
    <Section>
      <Overlay />
      <Content className="container">
        <h2>{t("cta.title") || "Unisciti alla community"}</h2>
        <p style={{ opacity: 0.9 }}>
          {t("cta.subtitle") ||
            "Seguici su WhatsApp e ascolta la nostra playlist su Spotify."}
        </p>

        <CTAGrid>
          <Card
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            aria-labelledby="cta-whatsapp-title"
          >
            <IconBubble
              aria-hidden="true"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FaWhatsapp size={24} color="#25D366" />
            </IconBubble>
            <h3 id="cta-whatsapp-title" style={{ marginTop: 0 }}>
              {t("cta.whatsapp.title") || "Community WhatsApp"}
            </h3>
            <p style={{ opacity: 0.9 }}>
              {t("cta.whatsapp.subtitle") ||
                "Annunci, aggiornamenti e backstage in tempo reale."}
            </p>
            <ButtonRow>
              <CTAButton
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={"Unisciti ora"}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                🔥 Unisciti ora
              </CTAButton>
            </ButtonRow>
          </Card>
        </CTAGrid>
      </Content>
    </Section>
  );
};

export default NewsletterSection;
