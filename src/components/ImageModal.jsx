import React, { useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

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
    user-select: none;
`;

/* ⬇️ frecce nascoste su mobile, visibili da tablet/desktop */
const NavButton = styled.button`
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.12);
    border: none;
    color: white;
    font-size: 1.25rem;
    padding: 0.6rem;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s ease;
    z-index: 10;

    &:hover { background: rgba(255, 255, 255, 0.28); }

    &.prev { left: .75rem; }
    &.next { right: .75rem; }

    /* 👉 nascondi su mobile */
    @media (max-width: 767px) {
        display: none;
    }
`;

export default function ImageModal({ selectedIndex, setSelectedIndex, images, onClose }) {
    // blocca lo scroll del body quando il modal è aperto
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const goNext = useCallback(
        () => setSelectedIndex(i => (i + 1) % images.length),
        [images.length, setSelectedIndex]
    );
    const goPrev = useCallback(
        () => setSelectedIndex(i => (i - 1 + images.length) % images.length),
        [images.length, setSelectedIndex]
    );

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") onClose?.();
        else if (e.key === "ArrowRight") goNext();
        else if (e.key === "ArrowLeft") goPrev();
    }, [goNext, goPrev, onClose]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleClickOutside = (e) => {
        if (e.target.dataset.backdrop) onClose?.();
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: goNext,
        onSwipedRight: goPrev,
        trackMouse: true,
        delta: 10,
        preventScrollOnSwipe: true,
    });

    if (!images?.length) return null;
    const current = images[selectedIndex] || {};

    // Scegli la prima sorgente valida + fallback robusto
    const primarySrc =
        current.src || current.url || current.href || current.image || current.srcLarge || current.fallbackSrc || "";

    const handleImgError = (e) => {
        const el = e.currentTarget;
        // tenta una sola volta il fallback
        if (current.fallbackSrc && el.src !== current.fallbackSrc) {
            el.src = current.fallbackSrc;
            return;
        }
        // ultimo tentativo: link gDrive "uc?id="
        if (current.id) {
            const altDrive = `https://drive.google.com/uc?id=${current.id}`;
            if (el.src !== altDrive) {
                el.src = altDrive;
                return;
            }
        }
        // niente da fare ⇒ lascia l'immagine "rotta" (o potresti chiuderla)
    };

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
                        src={primarySrc}
                        alt={current.name || "gallery image"}
                        decoding="async"
                        loading="eager"
                        draggable={false}
                        onError={handleImgError}
                    />
                </Wrapper>
            </Backdrop>
        </AnimatePresence>
    );
}
