import React from "react";
import styled from "styled-components";
import { useLanguage } from "./LanguageContext";

const Section = styled.section`
  color: #fff;
  padding: 2rem 0 3rem;
  display: flex;
  justify-content: center;
`;
const Container = styled.div`
  width: 90%;
  max-width: 900px;
`;

export default function CookiePolicy() {
  const { lang } = useLanguage();
  const locale = lang === "en" ? "en" : "it";
  const content = {
    it: {
      title: "Cookie Policy",
      intro: "Questa informativa descrive l'uso di cookie e tecnologie simili su questo sito.",
      typesTitle: "Tipologie di cookie",
      types: [
        <><b>Tecnici (necessari)</b>: garantiscono il funzionamento del sito.</>,
        <><b>Funzionali</b>: ricordano preferenze e migliorano l'esperienza.</>,
        <><b>Analitici</b>: raccolgono statistiche aggregate e anonime.</>,
        <><b>Marketing</b>: per contenuti e embed di terze parti (es. Spotify/YouTube/Maps).</>,
      ],
      consentTitle: "Gestione del consenso",
      consentBody: "Puoi modificare le preferenze in qualsiasi momento tramite il banner cookie (link “Gestisci cookie”). I cookie non necessari sono attivati solo previo consenso.",
      thirdPartyTitle: "Terze parti",
      thirdPartyBody: "Servizi integrati possono impostare cookie propri. Consulta le relative policy (es. Google/YouTube/Spotify).",
      contactTitle: "Contatti",
      contactBody: (
        <>
          Per informazioni scrivi a <a href="mailto:info@djscovery.it">info@djscovery.it</a>.
        </>
      ),
    },
    en: {
      title: "Cookie Policy",
      intro: "This notice explains how cookies and similar technologies are used on this website.",
      typesTitle: "Cookie categories",
      types: [
        <><b>Technical (necessary)</b>: ensure the website works correctly.</>,
        <><b>Functional</b>: remember preferences and enhance the experience.</>,
        <><b>Analytics</b>: collect aggregated, anonymised statistics.</>,
        <><b>Marketing</b>: enable third-party embeds and content (e.g. Spotify/YouTube/Maps).</>,
      ],
      consentTitle: "Managing consent",
      consentBody: "You can update your choices at any time through the cookie banner (“Manage cookies”). Non-essential cookies are activated only after consent.",
      thirdPartyTitle: "Third parties",
      thirdPartyBody: "Embedded services may set their own cookies. Please refer to their respective policies (e.g. Google/YouTube/Spotify).",
      contactTitle: "Contact",
      contactBody: (
        <>
          For further information email <a href="mailto:info@djscovery.it">info@djscovery.it</a>.
        </>
      ),
    },
  };
  const L = content[locale];

  return (
    <Section>
      <Container>
        <h1>{L.title}</h1>
        <p>{L.intro}</p>
        <h2>{L.typesTitle}</h2>
        <ul>
          {L.types.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <h2>{L.consentTitle}</h2>
        <p>{L.consentBody}</p>
        <h2>{L.thirdPartyTitle}</h2>
        <p>{L.thirdPartyBody}</p>
        <h2>{L.contactTitle}</h2>
        <p>{L.contactBody}</p>
      </Container>
    </Section>
  );
}
