import React from "react";
import styled from "styled-components";

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
  return (
    <Section>
      <Container>
        <h1>Termini di Servizio</h1>
        <p>Queste condizioni disciplinano l'uso del sito e dei servizi offerti da Djscovery.</p>
        <h2>Uso del servizio</h2>
        <p>L'uso del sito è consentito nel rispetto delle leggi vigenti e dei presenti termini. È vietato ogni uso illecito, fraudolento o che arrechi danno a terzi.</p>
        <h2>Account e accesso area riservata</h2>
        <p>L'accesso all'area amministrativa è riservato al personale autorizzato. Le credenziali non devono essere condivise con terzi.</p>
        <h2>Prenotazioni ed eventi</h2>
        <p>Le prenotazioni sono gestite secondo le condizioni esposte nelle pagine evento. Qualora previsto un pagamento, i prezzi sono IVA inclusa salvo diversa indicazione.</p>
        <h2>Proprietà intellettuale</h2>
        <p>Tutti i contenuti (testi, immagini, loghi) sono protetti da diritto d'autore. È vietata la riproduzione non autorizzata.</p>
        <h2>Limitazione di responsabilità</h2>
        <p>Il sito è fornito "così com'è". Non garantiamo assenza di errori o interruzioni. Non siamo responsabili per utilizzi impropri del servizio.</p>
        <h2>Privacy</h2>
        <p>Il trattamento dei dati personali avviene secondo la <a href="/privacy">Privacy Policy</a>.</p>
        <h2>Contatti</h2>
        <p>Per chiarimenti sui termini scrivi a <a href="mailto:info@djscovery.it">info@djscovery.it</a>.</p>
      </Container>
    </Section>
  );
}

