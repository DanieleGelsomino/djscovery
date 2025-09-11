import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaSpotify, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-4px) }
  100% { transform: translateY(0) }
`;

const Wrapper = styled.div`
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 9999;
  display: grid;
  gap: 0.5rem;

  /* iOS safe area support */
  @supports (bottom: env(safe-area-inset-bottom)) {
    bottom: calc(env(safe-area-inset-bottom) + 18px);
  }

  @media (max-width: 480px) {
    right: 14px;
    bottom: 14px;
    @supports (bottom: env(safe-area-inset-bottom)) {
      bottom: calc(env(safe-area-inset-bottom) + 14px);
    }
  }
`;

const Fab = styled(motion.button)`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  outline: none;
  display: grid;
  place-items: center;
  background: #1db954;
  color: white;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  animation: ${float} 2.8s ease-in-out infinite;
  line-height: 0; /* evita spaziatura baseline */
  padding: 0;

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.45),
      0 10px 24px rgba(0, 0, 0, 0.35);
  }

  svg {
    width: 30px;
    height: 30px;
    display: block;
    transform: translateY(1px); /* compensa il viewBox di FaSpotify */
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;

const Player = styled(motion.div)`
  width: clamp(280px, 92vw, 420px);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);

  @media (max-width: 480px) {
    border-radius: 12px;
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  color: white;

  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
  }
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.35);
    outline-offset: 2px;
  }
`;

const Iframe = styled.iframe`
  border: 0;
  width: 100%;
  height: 152px; /* embed compatto su mobile */
  @media (min-width: 640px) {
    height: 352px; /* embed grande su tablet/desktop */
  }
`;

function toEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean); // ["playlist", "{id}"]
    const type = parts[0];
    const id = parts[1];
    if (!id) return null;
    if (type === "playlist")
      return `https://open.spotify.com/embed/playlist/${id}`;
    if (type === "album") return `https://open.spotify.com/embed/album/${id}`;
    if (type === "artist") return `https://open.spotify.com/embed/artist/${id}`;
    if (type === "track") return `https://open.spotify.com/embed/track/${id}`;
    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    // accept raw ID fallback (playlist id)
    if (/^[A-Za-z0-9]{10,}$/.test(url))
      return `https://open.spotify.com/embed/playlist/${url}`;
    return null;
  }
}

const SpotifyFloatingWidget = () => {
  // Fallback di test se non configurato in .env
  const rawUrl =
    import.meta.env.VITE_SPOTIFY_PLAYLIST_URL ||
    "https://open.spotify.com/playlist/1pSy9kzEtp4El0Op5CV8pf";
  const baseEmbedUrl = useMemo(() => toEmbedUrl(rawUrl), [rawUrl]);
  const [embedUrl, setEmbedUrl] = useState(baseEmbedUrl);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  // Prova a recuperare l'ultima playlist pubblica dal backend
  useEffect(() => {
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL ||
      (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:3000'
        : '');
    const SPOTIFY_USER_ID =
      import.meta.env.VITE_SPOTIFY_USER_ID ||
      "31cxctdzgar4zt2trblfp55ebpl4";
    let aborted = false;
    (async () => {
      try {
        const url = `${API_BASE}/api/spotify/latest-playlist?userId=${encodeURIComponent(
          SPOTIFY_USER_ID
        )}&pin=true`;
        const res = await fetch(url);
        if (!res.ok) return; // fallback rimane
        const data = await res.json();

        // Adatta a diverse risposte del backend
        let next = null;
        if (data?.embedUrl) {
          next = data.embedUrl;
        } else if (data?.url) {
          next = toEmbedUrl(data.url);
        } else if (data?.id) {
          next = `https://open.spotify.com/embed/playlist/${data.id}`;
        }

        if (!aborted && next) setEmbedUrl(next);
      } catch (e) {
        // ignora, usa fallback
        // console.warn('Spotify widget: fallback used', e);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setVisible(y > 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!embedUrl) return null; // sicurezza: in casi non previsti

  return (
    <Wrapper aria-live="polite">
      <AnimatePresence>
        {visible && (
          <Fab
            key="spotify-fab"
            aria-label="Apri player Spotify"
            onClick={() => setOpen((v) => !v)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <FaSpotify />
          </Fab>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <Player
            key="spotify-player"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="dialog"
            aria-label="Spotify player"
          >
            <PlayerHeader>
              <span style={{ fontWeight: 600, fontSize: 14, opacity: 0.95 }}>
                Playlist Spotify
              </span>
              <CloseBtn
                aria-label="Chiudi player"
                onClick={() => setOpen(false)}
              >
                <FaTimes />
              </CloseBtn>
            </PlayerHeader>
            <Iframe
              title="Spotify Playlist"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              src={embedUrl}
            />
          </Player>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

export default SpotifyFloatingWidget;
