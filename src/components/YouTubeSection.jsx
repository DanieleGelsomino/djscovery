import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLanguage } from './LanguageContext';

const Section = styled.section`
  background-color: #000;
  color: var(--white);
  text-align: center;
  padding: 2rem 0;
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
  border-radius: 8px;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const fallbackIds = [
  'dQw4w9WgXcQ',
  '3JZ_D3ELwOQ',
  'L_jWHffIx5E',
  'M7FIvfx5J10'
];

const YouTubeSection = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const channelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
    if (!apiKey || !channelId) return;

    fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=4`
    )
      .then((res) => res.json())
      .then((data) => {
        const vids = (data.items || [])
          .filter((it) => it.id && it.id.videoId)
          .map((it) => it.id.videoId);
        if (vids.length) setVideos(vids);
      })
      .catch(() => {});
  }, []);

  const ids = videos.length ? videos : fallbackIds;

  return (
    <Section>
      <div className="container">
        <h2>{t('youtube.title')}</h2>
        <p>{t('youtube.subtitle')}</p>
        <VideosGrid>
          {ids.map((id) => (
            <VideoWrapper key={id}>
              <iframe
                src={`https://www.youtube.com/embed/${id}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </VideoWrapper>
          ))}
        </VideosGrid>
      </div>
    </Section>
  );
};

export default YouTubeSection;
