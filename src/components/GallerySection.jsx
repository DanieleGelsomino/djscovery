import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import Spinner from "./Spinner";

import img1 from "../assets/img/Copia di Testo del paragraf.png";
import img2 from "../assets/img/Copia di Testo del paragrafo.png";
import img3 from "../assets/img/DJSCOVERY LOGO.png";
import img4 from "../assets/img/LOGO PRINCIPALE.png";
import img5 from "../assets/img/Testo del paragrafo_HQ.png";
import img6 from "../assets/img/Testo del paragrafo_HQ2.png";
import img7 from "../assets/img/hero.png";
import img8 from "../assets/img/logo-dj.png";

const ImageModal = lazy(() => import("./ImageModal"));

const Section = styled.section`
  padding: 2rem 0;
  background-color: #222;
  color: #fff;
  text-align: center;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Item = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  aspect-ratio: 4 / 3;
  background-color: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }

  &:hover div {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: var(--white);
  font-size: 1.25rem;
  font-weight: 600;
  opacity: 0;
  transform: translateY(10%);
  transition: all 0.3s ease;
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const PageDot = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: white;
  background: ${({ active }) => (active ? "var(--yellow)" : "#444")};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ active }) => (active ? "var(--yellow)" : "#666")};
    transform: scale(1.05);
  }
`;

const GalleryItem = React.memo(({ item, onClick }) => (
  <Item whileHover={{ scale: 1.02 }} onClick={onClick}>
    <img src={item.src} alt={item.place} loading="lazy" />
    <Overlay>{item.place}</Overlay>
  </Item>
));

const baseImages = [
  { src: img1, place: "Roma" },
  { src: img2, place: "Milano" },
  { src: img3, place: "Napoli" },
  { src: img4, place: "Torino" },
  { src: img5, place: "Bologna" },
  { src: img6, place: "Firenze" },
  { src: img7, place: "Bari" },
  { src: img8, place: "Genova" },
];

const images = [...baseImages, ...baseImages];

const getImagesPerPage = () => {
  const containerWidth = Math.min(window.innerWidth * 0.9, 1200);
  const columns = Math.max(1, Math.floor(containerWidth / 250));
  return columns * 2;
};

const GallerySection = () => {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [page, setPage] = useState(1);
  const [imagesPerPage, setImagesPerPage] = useState(getImagesPerPage());

  useEffect(() => {
    const handleResize = () => setImagesPerPage(getImagesPerPage());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => setPage(1), [imagesPerPage]);

  const totalPages = Math.ceil(images.length / imagesPerPage);
  const paginatedImages = useMemo(
    () => images.slice((page - 1) * imagesPerPage, page * imagesPerPage),
    [page, imagesPerPage]
  );

  return (
    <Section>
      <div className="container">
        <h2>{t("gallery.title")}</h2>
        <GalleryGrid>
          {paginatedImages.map((item, idx) => (
            <GalleryItem
              key={`${page}-${idx}`}
              item={item}
              onClick={() => setSelectedIndex((page - 1) * imagesPerPage + idx)}
            />
          ))}
        </GalleryGrid>

        {totalPages > 1 && (
          <PaginationWrapper>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PageDot
                key={i + 1}
                active={page === i + 1}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </PageDot>
            ))}
          </PaginationWrapper>
        )}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <Suspense fallback={<Spinner />}>
            <ImageModal
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
              images={images}
              onClose={() => setSelectedIndex(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default GallerySection;
