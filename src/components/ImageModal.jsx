import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

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

const ImageModal = ({ selected, onClose }) => {
  if (!selected) return null;
  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContent
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={onClose}>X</CloseButton>
        <img src={selected.src} alt={selected.place} />
        <h3>{selected.place}</h3>
        <p>{selected.description}</p>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageModal;
