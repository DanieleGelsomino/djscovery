import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";

const Backdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const Wrapper = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  border-radius: 12px;
  display: block;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
`;

const ImageModal = ({ selectedIndex, setSelectedIndex, images, onClose }) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((selectedIndex + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
      }
    },
    [selectedIndex, images.length, onClose, setSelectedIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClickOutside = (e) => {
    if (e.target.dataset.backdrop) {
      onClose();
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      console.log("swiped left");
      setSelectedIndex((selectedIndex + 1) % images.length);
    },
    onSwipedRight: () => {
      console.log("swiped right");
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length);
    },
    trackMouse: true, // per abilitare anche il trascinamento con mouse
    delta: 10,
    preventScrollOnSwipe: true,
  });

  return (
    <AnimatePresence>
      <Backdrop
        data-backdrop
        onClick={handleClickOutside}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Wrapper {...swipeHandlers}>
          <ModalImage
            src={images[selectedIndex].src}
            alt={images[selectedIndex].place}
          />
        </Wrapper>
      </Backdrop>
    </AnimatePresence>
  );
};

export default ImageModal;
