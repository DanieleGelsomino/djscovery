// api/youtube/latest-rss.js — Vercel Serverless Function
// Returns latest video IDs parsed from public RSS for a given channelId.

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const channelId = String(req.query.channelId || "").trim();
    const max = Math.min(10, Math.max(1, parseInt(req.query.max || "4", 10) || 4));
    if (!channelId) return res.status(400).json({ error: "missing_channelId" });

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const r = await fetch(feedUrl);
    if (!r.ok) return res.status(r.status).json({ error: "rss_fetch_failed" });
    const xml = await r.text();

    const ids = [];
    const re = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
    let m;
    while ((m = re.exec(xml)) && ids.length < max) {
      ids.push(m[1]);
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json({ ids });
  } catch (e) {
    console.error("/api/youtube/latest-rss:", e?.message || e);
    return res.status(500).json({ error: "failed" });
  }
};

// Explicit runtime for Vercel
module.exports.config = { runtime: "nodejs20.x" };
