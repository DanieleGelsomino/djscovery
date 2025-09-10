# Manuale d'Uso – DJScovery (Sito + Admin)

Questo manuale guida il team all’uso operativo del sito pubblico e del pannello Admin, alla gestione della newsletter (Brevo), delle prenotazioni e della galleria.

Indice
- Panoramica
- Accessi e ruoli (Admin/Editor/Staff)
- Avvio in locale (dev) e variabili ambiente
- Struttura del progetto
- Sito pubblico (pagine principali)
- Newsletter (utente) + DOI/SOI
- Pannello Admin: Eventi, Prenotazioni, Galleria
- API utili e comandi di test
- Deploy e configurazioni
- Troubleshooting

---

## Panoramica

- Frontend: React + Vite (cartella `src/`).
- Backend: Node/Express + Firestore Admin (cartella `server/`).
- Database: Firestore.
- Email: SMTP (per prenotazioni con QR). Newsletter tramite Brevo (Sendinblue).

---

## Accessi e ruoli (Admin/Editor/Staff)

- Autenticazione con Firebase ID Token (lato Admin). I ruoli sono letti dai claims del token o da `ADMIN_EMAILS` in `.env` (se l’email è elencata, ottiene ruolo `admin`).
- Ruoli previsti:
  - `admin`: pieno accesso
  - `editor`: gestione eventi e galleria
  - `staff`: funzioni operative (es. check-in)

---

## Avvio in locale (dev) e variabili ambiente

1) Copia `.env.example` in due file, se non già esistenti:
   - root: `.env` (variabili Vite lato client, es. `VITE_API_BASE_URL`, `VITE_RECAPTCHA_SITE_KEY`)
   - server: `server/.env` (variabili backend e segreti, es. `JWT_SECRET`, `BREVO_*`, `RECAPTCHA_SECRET_KEY`)

2) Imposta le variabili chiave in `server/.env`:
   - `PORT=3000`
   - `CORS_ORIGINS=http://localhost:5173`
   - Firebase Admin: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`
   - Booking email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`
   - Newsletter Brevo: `BREVO_API_KEY`, `BREVO_LIST_ID`, `BREVO_USE_DOI`, (se DOI) `BREVO_DOI_TEMPLATE_ID`, `BREVO_REDIRECT_URL`
   - reCAPTCHA server: `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_MIN_SCORE` (es. `0.5`)

3) In `.env` (root):
   - `VITE_API_BASE_URL=http://localhost:3000`
   - `VITE_RECAPTCHA_SITE_KEY=<site_key_recaptcha_v3>`

4) Avvio:
   - Server: `npm run server` o `node server/index.js` (dipende dallo script in `package.json`).
   - Client: `npm run dev` (Vite, default `http://localhost:5173`).

> Nota: verifica l’endpoint salute `GET /healthz` deve rispondere `{ ok: true }`.

---

## Struttura del progetto (essenziale)

- `src/` – Frontend React
  - `components/` – Sezioni e pagine (Home, Eventi, Gallery, Contatti, Admin, Newsletter, ecc.)
  - `locales/it.json`, `locales/en.json` – Testi i18n
  - `api.js` – Client API verso il backend
- `server/` – Backend Express
  - `index.js` – Endpoints pubblici e protetti (eventi, prenotazioni, galleria, newsletter, healthz)
  - `firebase.js` – Setup Admin SDK + Firestore
  - `.env` – Variabili ambiente server

---

## Sito pubblico (pagine principali)

Rotte principali (vedi `src/App.jsx`):
- `/` – Home (Hero, YouTube, Slider galleria). La sezione Newsletter è pronta ma commentata in `src/components/HomePage.jsx` (decommenta `{/* <NewsletterSection /> */}` per mostrarla in home).
- `/eventi` – Lista eventi pubblicati.
- `/gallery` – Gallery pubblica.
- `/chi-siamo` – Sezione chi siamo.
- `/contatti` – Form contatti (invia email allo staff via `/api/contact`).
- `/prenota` – Prenotazione posti (flusso booking in produzione, non modificare).
- `/privacy` – Privacy Policy.
- `/thanks` – Pagina di ringraziamento (redirect Brevo DOI).

I testi statici si gestiscono in `src/locales/it.json` e `src/locales/en.json`.

---

## Newsletter (utente finale)

- Componente: `src/components/NewsletterSection.jsx`
  - Campi: email, consenso GDPR, honeypot "website" (invisibile), reCAPTCHA v3.
  - Chiama `subscribeNewsletter(email, { attributes, consent, recaptchaToken, website })` definita in `src/api.js` verso `POST /api/newsletter/subscribe`.
  - i18n richiavi:
    - `newsletter.title`, `subtitle`, `email`, `subscribe`, `loading`, `email_invalid`, `consent_required`, `success`, `error`, `consent_text`.
  - `consent_text` è HTML sanificato con DOMPurify (link a Privacy/ToS).

Modalità di iscrizione (configurabili da `server/.env`):
- Single Opt-In: `BREVO_USE_DOI=false` → il contatto viene aggiunto/aggiornato in lista direttamente.
- Double Opt-In: `BREVO_USE_DOI=true` + `BREVO_DOI_TEMPLATE_ID` + `BREVO_REDIRECT_URL` (es. `https://dominio/thanks`). Brevo invia email di conferma e al click l’utente è reindirizzato alla pagina `/thanks` del sito.

Sicurezza: reCAPTCHA v3
- Client carica lo script con `VITE_RECAPTCHA_SITE_KEY` e passa `recaptchaToken` al backend.
- Server valida via Google: se `success=false` o `score < RECAPTCHA_MIN_SCORE` → 400 `recaptcha_failed`.

Persistenza Firestore
- Collezione: `newsletter_subscribers`, docId = email lowercase.
- Campi principali:
  - `email`, `consent`, `attributes` (estesi: `CONSENT`, `CONSENT_TS`, `SOURCE`, `LOCALE`, `UA`, + custom es. `PAGE`)
  - `brevo` { `mode`: `double_opt_in|single_opt_in`, `listId` }
  - `status` (default `active`)
  - `createdAt`, `lastUpdateAt`, `userAgent`, `ip`

Webhook Brevo (sincronizzazione opzionale)
- Rotta: `POST /api/webhooks/brevo`
- Accetta uno o più eventi; aggiorna `status` e `lastEvent` su Firestore:
  - `unsubscribed` → `unsubscribed`
  - `hard_bounce` → `bounced`
  - `spam` → `complaint`
  - altri → `active`

---

## Pannello Admin

Questa sezione spiega nel dettaglio cosa può fare un amministratore e come usare le funzionalità disponibili nel pannello.

### Accesso e ruoli
- Login: vai su `/admin` e autenticati (ID Token Firebase). Se l'email è inclusa in `ADMIN_EMAILS` o nei claims come `admin`, potrai entrare nella dashboard.
- Dashboard: `/admin/panel` (la rotta è protetta). In locale l'accesso viene memorizzato in `localStorage` (`adminToken`, `isAdmin`, `role`).

### Navigazione del pannello
- Menu laterale (drawer) con sezioni: Eventi, Crea/Modifica Evento, Prenotazioni, Galleria. Su mobile è comprimibile (icona hamburger).
- Ricerca rapida: premi `/` da tastiera per focalizzare la barra di ricerca nella sezione attiva (Eventi o Prenotazioni).
- Salva rapido: nella sezione Crea/Modifica Evento premi Ctrl/Cmd + S per salvare.

---

### 1) Eventi (lista e gestione)

Panoramica elenco
- Filtri rapidi: Futuri/Passati/All, e filtro status (Bozza, Pubblicato, Archiviato).
- Ricerca: per nome evento, DJ, luogo.
- Ordinamento: per Data, Nome, Luogo (asc/desc).
- Visualizzazione mobile: caricamento progressivo (infinite scroll) 12 elementi per volta.

Azioni su evento
- Modifica: apre il form precompilato (sezione Crea/Modifica) per aggiornare i campi.
- Duplica: crea una bozza con stessi dettagli ma senza data/ora e con Sold out disattivato.
- ICS: esporta un file calendario `.ics` con i dettagli essenziali dell’evento (utile per condividere o caricare su calendari).
- Elimina: rimuove l’evento. Se ci sono prenotazioni, valuta l’impatto prima di procedere.

Esportazione CSV
- Dalla lista Eventi: esporta in `eventi.csv` (campi: Id, Nome, DJ, Stato, Data, Ora, Luogo, Capienza, SoldOut, Prenotazioni, AggiornatoIl/Da).

Auto Sold Out
- Il pannello ricalcola automaticamente lo stato Sold out in base a capienza e prenotazioni. Se i posti venduti >= capienza, imposta Sold out.

Bulk delete (avanzato)
- Disponibile dal pannello per Admin, con filtri per status o da backend via `DELETE /api/events` (usa con cautela).

---

### 2) Crea / Modifica Evento (form dettagli)

Campi principali
- Nome evento (obbligatorio)
- DJ / Line-up (facoltativo)
- Data e Orario (obbligatori). Il form impedisce date passate.
- Prezzo (€): disabilitato se `Sold out` è attivo.
- Capienza: numero massimo di posti. Usato per Sold out automatico.
- Descrizione (pubblica)
- Stato evento: `draft | published | archived`
- Luogo: campo testo con suggerimenti (OSM/Geoapify). Salva `place`, `placeId`, `placeCoords`.
- Note interne e Guest list (non pubbliche)

Immagine di copertina
- Da dispositivo: caricamento file con conversione automatica in WEBP 16:9 (1600×900) e compressione.
- Da Drive (se configurato): pulsante “Scegli da Drive” apre il selettore.
- Rimuovi immagine: pulisce il campo.

Suggerimenti d’uso
- Mantieni i nomi coerenti (es. “Friday Groove @ Rooftop”).
- Inserisci luogo dai suggerimenti per avere la mappa corretta sul sito pubblico.
- Se attivi `Sold out`, il prezzo resta visibile ma disabilitato (bloccato).
- Lo stato `draft` non appare sul sito pubblico; `archived` lo nasconde dalla lista principale.

Salvataggio e Audit
- Salvataggio crea/aggiorna i documenti in Firestore con `createdAt/updatedAt`, e `createdBy/updatedBy` (UID/email se disponibili) e crea un audit diff interno (consultabile lato DB).

---

### 3) Prenotazioni (Booking)

Elenco e filtri
- Filtro per evento (All o specifico evento), ricerca per Nome/Cognome/Email/Telefono.
- Ordinamento per Data creazione, Nome completo, Quantità.
- Paginazione desktop e infinite scroll su mobile.

Modifica prenotazione
- Clic su una prenotazione per aprire il dialog “Modifica”.
- Campi: evento (riassegna a un altro evento), nome, cognome, email, telefono, quantità (min 1).
- Salvataggio atomico: il backend usa transazioni per mantenere consistenti capienza e conteggi prenotazioni (aggiorna il contatore dell’evento vecchio/nuovo se cambi l’associazione o la quantità).

Elimina prenotazione
- Singola: icona cestino sulla riga o card mobile.
- Bulk (avanzato): dal backend `DELETE /api/bookings?eventId=...` per cancellare tutte le prenotazioni di un evento, con aggiornamento dei conteggi sul relativo evento.

Check-in e QR
- Email di conferma contiene un QR con link di verifica.
- Verifica: endpoint pubblico `GET /api/bookings/verify?token=...` ritorna validità, quantità, checked-in e rimanenti.
- Check-in: strumenti nel pannello (componente `CheckInBox`) incrementano i conteggi; presente anche funzione “Undo” per correggere.

Esportazione CSV
- Dalla sezione Prenotazioni puoi esportare `prenotazioni.csv` (Id, Evento, Nome, Cognome, Email, Telefono, Biglietti, CreatoIl).
- Dal backend: `GET /api/export/bookings.csv?eventId=...` (autenticato con ruolo `admin|editor|staff`).

---

### 4) Galleria

Lista e caricamento
- Vedi le immagini salvate nella collezione `gallery` (ordinate per `createdAt desc`).
- Aggiunta: carica un’immagine (URL/data URI) tramite pannello; viene salvata su Firestore (`src`, `createdAt`).
- Eliminazione: rimuovi dal pannello o via API `DELETE /api/gallery/:id` (autenticato `admin|editor`).

Best practices
- Usa immagini WEBP < 1MB per performance.
- Mantieni proporzione 16:9 per coerenza visiva.

---

### 5) Sicurezza, ruoli e sessione

- Le azioni admin necessitano di `Authorization: Bearer <Firebase ID token>`; il token è gestito dal login `/admin` e memorizzato in `localStorage` (chiave `adminToken`).
- Ruoli:
  - `admin`: pieno accesso (CRUD eventi/prenotazioni/galleria, bulk, export, duplicazione, ICS)
  - `editor`: CRUD eventi/galleria, export
  - `staff`: check-in e funzioni operative
- Logout: dal pannello, icona logout, rimuove token e ruoli dal `localStorage` e reindirizza a `/admin`.

---

### 6) Operazioni periodiche e consigli

- Prima di pubblicare un evento: verifica copertina (WEBP 16:9), luogo dai suggerimenti, data/ora future, capienza e prezzo coerenti.
- Dopo l’evento: se vuoi storicizzare ma non mostrare, imposta `archived`.
- Tenere d’occhio il Sold out automatico: se noti discrepanze, usa il comando “Ricalcola” (presente come routine automatica nel pannello) o aggiorna manualmente lo stato.
- Per eventi ricorrenti, usa “Duplica” e compila solo data/ora.

---

## API utili e comandi di test

- Health: `GET /healthz` → `{ ok: true }`.
- Events pubblici: `GET /api/events`.
- Newsletter (SOI):
  ```bash
  curl -X POST http://localhost:3000/api/newsletter/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"mario.rossi@example.com","attributes":{"PAGE":"/"},"consent":true}'
  ```
  Atteso: `200 { ok: true, mode: "single_opt_in" }`.

- Newsletter (DOI): impostare `BREVO_USE_DOI=true` e variabili template/redirect → stesso comando; atteso: `200 { ok: true, mode: "double_opt_in" }`.

- Webhook Brevo (test):
  ```bash
  curl -X POST http://localhost:3000/api/webhooks/brevo \
    -H "Content-Type: application/json" \
    -d '[{ "email":"mario.rossi@example.com", "event":"unsubscribed" }]'
  ```

- Contatti:
  ```bash
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Mario","email":"mario@example.com","message":"Ciao!"}'
  ```

---

## Deploy e configurazioni

- CORS: assicurarsi che `CORS_ORIGINS` includa tutti i domini frontend.
- Newsletter Brevo:
  - SOI: `BREVO_USE_DOI=false`.
  - DOI: `BREVO_USE_DOI=true`, `BREVO_DOI_TEMPLATE_ID` valido e `BREVO_REDIRECT_URL=https://dominio/thanks`.
  - Lista: `BREVO_LIST_ID`.
- reCAPTCHA v3:
  - Client: `VITE_RECAPTCHA_SITE_KEY`
  - Server: `RECAPTCHA_SECRET_KEY`, `RECAPTCHA_MIN_SCORE`
- Booking (produzione già attiva): NON modificare config esistente. Verificare SMTP funzionante.
- Firebase Admin: service account con permessi su Firestore.

Build
- Client: `npm run build` (Vite, produce `dist/`).
- Server: deploy come app Node (PM2/Render/Fly/Heroku ecc.), ricordando le variabili in `server/.env`.

---

## Troubleshooting

- 401/403 su Admin:
  - Verifica bearer token e claims/ruoli.
  - Aggiungi email a `ADMIN_EMAILS` se vuoi forzare admin.

- Newsletter errore `recaptcha_failed`:
  - Verifica chiavi reCAPTCHA e dominio associato, controlla `RECAPTCHA_MIN_SCORE`.

- Errore Brevo (4xx/5xx):
  - Controlla `BREVO_API_KEY`, `BREVO_LIST_ID`, se DOI controlla `BREVO_DOI_TEMPLATE_ID` e `BREVO_REDIRECT_URL`.

- Email booking non inviata:
  - Verifica SMTP con `mailer.verify` nel log, controlla credenziali e porta.

- CORS error dal browser:
  - Aggiorna `CORS_ORIGINS` con il dominio corretto e riavvia server.

---

## Note operative rapide

- Attivare sezione Newsletter in Home: decommentare `<NewsletterSection />` in `src/components/HomePage.jsx`.
- Aggiornare testi: modificare `src/locales/it.json` e `src/locales/en.json`.
- Link DOI Brevo: usare `/thanks` nel redirect per una UX coerente.
