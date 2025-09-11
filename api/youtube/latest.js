// api/youtube/latest.js — Vercel Serverless Function
// Returns latest video IDs for a channel handle using YouTube Data API.

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const handle = String(req.query.handle || "").trim();
    const max = Math.min(10, Math.max(1, parseInt(req.query.max || "4", 10) || 4));
    const key =
      process.env.YOUTUBE_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY ||
      "";

    if (!key) return res.status(500).json({ error: "missing_api_key" });
    if (!handle) return res.status(400).json({ error: "missing_handle" });

    const h = handle.startsWith("@") ? handle : `@${handle}`;

    // 1) Get channel id via forHandle
    let channelId = null;
    try {
      const chRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(h)}&key=${encodeURIComponent(key)}`
      );
      if (chRes.ok) {
        const chData = await chRes.json();
        channelId = chData?.items?.[0]?.id || null;
      }
    } catch {}

    // 2) Fallback search by handle/name
    if (!channelId) {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(key)}&part=snippet&type=channel&q=${encodeURIComponent(h)}`
      );
      if (searchRes.ok) {
        const sData = await searchRes.json();
        channelId = sData?.items?.[0]?.id?.channelId || null;
      }
    }
    if (!channelId) return res.status(404).json({ error: "channel_not_found" });

    const listRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(key)}&channelId=${encodeURIComponent(channelId)}&part=snippet,id&order=date&maxResults=${max}`
    );
    if (!listRes.ok) return res.status(listRes.status).json({ error: "youtube_search_failed" });
    const listData = await listRes.json();
    const ids = (listData.items || [])
      .filter((it) => it?.id?.videoId)
      .map((it) => it.id.videoId);
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json({ ids });
  } catch (e) {
    console.error("/api/youtube/latest:", e?.message || e);
    return res.status(500).json({ error: "failed" });
  }
};

// Explicit runtime for Vercel
module.exports.config = { runtime: "nodejs20.x" };
