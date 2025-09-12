// api/drive/list.js — Vercel Serverless Function
// Returns list of images from a Google Drive folder, with CDN + API fallback URLs.

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const crypto = require("crypto");

function cdnSrc(id, w = 1280) {
  return `https://lh3.googleusercontent.com/d/${id}=w${w}`;
}
function apiSrc(id, apiKey) {
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(apiKey)}`;
}

async function getServiceAccountToken() {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    const svc = JSON.parse(raw);
    const clientEmail = svc.client_email;
    const privateKey = svc.private_key;
    const tokenUri = svc.token_uri || "https://oauth2.googleapis.com/token";
    if (!clientEmail || !privateKey) return null;

    const iat = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: tokenUri,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      iat,
      exp: iat + 3600,
    };
    const header = { alg: "RS256", typ: "JWT" };
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const h = b64(header);
    const p = b64(payload);
    const data = `${h}.${p}`;
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(data);
    const sig = signer.sign(privateKey).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const assertion = `${data}.${sig}`;

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const r = await fetch(tokenUri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!r.ok) return null;
    const j = await r.json();
    return j.access_token || null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // Basic CORS for safety across environments
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const folderId = String(req.query.folderId || "").trim();
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize || "100", 10) || 100));
  const includeSharedDrives = String(req.query.includeSharedDrives || "true").toLowerCase() !== "false";
  // Use only server-side keys to avoid browser referrer restrictions
  const apiKey = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY || "";
  const debug = String(req.query.debug || "").toLowerCase() === "1" || String(req.query.debug || "").toLowerCase() === "true";

  if (!folderId) return res.status(400).json({ error: "missing_folderId" });

  try {
    const diag = { calls: [] };
    const fetchAll = async (q) => {
      const acc = [];
      let pageToken;
      let auth = null;
      if (!apiKey) auth = await getServiceAccountToken();
      do {
        const url = new URL(DRIVE_API);
        url.searchParams.set("q", q);
        url.searchParams.set(
          "fields",
          "nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,shortcutDetails)"
        );
        url.searchParams.set("pageSize", String(pageSize));
        if (apiKey) url.searchParams.set("key", apiKey);
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        if (includeSharedDrives) {
          url.searchParams.set("supportsAllDrives", "true");
          url.searchParams.set("includeItemsFromAllDrives", "true");
        }
        const u = url.toString();
        const r = await fetch(u, auth ? { headers: { Authorization: `Bearer ${auth}` } } : undefined);
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          diag.calls.push({ url: u.replace(/key=[^&]+/, "key=***"), status: r.status, ok: false, text });
          // If API key path fails (403/404), try once with Service Account token
          if (apiKey && (r.status === 401 || r.status === 403 || r.status === 404)) {
            const sa = await getServiceAccountToken();
            if (sa) {
              const r2 = await fetch(u.replace(/([?&])key=[^&]+(&|$)/, "$1"), { headers: { Authorization: `Bearer ${sa}` } });
              diag.calls.push({ url: u.replace(/key=[^&]+/, "key=***") + " (sa)", status: r2.status, ok: r2.ok });
              if (!r2.ok) {
                const t2 = await r2.text().catch(() => "");
                throw new Error(`Drive list error ${r2.status}: ${t2}`);
              }
              const j2 = await r2.json();
              (j2.files || []).forEach((f) => acc.push(f));
              pageToken = j2.nextPageToken;
              continue;
            }
          }
          throw new Error(`Drive list error ${r.status}: ${text}`);
        } else {
          diag.calls.push({ url: u.replace(/key=[^&]+/, "key=***"), status: r.status, ok: true });
        }
        const j = await r.json();
        (j.files || []).forEach((f) => acc.push(f));
        pageToken = j.nextPageToken;
      } while (pageToken);
      return acc;
    };

    const qImages = `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`;
    const qShort = `'${folderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.shortcut'`;

    const [filesImages, filesShortcuts] = await Promise.all([fetchAll(qImages), fetchAll(qShort)]);
    const all = [...filesImages, ...filesShortcuts];

    const items = all
      .map((f) => {
        const isShortcut = f.mimeType === "application/vnd.google-apps.shortcut";
        const id = isShortcut ? f.shortcutDetails?.targetId : f.id;
        const mt = isShortcut ? f.shortcutDetails?.targetMimeType : f.mimeType;
        if (!id || !(mt || "").startsWith("image/")) return null;
        return {
          id,
          name: f.name,
          mimeType: mt,
          modifiedTime: f.modifiedTime,
          thumbnail: f.thumbnailLink || null,
          src: cdnSrc(id, 1280),
          // Use server proxy to avoid API key referrer issues and support private files via SA
          fallbackSrc: `/api/drive/file/${id}`,
        };
      })
      .filter(Boolean);

    // de-duplicate by id
    const seen = new Set();
    const deduped = items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));

    res.setHeader("Cache-Control", "public, max-age=300");
    if (debug) return res.json({ items: deduped, diag });
    return res.json(deduped);
  } catch (e) {
    console.error("/api/drive/list error:", e?.message || e);
    // Non rompere la UI: ritorna lista vuota
    if (debug) return res.json({ items: [], diag: { error: e?.message || String(e) } });
    return res.json([]);
  }
};
// (runtime defaulted by project)
