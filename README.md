# Djscovery

A simple React application built with Vite. To start the development server run:

```bash
npm install
npm run dev
```

The server binds to `0.0.0.0` on port `5173` (or the next available port) so it can be accessed from outside the container using `localhost`.

## Backend server

Install the dependencies of the API server and then start it:

```bash
cd server
npm install
cd ..
npm run server
```

Create a `.env` file inside the `server` directory by copying `.env.example` and
set your backend configuration values (e.g. `PORT`, `FIREBASE_SERVICE_ACCOUNT` or
`GOOGLE_APPLICATION_CREDENTIALS`, and `FIREBASE_PROJECT_ID`) before starting the
API server. To enable newsletter subscriptions via Brevo, configure also
`BREVO_API_KEY` and `BREVO_LIST_ID` with your account details.

After configuring Firebase credentials you can create the required Firestore collections with:

```bash
cd server
npm run setup
```

Visita `/prenota` per il form di prenotazione dei biglietti collegato a Firebase.

## Area admin

Abilita **Email/Password** su Firebase Authentication e crea l'utente amministratore.
Visita quindi `/admin` per accedere al pannello di amministrazione e gestire
prenotazioni ed eventi. Per utilizzare la selezione di immagini da Google Drive
configura inoltre `VITE_GOOGLE_CLIENT_ID` e `VITE_GOOGLE_API_KEY` con le
credenziali del tuo progetto Google. Imposta `VITE_MOCK=false` nel file `.env`
per abilitare le chiamate al backend. Se vuoi mostrare un collegamento diretto
all'archivio immagini di Google Drive nella sezione Gallery dell'admin,
imposta anche `VITE_GOOGLE_DRIVE_FOLDER` con l'URL della cartella.

Se il server API è in esecuzione su un dominio o porta diversa è possibile
specificarlo impostando la variabile `VITE_API_BASE_URL` nel file `.env`.
In questo modo tutte le richieste verranno indirizzate correttamente al backend.

Per mostrare i video più recenti del canale YouTube nella home page è
necessario impostare anche `VITE_YOUTUBE_API_KEY` e
`VITE_YOUTUBE_CHANNEL_ID` nel file `.env` con i valori del proprio progetto
Google.

Le immagini caricate nella sezione Gallery del pannello verranno mostrate
nella pagina pubblica "/gallery" insieme a quelle predefinite.

## Configurazione Firebase

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com/) e abilita **Firestore**.
2. Nella sezione "Project settings" genera le credenziali Web e copia i valori (apiKey, authDomain, ecc.).
3. Inserisci tali valori nel file `src/firebase/config.js` al posto dei placeholder.
4. Installa le dipendenze:

```bash
npm install firebase
```

Il file `server/index.js` espone l'endpoint `POST /api/bookings` che salva i dati nella collezione `bookings` di Firestore tramite Firebase Admin. Per autenticare il server imposta la variabile d'ambiente `FIREBASE_SERVICE_ACCOUNT` (o `GOOGLE_APPLICATION_CREDENTIALS`) con il percorso del tuo file JSON di servizio.
Sono inoltre disponibili gli endpoint `GET /api/events` e `GET /api/gallery` per recuperare gli eventi e le immagini. L'accesso all'area admin avviene ora tramite Firebase Authentication.

## Deploy dell'applicazione

Puoi pubblicare il sito sia tramite **Firebase Hosting** che con servizi come **Vercel** o **Netlify**.

### Firebase Hosting

```bash
npm run build              # genera la versione statica
npm install -g firebase-tools
firebase login
firebase init hosting      # scegli "dist" come cartella di deploy
firebase deploy
```

### Vercel / Netlify

1. Esegui `npm run build` per produrre la cartella `dist`.
2. Carica la cartella `dist` su Vercel o Netlify seguendo le indicazioni del provider.
3. Imposta come comando di build `npm run build` e come cartella di output `dist`.
