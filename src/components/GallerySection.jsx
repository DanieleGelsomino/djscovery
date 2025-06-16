import React, { useState } from 'react';
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
import { useLanguage } from './LanguageContext';

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

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: #111;
  padding: 1rem;
  border-radius: 8px;
  max-width: 90%;
  width: 600px;
  text-align: center;

  img {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
`;

const CloseButton = styled.button`
  align-self: flex-end;
  background: var(--red);
  color: var(--white);
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
`;

const images = [
  { src: img1, place: 'Roma', description: 'Panorama notturno' },
  { src: img2, place: 'Milano', description: 'Evento in piazza' },
  { src: img3, place: 'Napoli', description: 'DJ set al tramonto' },
  { src: img4, place: 'Torino', description: 'Festa nei club' },
  { src: img5, place: 'Bologna', description: 'Dance floor infuocato' },
  { src: img6, place: 'Firenze', description: 'Serata speciale' },
  { src: img7, place: 'Bari', description: 'Luci e musica' },
  { src: img8, place: 'Genova', description: 'Stage all\'aperto' },
];

const GallerySection = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);

  return (
    <Section>
      <div className="container">
        <h2>{t('gallery.title')}</h2>
        <GalleryGrid>
          {images.map((item, idx) => (
            <Item
              key={idx}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelected(item)}
            >
              <img src={item.src} alt={item.place} />
              <Info>
                <h3>{item.place}</h3>
                <p>{item.description}</p>
              </Info>
            </Item>
          ))}
        </GalleryGrid>
      </div>
      <AnimatePresence>
        {selected && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <ModalContent
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CloseButton onClick={() => setSelected(null)}>X</CloseButton>
              <img src={selected.src} alt={selected.place} />
              <h3>{selected.place}</h3>
              <p>{selected.description}</p>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </Section>
  );
};

export default GallerySection;
