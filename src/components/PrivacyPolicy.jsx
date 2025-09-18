import React from "react";
import { formatDMY } from "../lib/date";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

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
    const { lang } = useLanguage();
    const locale = lang === "en" ? "en" : "it";
    const lastUpdate = formatDMY(new Date());

    const labels = {
        it: {
            title: "Privacy Policy",
            lastUpdated: "Ultimo aggiornamento",
            intro: (
                <>
                    La presente informativa descrive il trattamento dei dati personali effettuato da
                    <strong>{` ${ORG_NAME} `}</strong> tramite il sito <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL}</a>.
                    Per qualsiasi richiesta puoi contattarci a {" "}
                    <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                </>
            ),
            ownerTitle: "1) Titolare del trattamento",
            ownerBody: (
                <>
                    {ORG_NAME} — {ORG_ADDRESS} — {ORG_PIVA}<br />
                    Email: <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>
                </>
            ),
            dataTypesTitle: "2) Tipologie di dati trattati",
            dataTypes: [
                <><strong>Dati di navigazione</strong> (es. indirizzo IP, log tecnici, dati del dispositivo), generati dall’uso del sito.</>,
                <><strong>Dati comunicati dall’utente</strong> (es. nome, email, messaggio) tramite il form Contatti.</>,
                <><strong>Contatto via WhatsApp</strong>: se scegli di scriverci su WhatsApp, trattiamo i dati presenti nelle chat. Il servizio è fornito da WhatsApp Ireland Ltd.</>,
                <><strong>Prenotazioni/Eventi</strong>: nome, cognome, email, telefono, quantità biglietti e dettagli evento.</>,
                <><strong>Newsletter</strong> (se attivata): email e preferenze di iscrizione.</>,
                <><strong>Media/Gallery</strong>: il sito mostra immagini ospitate su Google Drive/Google CDN.</>,
                <><strong>Check-in con QR</strong> (area operatore): token/QR della prenotazione e contatori di ingresso.</>,
                <><strong>Area Admin</strong> (riservata): credenziali/account del personale autorizzato.</>,
            ],
            purposesTitle: "3) Finalità e basi giuridiche",
            purposes: [
                <><em>Gestione richieste</em> tramite form contatti o WhatsApp → <strong>consenso</strong> (art. 6.1.a) e/o <strong>misure precontrattuali</strong> (art. 6.1.b).</>,
                <><em>Prenotazioni, organizzazione eventi e check-in</em> → <strong>contratto</strong> (art. 6.1.b) e <strong>obblighi di legge</strong> (art. 6.1.c).</>,
                <><em>Newsletter</em> → <strong>consenso</strong> (art. 6.1.a), revocabile in ogni momento.</>,
                <><em>Sicurezza del sito e prevenzione abusi</em> → <strong>legittimo interesse</strong> del Titolare (art. 6.1.f).</>,
                <><em>Adempimenti legali</em> e gestione contabile/fiscale → <strong>obbligo di legge</strong> (art. 6.1.c).</>,
            ],
            provisionTitle: "4) Conferimento dei dati",
            provisionBody: "Il conferimento dei dati contrassegnati come obbligatori è necessario per fornire il servizio richiesto (es. prenotazione, risposta a un messaggio). L’eventuale rifiuto può impedire l’erogazione del servizio.",
            processingTitle: "5) Modalità del trattamento e conservazione",
            processingIntro: "I dati sono trattati con strumenti elettronici e misure di sicurezza adeguate. I tempi di conservazione variano in base alla finalità:",
            processingList: [
                "Contatti: per il tempo necessario a evadere la richiesta e fino a 24 mesi per storico commerciale.",
                "Prenotazioni e documenti amministrativi: fino a 10 anni per obblighi di legge.",
                "Newsletter: fino a revoca del consenso/disiscrizione.",
                "Log tecnici di sicurezza: in genere 6–12 mesi salvo esigenze di indagine.",
            ],
            recipientsTitle: "6) Destinatari e fornitori",
            recipientsIntro: "I dati possono essere comunicati a soggetti che erogano servizi al Titolare, in qualità di responsabili del trattamento, tra cui a titolo esemplificativo:",
            recipientsList: [
                "Hosting/Cloud e piattaforme tecniche.",
                "Google LLC (es. Google Drive/Google Photos CDN per la gallery, servizi Firebase se utilizzati).",
                "WhatsApp Ireland Ltd per le comunicazioni via chat.",
                "Geoapify / OpenStreetMap per suggerimenti luogo e mappe nella creazione eventi.",
                "Provider email/SMTP e strumenti di invio newsletter (se attivi).",
                "Consulenti e soggetti autorizzati dal Titolare (es. contabili, legali).",
            ],
            transferTitle: "7) Trasferimenti extra UE",
            transferBody: "Alcuni fornitori (es. Google LLC, WhatsApp/Meta) possono trattare dati anche fuori dallo Spazio Economico Europeo. In tali casi, il trasferimento avviene sulla base di decisioni di adeguatezza o di garanzie adeguate (es. Standard Contractual Clauses) secondo gli artt. 44-49 GDPR.",
            rightsTitle: "8) Diritti dell’interessato",
            rightsBody: (
                <>
                    In qualità di interessato puoi esercitare i diritti previsti dagli artt. 15-22 GDPR: accesso, rettifica, cancellazione,
                    limitazione, portabilità, opposizione, revoca del consenso (senza pregiudicare la liceità del trattamento precedente).
                    Per esercitare i diritti o ottenere chiarimenti, scrivi a {" "}
                    <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                </>
            ),
            cookiesTitle: "9) Cookie e tecnologie simili",
            cookiesBody: "Il sito può utilizzare cookie tecnici e, se presenti, cookie/strumenti di terze parti. Per i dettagli consulta la ",
            cookiesAfterLink: " (se disponibile) o contattaci.",
            minorsTitle: "10) Minori",
            minorsBody: "I servizi non sono destinati a minori di 14 anni. Nel caso in cui vengano inviati dati di minori senza consenso dei genitori/tutori, provvederemo alla cancellazione non appena venuti a conoscenza.",
            updatesTitle: "11) Aggiornamenti",
            updatesBody: "Il Titolare si riserva di modificare la presente informativa. Le versioni aggiornate saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.",
            note: (
                <>
                    <strong>Nota</strong>: questo testo è un modello informativo e non costituisce consulenza legale.
                    Personalizzalo in base ai trattamenti effettivi e sottoponilo a revisione professionale.
                </>
            ),
        },
        en: {
            title: "Privacy Policy",
            lastUpdated: "Last updated",
            intro: (
                <>
                    This notice describes how <strong>{` ${ORG_NAME} `}</strong> processes personal data through the website <a href={SITE_URL} target="_blank" rel="noreferrer">{SITE_URL}</a>.
                    For any request you can reach us at {" "}
                    <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                </>
            ),
            ownerTitle: "1) Data Controller",
            ownerBody: (
                <>
                    {ORG_NAME} — {ORG_ADDRESS} — {ORG_PIVA}<br />
                    Email: <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>
                </>
            ),
            dataTypesTitle: "2) Categories of data processed",
            dataTypes: [
                <><strong>Browsing data</strong> (e.g. IP address, technical logs, device information) generated while using the site.</>,
                <><strong>Data provided by the user</strong> (e.g. name, email, message) through the contact form.</>,
                <><strong>WhatsApp contact</strong>: if you decide to text us on WhatsApp we process the data contained in the chats. The service is provided by WhatsApp Ireland Ltd.</>,
                <><strong>Bookings/Events</strong>: name, surname, email, phone number, ticket quantity and event details.</>,
                <><strong>Newsletter</strong> (if enabled): email address and subscription preferences.</>,
                <><strong>Media/Gallery</strong>: the website displays images hosted on Google Drive/Google CDN.</>,
                <><strong>QR check-in</strong> (operator area): booking token/QR and entry counters.</>,
                <><strong>Admin area</strong> (restricted): credentials/accounts of authorised staff.</>,
            ],
            purposesTitle: "3) Purposes and lawful bases",
            purposes: [
                <><em>Handling requests</em> via contact form or WhatsApp → <strong>consent</strong> (art. 6.1.a) and/or <strong>pre-contractual measures</strong> (art. 6.1.b).</>,
                <><em>Bookings, event organisation and check-in</em> → <strong>contract</strong> (art. 6.1.b) and <strong>legal obligations</strong> (art. 6.1.c).</>,
                <><em>Newsletter</em> → <strong>consent</strong> (art. 6.1.a), which can be withdrawn at any time.</>,
                <><em>Website security and abuse prevention</em> → <strong>legitimate interest</strong> of the Controller (art. 6.1.f).</>,
                <><em>Legal and accounting compliance</em> → <strong>legal obligation</strong> (art. 6.1.c).</>,
            ],
            provisionTitle: "4) Provision of data",
            provisionBody: "Providing data marked as mandatory is necessary in order to deliver the requested service (e.g. booking, reply to a message). Failure to provide such data may prevent us from delivering the service.",
            processingTitle: "5) Processing methods and retention",
            processingIntro: "Data are processed using electronic tools and adequate security measures. Retention periods depend on the purpose:",
            processingList: [
                "Contact requests: for the time needed to handle the enquiry and up to 24 months for business history.",
                "Bookings and administrative documents: up to 10 years to comply with legal obligations.",
                "Newsletter: until consent is withdrawn/unsubscription.",
                "Security logs: usually 6–12 months unless investigations require a longer period.",
            ],
            recipientsTitle: "6) Recipients and vendors",
            recipientsIntro: "Data may be disclosed to parties providing services to the Controller, acting as data processors, including for example:",
            recipientsList: [
                "Hosting/cloud providers and technical platforms.",
                "Google LLC (e.g. Google Drive/Google Photos CDN for the gallery, Firebase services where applicable).",
                "WhatsApp Ireland Ltd for chat communications.",
                "Geoapify / OpenStreetMap for location suggestions and maps when creating events.",
                "Email/SMTP providers and newsletter tools (if enabled).",
                "Consultants and authorised personnel of the Controller (e.g. accountants, lawyers).",
            ],
            transferTitle: "7) Data transfers outside the EU",
            transferBody: "Some providers (e.g. Google LLC, WhatsApp/Meta) may process data outside the European Economic Area. In such cases transfers rely on adequacy decisions or appropriate safeguards (e.g. Standard Contractual Clauses) in accordance with arts. 44-49 GDPR.",
            rightsTitle: "8) Data subject rights",
            rightsBody: (
                <>
                    As a data subject you can exercise the rights set out in arts. 15-22 GDPR: access, rectification, erasure,
                    restriction, portability, objection, withdrawal of consent (without affecting the lawfulness of prior processing).
                    To exercise your rights or obtain clarifications, email {" "}
                    <a href={`mailto:${ORG_EMAIL}`}>{ORG_EMAIL}</a>.
                </>
            ),
            cookiesTitle: "9) Cookies and similar technologies",
            cookiesBody: "The site may use technical cookies and, where present, third-party tools. For details read the ",
            cookiesAfterLink: " (if available) or contact us.",
            minorsTitle: "10) Minors",
            minorsBody: "The services are not intended for children under 14. Should we receive data regarding minors without parental/guardian consent we will delete them as soon as we become aware of it.",
            updatesTitle: "11) Updates",
            updatesBody: "We may amend this notice. Updated versions will be published on this page with the date of the last update.",
            note: (
                <>
                    <strong>Disclaimer</strong>: this text is a template and does not constitute legal advice.
                    Adapt it to your actual processing activities and have it reviewed by a professional.
                </>
            ),
        },
    };
    const L = labels[locale];

    return (
        <Section>
            <div className="container">
                <Card
                    initial={{opacity:0, y:12}}
                    animate={{opacity:1, y:0}}
                    transition={{duration:.4, ease:"easeOut"}}
                >
                    <h1 style={{marginTop:0}}>{L.title}</h1>
                    <p><small>{L.lastUpdated}: {lastUpdate}</small></p>

                    <p>{L.intro}</p>

                    <h2>{L.ownerTitle}</h2>
                    <p>{L.ownerBody}</p>

                    <h2>{L.dataTypesTitle}</h2>
                    <ul>
                        {L.dataTypes.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>

                    <h2>{L.purposesTitle}</h2>
                    <ul>
                        {L.purposes.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>

                    <h2>{L.provisionTitle}</h2>
                    <p>{L.provisionBody}</p>

                    <h2>{L.processingTitle}</h2>
                    <p>{L.processingIntro}</p>
                    <ul>
                        {L.processingList.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>

                    <h2>{L.recipientsTitle}</h2>
                    <p>{L.recipientsIntro}</p>
                    <ul>
                        {L.recipientsList.map((item, idx) => (
                            <li key={idx}>{item}</li>
                        ))}
                    </ul>

                    <h2>{L.transferTitle}</h2>
                    <p>{L.transferBody}</p>

                    <h2>{L.rightsTitle}</h2>
                    <p>{L.rightsBody}</p>

                    <h2>{L.cookiesTitle}</h2>
                    <p>
                        {L.cookiesBody}
                        <a href="/cookie" rel="noreferrer">Cookie Policy</a>
                        {L.cookiesAfterLink}
                    </p>

                    <h2>{L.minorsTitle}</h2>
                    <p>{L.minorsBody}</p>

                    <h2>{L.updatesTitle}</h2>
                    <p>{L.updatesBody}</p>

                    <hr />
                    <p style={{opacity:.8, fontSize:".95rem"}}>
                        {L.note}
                    </p>
                </Card>
            </div>
        </Section>
    );
};

export default PrivacyPolicy;
