# Djscovery

Applicazione **React + Vite** con backend Node (API) e integrazioni Firebase (Auth + Firestore), Google Drive Picker, YouTube e newsletter Brevo.

---

## Requisiti

- Node 18+
- Firebase project (Firestore + Authentication abilitati)
- (Opzionale) Account Brevo (ex Sendinblue) per newsletter
- (Opzionale) Google Cloud Project per Drive Picker & YouTube Data API

---

## Quick Start

```bash
# Installa dipendenze
npm install

# Avvia frontend (Vite)
npm run dev
# App su http://localhost:5173

# Avvia backend API (in altra shell)
npm run server
# API su http://localhost:3000
```

---

## Struttura progetto

```
project-root/
├─ src/                      # frontend React (Vite)
├─ server/                   # backend API Node
├─ tools/                    # script per claims admin
│  ├─ set-admin-claim.js
│  └─ unset-admin-claim.js
├─ .env                      # variabili frontend + tools (NON committare)
├─ server/.env               # variabili backend (NON committare)
└─ README.md
```

---

## Variabili d’ambiente

### Frontend (`.env` in root)

```env
VITE_API_BASE_URL=http://localhost:3000

# Firebase Web SDK
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Google Drive
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_API_KEY=...
VITE_GOOGLE_DRIVE_FOLDER_ID=...   # ID cartella immagini
VITE_GOOGLE_DRIVE_FOLDER=...      # (opzionale) URL cartella per link diretto

# YouTube
VITE_YOUTUBE_API_KEY=...
VITE_YOUTUBE_CHANNEL_ID=...

# Feature flags
VITE_MOCK=false
```

### Backend (`server/.env`)

```env
PORT=3000

# Firebase Admin (Service Account)
FIREBASE_SERVICE_ACCOUNT=/ABSOLUTE/PATH/TO/key.json
FIREBASE_PROJECT_ID=...

# Newsletter (Brevo)
BREVO_API_KEY=...
BREVO_LIST_ID=...

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

---

## Backend server

```bash
cd server
npm install
cd ..
npm run server
```

Setup Firestore (creazione collezioni base):

```bash
cd server
npm run setup
```

Endpoint principali:
- `POST /api/bookings` — crea prenotazione (Firestore `bookings`)
- `GET  /api/events`   — lista eventi
- `GET  /api/gallery`  — lista immagini

---

## Area Admin

1. Abilita **Email/Password** in Firebase Authentication.  
2. Crea l’utente admin (es. `djscovery.channel@gmail.com`) in Firebase Console.  
3. Assegna la claim `admin` con gli script (vedi sotto).  
4. Login su `/admin` → pannello su `/admin/panel` (protetto).

---

## Gestione Admin Claims

Gli script sono in `tools/`:

- `set-admin-claim.js` → assegna admin  
- `unset-admin-claim.js` → rimuove admin  

### Comandi npm

```bash
# assegna admin
npm run grant:admin -- djscovery.channel@gmail.com

# rimuove admin
npm run revoke:admin -- djscovery.channel@gmail.com
```

⚠️ Dopo grant/revoke: fai **logout/login** oppure usa `getIdToken(true)` per aggiornare il token.

### Verifica claim (da browser)

```js
import { getAuth } from "firebase/auth";
const auth = getAuth();
const res = await auth.currentUser.getIdTokenResult(true);
console.log(res.claims.admin); // true se admin
```

---

## Integrazioni

### Newsletter (Brevo)

1. Crea una lista su Brevo e ottieni `BREVO_LIST_ID`.  
2. Genera `BREVO_API_KEY`.  
3. Imposta entrambi in `server/.env`.  
4. Il frontend userà `subscribeNewsletter` → l’API salverà l’iscrizione.

### Google Drive (picker in admin)

- Abilita **Google Drive API** su Google Cloud.  
- Crea **OAuth Client ID** (Web) → `VITE_GOOGLE_CLIENT_ID`.  
- Crea **API Key** → `VITE_GOOGLE_API_KEY`.  
- Imposta `VITE_GOOGLE_DRIVE_FOLDER_ID` = ID cartella con le immagini.  
- (Opzionale) `VITE_GOOGLE_DRIVE_FOLDER` = URL cartella per link diretto.

### YouTube feed

- Abilita **YouTube Data API v3**.  
- Imposta `VITE_YOUTUBE_API_KEY` e `VITE_YOUTUBE_CHANNEL_ID` nel `.env`.  
- La home mostrerà i video recenti.

---

## Sicurezza

- Verifica la claim `admin` **anche sul backend**.  
- Non committare `key.json` e `.env`.  
- Aggiungi in `.gitignore`:
  ```
  .env
  server/.env
  key.json
  ```

Esempio middleware Express:

```js
import admin from 'firebase-admin';

export async function requireAdmin(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded.admin) return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Deploy

### Firebase Hosting

```bash
npm run build              # genera dist/
npm install -g firebase-tools
firebase login
firebase init hosting      # seleziona progetto, cartella "dist"
firebase deploy
```

### Vercel / Netlify

1. `npm run build` → produce `dist/`  
2. Configura:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Imposta le variabili ambiente `VITE_*` sul provider.  
4. Deploya il backend (server Node) separatamente (Cloud Run / Render / Railway) e punta `VITE_API_BASE_URL` al nuovo host.

---

## Rotte principali

- Pubbliche:  
  - `/` (Home)  
  - `/eventi`  
  - `/gallery`  
  - `/chi-siamo`  
  - `/contatti`  
  - `/prenota`  

- Admin:  
  - `/admin` (Login con recupero password)  
  - `/admin/panel` (Protetta — claim `admin` richiesta)  
