import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import img1 from '../assets/img/Copia di Testo del paragraf.png';
import img2 from '../assets/img/Copia di Testo del paragrafo.png';
import img3 from '../assets/img/DJSCOVERY LOGO.png';
import img4 from '../assets/img/LOGO PRINCIPALE.png';
import img5 from '../assets/img/Testo del paragrafo_HQ.png';
import img6 from '../assets/img/Testo del paragrafo_HQ2.png';
import img7 from '../assets/img/hero.png';
import img8 from '../assets/img/logo-dj.png';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from './LanguageContext';
import Spinner from './Spinner';

const ImageModal = lazy(() => import('./ImageModal'));

const Section = styled.section`
  padding: 2rem 0;
  background-color: #222;
  text-align: center;
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const Item = styled(motion.div)`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    transition: transform 0.4s;
    display: block;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const Info = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  color: var(--white);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s;

  ${Item}:hover & {
    opacity: 1;
  }
`;


const baseImages = [
  { src: img1, place: 'Roma', description: 'Panorama notturno' },
  { src: img2, place: 'Milano', description: 'Evento in piazza' },
  { src: img3, place: 'Napoli', description: 'DJ set al tramonto' },
  { src: img4, place: 'Torino', description: 'Festa nei club' },
  { src: img5, place: 'Bologna', description: 'Dance floor infuocato' },
  { src: img6, place: 'Firenze', description: 'Serata speciale' },
  { src: img7, place: 'Bari', description: 'Luci e musica' },
  { src: img8, place: 'Genova', description: 'Stage all\'aperto' },
];

const images = [...baseImages, ...baseImages];

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  gap: 0.5rem;
`;

const PageButton = styled.button`
  background: var(--red);
  color: var(--white);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const PageNumberButton = styled.button`
  background: ${({ active }) => (active ? 'var(--yellow)' : 'var(--gray)')};
  color: var(--white);
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
`;

const GalleryItem = React.memo(({ item, onClick }) => (
  <Item whileHover={{ scale: 1.02 }} onClick={() => onClick(item)}>
    <img loading="lazy" src={item.src} alt={item.place} />
    <Info>
      <h3>{item.place}</h3>
      <p>{item.description}</p>
    </Info>
  </Item>
));

const getImagesPerPage = () => {
  const containerWidth = Math.min(window.innerWidth * 0.9, 1200);
  const columns = Math.max(1, Math.floor(containerWidth / 250));
  return columns * 2; // show two rows of images
};

const GallerySection = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [imagesPerPage, setImagesPerPage] = useState(getImagesPerPage());

  useEffect(() => {
    const handleResize = () => setImagesPerPage(getImagesPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [imagesPerPage]);

  const totalPages = Math.ceil(images.length / imagesPerPage);
  const paginatedImages = useMemo(
    () => images.slice((page - 1) * imagesPerPage, page * imagesPerPage),
    [page, imagesPerPage]
  );

  return (
    <Section>
      <div className="container">
        <h2>{t('gallery.title')}</h2>
        <GalleryGrid>
          {paginatedImages.map((item, idx) => (
            <GalleryItem key={`${page}-${idx}`} item={item} onClick={setSelected} />
          ))}
        </GalleryGrid>
        {totalPages > 1 && (
          <PaginationWrapper>
            <PageButton disabled={page === 1} onClick={() => setPage(page - 1)}>
              <FaArrowLeft />
            </PageButton>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PageNumberButton
                key={i + 1}
                active={page === i + 1}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </PageNumberButton>
            ))}
            <PageButton
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <FaArrowRight />
            </PageButton>
          </PaginationWrapper>
        )}
      </div>
      <AnimatePresence>
        {selected && (
          <Suspense fallback={<Spinner />}>
            <ImageModal selected={selected} onClose={() => setSelected(null)} />
          </Suspense>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default GallerySection;
