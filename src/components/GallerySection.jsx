import React, {
  useState,
  useMemo,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useCallback,
} from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import Spinner from "./Spinner";
import { fetchGallery } from "../api";


const ImageModal = lazy(() => import("./ImageModal"));

const Section = styled.section`
  padding: 1rem 0;
  background-color: #000;
  color: #fff;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GalleryGrid = styled.div`
  display: grid;
  gap: 2px;
  grid-template-columns: repeat(3, 1fr);
  width: 100%;

  @media (min-width: 600px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const Item = styled(motion.div)`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  cursor: pointer;
  background-color: #111;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const GalleryItem = React.memo(({ item, onClick }) => (
  <Item onClick={onClick}>
    <img src={item.src} alt={item.place} loading="lazy" decoding="async" />
  </Item>
));

const GallerySection = () => {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [visibleImages, setVisibleImages] = useState(15);
  const [galleryImages, setGalleryImages] = useState([]);
  const loaderRef = useRef();

  const images = useMemo(
    () => galleryImages.map((g) => ({ src: g.src, place: "" })),
    [galleryImages]
  );

  useEffect(() => {
    fetchGallery().then(setGalleryImages).catch(() => {});
  }, []);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        setVisibleImages((prev) => Math.min(prev + 10, images.length));
      }
    },
    [images.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const paginatedImages = useMemo(
    () => images.slice(0, visibleImages),
    [visibleImages, images]
  );

  return (
    <Section>
      <div className="container">
        <motion.h2 layout transition={{ duration: 0.4 }}>
          {t("gallery.title")}
        </motion.h2>
        <GalleryGrid>
          {paginatedImages.map((item, idx) => (
            <GalleryItem
              key={`${idx}`}
              item={item}
              onClick={() => setSelectedIndex(idx)}
            />
          ))}
        </GalleryGrid>
        <div ref={loaderRef} style={{ height: "50px", marginTop: "2rem" }} />
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
