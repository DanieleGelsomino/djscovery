# Deploy: Staging per il team

Questo repo espone:
- Frontend: React + Vite (cartella radice)
- Backend: Node/Express (cartella `server/`) con Firestore Admin e integrazioni (Spotify, YouTube/Drive, SMTP)

Di seguito due percorsi:

1) Anteprima veloce (solo frontend, mock) — 5 minuti
2) Full‑stack (backend su Render, frontend su Netlify/Vercel)
3) Full‑stack (solo Vercel: frontend + API serverless)

## 1) Anteprima veloce (mock)
Perfetto per far vedere UI/UX senza configurare backend.

- Imposta `VITE_MOCK=true` (Netlify/Vercel: Settings → Environment variables)
- Deploy frontend su Netlify o Vercel
  - Build command: `npm run build`
  - Publish/output dir: `dist`

Con i mock attivi, i dati di eventi/prenotazioni/galleria sono finti e nessun backend è richiesto.

## 2) Full‑stack (Render + Netlify/Vercel)

### Backend (Render)
1. Importa il repo su Render e crea un servizio Web con:
   - Root dir: `server`
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
2. Configura le variabili d’ambiente (Settings → Environment):
   - Copia `server/.env.example` e compila i valori minimi:
     - `JWT_SECRET` (qualunque string lunga/casuale)
     - `API_BASE_URL` = URL pubblico mostrato da Render (es. `https://djscovery-api.onrender.com`)
     - `CORS_ORIGINS` = dominio del frontend (es. `https://djscovery.netlify.app`)
   - Per funzionalità complete:
     - Credenziali Firebase Admin: carica il Service Account JSON come Secret File e imposta `FIREBASE_SERVICE_ACCOUNT=/etc/secrets/service-account.json` (o usa `GOOGLE_APPLICATION_CREDENTIALS`)
     - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`
     - Opzionali: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `YOUTUBE_API_KEY` o `GOOGLE_API_KEY`
3. Deploy. Verifica l’health con `GET /api/youtube/latest-rss?channelId=UC_x5XG1OV2P6uZZ5FSM9Ttw` (dovrebbe rispondere 200 con ids)

Note: Render imposta `PORT` automaticamente. L’app lo usa.

### Frontend (Netlify o Vercel)
Opzione A — variabile API
- Imposta `VITE_API_BASE_URL` al dominio del backend (es. `https://djscovery-api.onrender.com`)
- Build: `npm run build`, Output: `dist`

Opzione B — rewrite proxy
- Netlify: modifica `netlify.toml` sostituendo `YOUR-BACKEND-DOMAIN.TLD` con il tuo dominio backend; nessuna `VITE_API_BASE_URL` necessaria.
- Vercel: modifica `vercel.json` allo stesso modo.

## 3) Full‑stack (solo Vercel: frontend + API serverless)

Questa repo include una cartella `api/` con un'app Express pronta per girare come Funzioni Serverless su Vercel.

1. Collega il repo a Vercel e crea un nuovo progetto.
2. Build Settings (auto):
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Aggiungi variabili d'ambiente (Project → Settings → Environment Variables):
   - Obbligatorie per il backend:
     - `FIREBASE_SERVICE_ACCOUNT_JSON` — incolla il JSON del Service Account Firebase (contenuto, non percorso)
     - `JWT_SECRET` — stringa segreta per firmare i token delle prenotazioni
   - Consigliate/Opzionali:
     - `SMTP_HOST`, `SMTP_PORT` (465 o 587), `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` — per email di conferma prenotazione
     - `GOOGLE_API_KEY` (o `YOUTUBE_API_KEY`) — per YouTube/Drive e proxy Drive
     - `API_BASE_URL` — se vuoi forzare l'URL nelle email; altrimenti viene usato l'host della richiesta
     - `BREVO_*`, `RECAPTCHA_*` — se abiliti newsletter/recaptcha
   - Per il frontend (build):
     - puoi lasciare vuoto `VITE_API_BASE_URL` (il client userà same‑origin), oppure impostarlo per puntare a un altro dominio API
4. Deploy. Verifica:
   - `GET /api/health` → `{ ok: true }`
   - `GET /api/diag` → verifica Firestore (`ok: true`, `projectId` valorizzato)

Note:
- Il routing SPA è gestito da `vercel.json` che effettua il fallback a `index.html`.
- Le chiamate client usano `window.location.origin` se `VITE_API_BASE_URL` non è impostata, quindi funzionano sullo stesso dominio Vercel.

### Firebase client (opzionale)
Se usi la parte admin autenticata, imposta anche le chiavi `VITE_FIREBASE_*` (vedi `.env.example`).

## Variabili chiave riassunte
- Frontend: `VITE_MOCK`, `VITE_API_BASE_URL`, `VITE_WHATSAPP_COMMUNITY_URL`, `VITE_SPOTIFY_USER_ID`, `VITE_FIREBASE_*`
- Backend: `JWT_SECRET`, `API_BASE_URL`, `CORS_ORIGINS`, `FIREBASE_*`, `SMTP_*`, `SPOTIFY_*`, `YOUTUBE_API_KEY`/`GOOGLE_API_KEY`

## Consigli
- Staging rapido: attiva `VITE_MOCK=true` e deploy solo frontend per feedback immediato.
- Quando passi a full‑stack, disattiva i mock e verifica CORS + `VITE_API_BASE_URL`/rewrites.
- Aggiungi il dominio frontend a `CORS_ORIGINS` per sicurezza (se vuoto consente tutti).
