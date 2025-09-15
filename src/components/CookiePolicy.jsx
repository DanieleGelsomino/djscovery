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

export default function CookiePolicy() {
  return (
    <Section>
      <Container>
        <h1>Cookie Policy</h1>
        <p>Questa informativa descrive l'uso di cookie e tecnologie simili su questo sito.</p>
        <h2>Tipologie di cookie</h2>
        <ul>
          <li><b>Tecnici (necessari)</b>: garantiscono il funzionamento del sito.</li>
          <li><b>Funzionali</b>: ricordano preferenze e migliorano l'esperienza.</li>
          <li><b>Analitici</b>: raccolgono statistiche aggregate e anonime.</li>
          <li><b>Marketing</b>: per contenuti e embed di terze parti (es. Spotify/YouTube/Maps).</li>
        </ul>
        <h2>Gestione del consenso</h2>
        <p>Puoi modificare le preferenze in qualsiasi momento tramite il banner cookie (link “Gestisci cookie”). I cookie non necessari sono attivati solo previo consenso.</p>
        <h2>Terze parti</h2>
        <p>Servizi integrati possono impostare cookie propri. Consulta le relative policy (es. Google/YouTube/Spotify).</p>
        <h2>Contatti</h2>
        <p>Per informazioni scrivi a <a href="mailto:info@djscovery.it">info@djscovery.it</a>.</p>
      </Container>
    </Section>
  );
}

