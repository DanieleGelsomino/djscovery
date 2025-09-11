import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLanguage } from "./LanguageContext";
import { VideoGridSkeleton } from "./Skeletons";

const Section = styled.section`
  background: transparent;
  color: var(--white);
  text-align: center;
  padding: 3rem 0;
`;

const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 2rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  transform: translateZ(0);
  transition: transform var(--transition-fast), box-shadow var(--transition-med);

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 50px rgba(0,0,0,0.35);
  }
`;

const fallbackIds = [
  "dQw4w9WgXcQ",
  "3JZ_D3ELwOQ",
  "L_jWHffIx5E",
  "M7FIvfx5J10",
];

const YouTubeSection = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [usePlaylistEmbed, setUsePlaylistEmbed] = useState(false);
  const [loading, setLoading] = useState(true);
  // Fallback playlist (Uploads) derived from channel UCXX... -> UUXX...
  const uploadsPlaylistId = "UUXXwVIOWmC8rEqOMh48fY6g";
  const channelId = "UCXXwVIOWmC8rEqOMh48fY6g";
  const playlistUrl = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;

  useEffect(() => {
    const apiKey = "AIzaSyAyG0exdTU2vkRqDLdwRiu0PEKznNkfOTo"; // fallback client
    const handle = "@djscoverytv";
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "");

    const load = async () => {
      try {
        // 1) Prova proxy server (evita 403 su key client)
        const r = await fetch(`${API_BASE}/api/youtube/latest?handle=${encodeURIComponent(handle)}&max=4`);
        if (r.ok) {
          const j = await r.json();
          const ids = Array.isArray(j?.ids) ? j.ids : [];
          if (ids.length) { setVideos(ids); setLoading(false); return; }
        }
        // 2) Fallback senza quota: RSS dal canale via server
        try {
          const rss = await fetch(`${API_BASE}/api/youtube/latest-rss?channelId=${encodeURIComponent(channelId)}&max=4`);
          if (rss.ok) {
            const data = await rss.json();
            const ids = Array.isArray(data?.ids) ? data.ids : [];
            if (ids.length) { setVideos(ids); setLoading(false); return; }
          }
        } catch {}
        // 3) Fallback: chiamata diretta (potrebbe dare 403 se key ha restrizioni o quota)
        if (!apiKey || !handle) throw new Error("missing_config");
        const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`);
        const chData = await chRes.json();
        const ch = chData.items?.[0]?.id;
        if (!ch) throw new Error("Canale non trovato");
        const listRes = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${ch}&part=snippet,id&order=date&maxResults=4`);
        if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
        const listData = await listRes.json();
        const vids = (listData.items || [])
          .filter((it) => it.id && it.id.videoId)
          .map((it) => it.id.videoId);
        setVideos(vids.length ? vids : fallbackIds);
        setLoading(false);
      } catch (e) {
        console.error("Errore caricamento video:", e);
        // Fallback definitivo: embed della playlist Uploads
        setVideos([]);
        setUsePlaylistEmbed(true);
        setLoading(false);
      }
    };
    load();
  }, []);

  const ids = videos.length ? videos : fallbackIds;

  return (
    <Section>
      <div className="container">
        <h2>{t("youtube.title")}</h2>
        <p>
          {t("youtube.subtitle")} ·
          {" "}
          <a
            href={playlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--yellow)", fontWeight: 700 }}
          >
            Apri playlist su YouTube
          </a>
        </p>
        {loading ? (
          <VideoGridSkeleton count={4} />
        ) : usePlaylistEmbed ? (
          <VideosGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoWrapper key={i}>
                <iframe
                  src={`https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}&index=${i}`}
                  title={`YouTube playlist video ${i+1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </VideoWrapper>
            ))}
          </VideosGrid>
        ) : (
          <VideosGrid>
            {ids.map((id) => (
              <VideoWrapper key={id}>
                <iframe
                  src={`https://www.youtube.com/embed/${id}`}
                  title={`YouTube video ${id}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </VideoWrapper>
            ))}
          </VideosGrid>
        )}
      </div>
    </Section>
  );
};

export default YouTubeSection;
