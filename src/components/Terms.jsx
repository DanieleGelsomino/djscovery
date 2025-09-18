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

export default function Terms() {
  const { lang } = useLanguage();
  const locale = lang === "en" ? "en" : "it";
  const content = {
    it: {
      title: "Termini di Servizio",
      intro: "Queste condizioni disciplinano l'uso del sito e dei servizi offerti da Djscovery.",
      sections: [
        {
          title: "Uso del servizio",
          body: "L'uso del sito è consentito nel rispetto delle leggi vigenti e dei presenti termini. È vietato ogni uso illecito, fraudolento o che arrechi danno a terzi.",
        },
        {
          title: "Account e accesso area riservata",
          body: "L'accesso all'area amministrativa è riservato al personale autorizzato. Le credenziali non devono essere condivise con terzi.",
        },
        {
          title: "Prenotazioni ed eventi",
          body: "Le prenotazioni sono gestite secondo le condizioni esposte nelle pagine evento. Qualora previsto un pagamento, i prezzi sono IVA inclusa salvo diversa indicazione.",
        },
        {
          title: "Proprietà intellettuale",
          body: "Tutti i contenuti (testi, immagini, loghi) sono protetti da diritto d'autore. È vietata la riproduzione non autorizzata.",
        },
        {
          title: "Limitazione di responsabilità",
          body: "Il sito è fornito \"così com'è\". Non garantiamo assenza di errori o interruzioni. Non siamo responsabili per utilizzi impropri del servizio.",
        },
        {
          title: "Privacy",
          body: (
            <>
              Il trattamento dei dati personali avviene secondo la <a href="/privacy">Privacy Policy</a>.
            </>
          ),
        },
        {
          title: "Contatti",
          body: (
            <>
              Per chiarimenti sui termini scrivi a <a href="mailto:info@djscovery.it">info@djscovery.it</a>.
            </>
          ),
        },
      ],
    },
    en: {
      title: "Terms of Service",
      intro: "These terms govern the use of the website and services provided by Djscovery.",
      sections: [
        {
          title: "Use of the service",
          body: "The website may be used in compliance with applicable laws and these terms. Any unlawful, fraudulent or harmful use is forbidden.",
        },
        {
          title: "Accounts and restricted area",
          body: "Access to the admin area is reserved for authorised staff. Credentials must not be shared with third parties.",
        },
        {
          title: "Bookings and events",
          body: "Bookings are managed according to the conditions shown on each event page. Where payments apply, prices include VAT unless otherwise stated.",
        },
        {
          title: "Intellectual property",
          body: "All content (texts, images, logos) is protected by copyright. Unauthorised reproduction is prohibited.",
        },
        {
          title: "Limitation of liability",
          body: "The site is provided \"as is\". We do not guarantee error-free or uninterrupted operation and we are not liable for improper use of the service.",
        },
        {
          title: "Privacy",
          body: (
            <>
              Personal data is processed in accordance with the <a href="/privacy">Privacy Policy</a>.
            </>
          ),
        },
        {
          title: "Contact",
          body: (
            <>
              For questions about these terms please email <a href="mailto:info@djscovery.it">info@djscovery.it</a>.
            </>
          ),
        },
      ],
    },
  };
  const L = content[locale];

  return (
    <Section>
      <Container>
        <h1>{L.title}</h1>
        <p>{L.intro}</p>
        {L.sections.map((section) => (
          <React.Fragment key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </React.Fragment>
        ))}
      </Container>
    </Section>
  );
}
