// api/spotify/latest-playlist.js — Vercel Serverless Function
// Returns latest playlist for a user if credentials are present; otherwise returns a fallback.

async function getSpotifyToken(id, secret) {
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body,
  });
  if (!r.ok) throw new Error(`Spotify token ${r.status}`);
  const j = await r.json();
  return j.access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const userId = String(req.query.userId || process.env.SPOTIFY_USER_ID || "").trim();
  const playlistIdFromQuery = String(req.query.playlistId || "").trim();
  const fallbackId = process.env.SPOTIFY_FALLBACK_PLAYLIST_ID || "1pSy9kzEtp4El0Op5CV8pf";

  // If direct playlistId provided, return it immediately
  if (playlistIdFromQuery) {
    return res.json({
      id: playlistIdFromQuery,
      name: "Spotify Playlist",
      url: `https://open.spotify.com/playlist/${playlistIdFromQuery}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${playlistIdFromQuery}`,
      images: [],
    });
  }

  const id = process.env.SPOTIFY_CLIENT_ID || "";
  const secret = process.env.SPOTIFY_CLIENT_SECRET || "";
  const credsAvailable = Boolean(id && secret);

  // No credentials → fallback
  if (!credsAvailable || !userId) {
    return res.json({
      id: fallbackId,
      name: "Spotify Playlist",
      url: `https://open.spotify.com/playlist/${fallbackId}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${fallbackId}`,
      images: [],
    });
  }

  try {
    const token = await getSpotifyToken(id, secret);
    const r = await fetch(
      `https://api.spotify.com/v1/users/${encodeURIComponent(userId)}/playlists?limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) throw new Error(`Spotify API ${r.status}`);
    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const top = items[0];
    if (!top) throw new Error("no_playlists");
    const url = top.external_urls?.spotify || `https://open.spotify.com/playlist/${top.id}`;
    return res.json({
      id: top.id,
      name: top.name,
      url,
      embedUrl: `https://open.spotify.com/embed/playlist/${top.id}`,
      images: top.images || [],
    });
  } catch (e) {
    console.error("/api/spotify/latest-playlist:", e?.message || e);
    return res.json({
      id: fallbackId,
      name: "Spotify Playlist",
      url: `https://open.spotify.com/playlist/${fallbackId}`,
      embedUrl: `https://open.spotify.com/embed/playlist/${fallbackId}`,
      images: [],
    });
  }
};

// Explicit runtime for Vercel
module.exports.config = { runtime: "nodejs20.x" };
