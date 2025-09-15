import React from "react";
import { formatDMY } from "../lib/date";
import styled from "styled-components";
import { motion } from "framer-motion";

// Puoi centralizzare questi dati in APP_CONFIG o .env
const ORG_NAME =
    (window.APP_CONFIG && window.APP_CONFIG.ORG_NAME) ||
    import.meta.env.VITE_ORG_NAME ||
    "DJSCOVERY";
const ORG_EMAIL =
    (window.APP_CONFIG && window.APP_CONFIG.ORG_EMAIL) ||
    import.meta.env.VITE_ORG_EMAIL ||
    "info@example.com";
const ORG_ADDRESS =
    (window.APP_CONFIG && window.APP_CONFIG.ORG_ADDRESS) ||
    import.meta.env.VITE_ORG_ADDRESS ||
    "Indirizzo, CAP Città, Paese";
const ORG_PIVA =
    (window.APP_CONFIG && window.APP_CONFIG.ORG_PIVA) ||
    import.meta.env.VITE_ORG_PIVA ||
    "P. IVA 00000000000";
const SITE_URL =
    (window.APP_CONFIG && window.APP_CONFIG.SITE_URL) ||
    import.meta.env.VITE_SITE_URL ||
    "https://www.example.com";

const Section = styled.section`
  background:#000;
  color:#fff;
  padding: 2rem 0 3rem;
`;
const Card = styled(motion.div)`
  width:100%;
  max-width: 980px;
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.05);
  padding: 1.25rem;
  @media (min-width: 768px){ padding: 2rem; }
  h1,h2,h3{ margin-top: 1rem; }
  a{ color:#ffd54f; }
  ul{ margin: .5rem 0 1rem 1.2rem; }
  li{ margin: .25rem 0; }
  hr{ border:0; height:1px; background: rgba(255,255,255,.12); margin:1.25rem 0; }
`;

const PrivacyPolicy = () => {
    const lastUpdate = formatDMY(new Date());

    return (
        <Section>
            <div className="container">
                <Card
                    initial={{opacity:0, y:12}}
                    animate={{opacity:1, y:0}}
                    transition={{duration:.4, ease:"easeOut"}}
                >
                    <h1 style={{marginTop:0}}>Privacy Policy</h1>
                    <p><small>Ultimo aggiornamento: {lastUpdate}</small></p>

                    <p>
                        La presente informativa descrive il trattamento dei dati personali effettuato da
                        <strong> {` ${ORG_NAME} `}</strong> tramite il sito <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL}</a>.
                        Per qualsiasi richiesta puoi contattarci a{" "}
                        <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                    </p>

                    <h2>1) Titolare del trattamento</h2>
                    <p>
                        {ORG_NAME} — {ORG_ADDRESS} — {ORG_PIVA}<br />
                        Email: <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>
                    </p>

                    <h2>2) Tipologie di dati trattati</h2>
                    <ul>
                        <li><strong>Dati di navigazione</strong> (es. indirizzo IP, log tecnici, dati del dispositivo), generati dall’uso del sito.</li>
                        <li><strong>Dati comunicati dall’utente</strong> (es. nome, email, messaggio) tramite il form Contatti.</li>
                        <li><strong>Contatto via WhatsApp</strong>: se scegli di scriverci su WhatsApp, trattiamo i dati presenti nelle chat. Il servizio è fornito da WhatsApp Ireland Ltd.</li>
                        <li><strong>Prenotazioni/Eventi</strong>: nome, cognome, email, telefono, quantità biglietti e dettagli evento.</li>
                        <li><strong>Newsletter</strong> (se attivata): email e preferenze di iscrizione.</li>
                        <li><strong>Media/Gallery</strong>: il sito mostra immagini ospitate su Google Drive/Google CDN.</li>
                        <li><strong>Check-in con QR</strong> (area operatore): token/QR della prenotazione e contatori di ingresso.</li>
                        <li><strong>Area Admin</strong> (riservata): credenziali/account del personale autorizzato.</li>
                    </ul>

                    <h2>3) Finalità e basi giuridiche</h2>
                    <ul>
                        <li><em>Gestione richieste</em> tramite form contatti o WhatsApp → <strong>consenso</strong> (art. 6.1.a) e/o <strong>misure precontrattuali</strong> (art. 6.1.b).</li>
                        <li><em>Prenotazioni, organizzazione eventi e check-in</em> → <strong>contratto</strong> (art. 6.1.b) e <strong>obblighi di legge</strong> (art. 6.1.c).</li>
                        <li><em>Newsletter</em> → <strong>consenso</strong> (art. 6.1.a), revocabile in ogni momento.</li>
                        <li><em>Sicurezza del sito e prevenzione abusi</em> → <strong>legittimo interesse</strong> del Titolare (art. 6.1.f).</li>
                        <li><em>Adempimenti legali</em> e gestione contabile/fiscale → <strong>obbligo di legge</strong> (art. 6.1.c).</li>
                    </ul>

                    <h2>4) Conferimento dei dati</h2>
                    <p>
                        Il conferimento dei dati contrassegnati come obbligatori è necessario per fornire il servizio richiesto
                        (es. prenotazione, risposta a un messaggio). L’eventuale rifiuto può impedire l’erogazione del servizio.
                    </p>

                    <h2>5) Modalità del trattamento e conservazione</h2>
                    <p>
                        I dati sono trattati con strumenti elettronici e misure di sicurezza adeguate. I tempi di conservazione
                        variano in base alla finalità:
                    </p>
                    <ul>
                        <li>Contatti: per il tempo necessario a evadere la richiesta e fino a 24 mesi per storico commerciale.</li>
                        <li>Prenotazioni e documenti amministrativi: fino a 10 anni per obblighi di legge.</li>
                        <li>Newsletter: fino a revoca del consenso/disiscrizione.</li>
                        <li>Log tecnici di sicurezza: in genere 6–12 mesi salvo esigenze di indagine.</li>
                    </ul>

                    <h2>6) Destinatari e fornitori</h2>
                    <p>
                        I dati possono essere comunicati a soggetti che erogano servizi al Titolare, in qualità di responsabili del trattamento,
                        tra cui a titolo esemplificativo:
                    </p>
                    <ul>
                        <li><strong>Hosting/Cloud</strong> e piattaforme tecniche.</li>
                        <li><strong>Google LLC</strong> (es. Google Drive/Google Photos CDN per la gallery, servizi Firebase se utilizzati).</li>
                        <li><strong>WhatsApp Ireland Ltd</strong> per le comunicazioni via chat.</li>
                        <li><strong>Geoapify / OpenStreetMap</strong> per suggerimenti luogo e mappe nella creazione eventi.</li>
                        <li>Provider email/SMTP e strumenti di invio newsletter (se attivi).</li>
                        <li>Consulenti e soggetti autorizzati dal Titolare (es. contabili, legali).</li>
                    </ul>

                    <h2>7) Trasferimenti extra UE</h2>
                    <p>
                        Alcuni fornitori (es. Google LLC, WhatsApp/Meta) possono trattare dati anche fuori dallo Spazio Economico Europeo.
                        In tali casi, il trasferimento avviene sulla base di decisioni di adeguatezza o di garanzie adeguate
                        (es. <em>Standard Contractual Clauses</em>) secondo gli artt. 44-49 GDPR.
                    </p>

                    <h2>8) Diritti dell’interessato</h2>
                    <p>
                        In qualità di interessato puoi esercitare i diritti previsti dagli artt. 15-22 GDPR: accesso, rettifica, cancellazione,
                        limitazione, portabilità, opposizione, revoca del consenso (senza pregiudicare la liceità del trattamento precedente).
                        Per esercitare i diritti o ottenere chiarimenti, scrivi a{" "}
                        <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                    </p>

                    <h2>9) Cookie e tecnologie simili</h2>
                    <p>
                        Il sito può utilizzare cookie tecnici e, se presenti, cookie/strumenti di terze parti. Per i dettagli
                        consulta la <a href="/cookie" rel="noreferrer">Cookie Policy</a> (se disponibile) o contattaci.
                    </p>

                    <h2>10) Minori</h2>
                    <p>
                        I servizi non sono destinati a minori di 14 anni. Nel caso in cui vengano inviati dati di minori senza
                        consenso dei genitori/tutori, provvederemo alla cancellazione non appena venuti a conoscenza.
                    </p>

                    <h2>11) Aggiornamenti</h2>
                    <p>
                        Il Titolare si riserva di modificare la presente informativa. Le versioni aggiornate saranno pubblicate su
                        questa pagina con indicazione della data di ultimo aggiornamento.
                    </p>

                    <hr />
                    <p style={{opacity:.8, fontSize:".95rem"}}>
                        <strong>Nota</strong>: questo testo è un modello informativo e non costituisce consulenza legale.
                        Personalizzalo in base ai trattamenti effettivi e sottoponilo a revisione professionale.
                    </p>
                </Card>
            </div>
        </Section>
    );
};

export default PrivacyPolicy;
