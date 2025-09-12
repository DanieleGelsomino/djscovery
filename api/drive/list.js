// api/drive/list.js — Vercel Serverless Function
// Returns list of images from a Google Drive folder, with CDN + API fallback URLs.

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";

function cdnSrc(id, w = 1280) {
  return `https://lh3.googleusercontent.com/d/${id}=w${w}`;
}
function apiSrc(id, apiKey) {
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${encodeURIComponent(apiKey)}`;
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

  // If no API key is configured on the server, degrade gracefully: empty list.
  // The client will still be able to load images via the CDN if it has ids from elsewhere.
  if (!apiKey) {
    return res.status(200).json([]);
  }

  try {
    const diag = { calls: [] };
    const fetchAll = async (q) => {
      const acc = [];
      let pageToken;
      do {
        const url = new URL(DRIVE_API);
        url.searchParams.set("q", q);
        url.searchParams.set(
          "fields",
          "nextPageToken,files(id,name,mimeType,modifiedTime,thumbnailLink,shortcutDetails)"
        );
        url.searchParams.set("pageSize", String(pageSize));
        url.searchParams.set("key", apiKey);
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        if (includeSharedDrives) {
          url.searchParams.set("supportsAllDrives", "true");
          url.searchParams.set("includeItemsFromAllDrives", "true");
        }
        const u = url.toString();
        const r = await fetch(u);
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          diag.calls.push({ url: u.replace(/key=[^&]+/, "key=***"), status: r.status, ok: false, text });
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
          fallbackSrc: apiSrc(id, apiKey),
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
