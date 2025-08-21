// tools/set-admin-claim.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Carica .env dalla root del repo (../.env rispetto a /tools), poi eventuale .env locale (cwd)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

function getArg(name) {
    const p = `--${name}=`;
    const found = process.argv.find(a => a.startsWith(p));
    return found ? found.slice(p.length) : null;
}

const cliKey = getArg('key');
const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;
const gcloudKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// ✅ fallback: project-root/key.json (indipendente dalla cartella da cui lanci)
const fallbackKey = path.resolve(__dirname, '../key.json');

// Ordine di priorità per trovare la service account
const saPath = cliKey || envKey || gcloudKey || fallbackKey;

console.log('[cwd]', process.cwd());
console.log('[using service account]', saPath);

if (!fs.existsSync(saPath)) {
    console.error('❌ Service account non trovata:', saPath);
    console.error('   Usa una di queste opzioni:');
    console.error('   1) --key="/percorso/assoluto/key.json"');
    console.error('   2) variabile .env FIREBASE_SERVICE_ACCOUNT=/percorso/key.json (in root)');
    console.error('   3) export GOOGLE_APPLICATION_CREDENTIALS=/percorso/key.json');
    console.error('   4) metti key.json in project-root/key.json');
    process.exit(1);
}

const serviceAccount = require(saPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
});

async function setAdminByEmail(email) {
    if (!email) {
        console.error('Usa: node tools/set-admin-claim.js <email> [--key=/abs/path/key.json]');
        process.exit(1);
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`✅ Impostata claim { admin: true } per ${email} (uid: ${user.uid})`);
        console.log('ℹ️ Fai logout/login o getIdToken(true) per aggiornare il token lato client.');
    } catch (e) {
        console.error('❌ Errore:', e.message);
        process.exit(1);
    }
}

setAdminByEmail(process.argv[2]);
