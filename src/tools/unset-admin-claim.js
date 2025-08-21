// tools/unset-admin-claim.js
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Carica .env dalla root (../.env), poi eventuale .env nella cwd
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
const fallbackKey = path.resolve(__dirname, '../key.json');

const saPath = cliKey || envKey || gcloudKey || fallbackKey;

console.log('[cwd]', process.cwd());
console.log('[using service account]', saPath);

if (!fs.existsSync(saPath)) {
    console.error('❌ Service account non trovata:', saPath);
    console.error('   Usa: --key="/path/key.json" oppure setta FIREBASE_SERVICE_ACCOUNT nel .env');
    process.exit(1);
}

const serviceAccount = require(saPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
});

async function unsetAdminByEmail(email) {
    if (!email) {
        console.error('Usa: npm run revoke:admin -- <email>');
        process.exit(1);
    }
    try {
        const user = await admin.auth().getUserByEmail(email);
        // Rimuove tutte le custom claims (se vuoi solo disattivare admin: usa { admin: false })
        await admin.auth().setCustomUserClaims(user.uid, null);
        console.log(`✅ Rimosse custom claims per ${email} (uid: ${user.uid})`);
        console.log('ℹ️ Fai logout/login o getIdToken(true) per aggiornare il token lato client.');
    } catch (e) {
        console.error('❌ Errore:', e.message);
        process.exit(1);
    }
}

unsetAdminByEmail(process.argv[2]);
