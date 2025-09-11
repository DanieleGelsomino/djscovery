// src/components/GallerySection.jsx
import React, {
    useState, useMemo, lazy, Suspense, useEffect, useRef, useCallback,
} from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "./Spinner";
import { GalleryTileSkeleton } from "./Skeletons";
import { useLanguage } from "./LanguageContext";
import { listImagesInFolder } from "../lib/driveGallery";

const ImageModal = lazy(() => import("./ImageModal"));

/* ====== CONFIG ====== */
const FOLDER_ID =
    (import.meta?.env && import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID) ||
    (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID);

const API_KEY =
    (import.meta?.env && import.meta.env.VITE_GOOGLE_API_KEY) ||
    (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY);

/* ====== STYLES ====== */
const Section = styled.section`
    padding: 1rem 0 2rem;
    background-color: #000;
    color: #fff;
    text-align: center;
    display: flex; flex-direction: column; align-items: center;
`;

const Subtitle = styled(motion.p)`
    max-width: 68ch;
    margin: .35rem auto 1rem;
    padding: 0 .75rem;
    color: rgba(255,255,255,.8);
    font-size: .95rem;
    line-height: 1.45;
`;

const GalleryGrid = styled.div`
    display: grid;
    gap: 2px;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
    @media (min-width: 600px) { grid-template-columns: repeat(4, 1fr); }
    @media (min-width: 1024px) { grid-template-columns: repeat(5, 1fr); }
`;

const Item = styled(motion.div)`
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    cursor: pointer;
    background-color: #111;
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

const Empty = styled.div`
  opacity: .85;
  font-size: .95rem;
  padding: 2rem .75rem;
`;

/* ====== THUMB ====== */
const LazyImg = React.memo(function LazyImg({ id, name, fallbackSrc, onClick }) {
    const ref = useRef(null);
    const [errored, setErrored] = useState(false);

    const cdnDefault = id ? `https://lh3.googleusercontent.com/d/${id}=w640` : (fallbackSrc || "");
    const cdnSet = id
        ? [320, 480, 768, 1024, 1600]
            .map((w) => `https://lh3.googleusercontent.com/d/${id}=w${w} ${w}w`)
            .join(", ")
        : undefined;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const img = el.querySelector("img");
                    if (img && !img.getAttribute("src")) {
                        img.setAttribute("src", cdnDefault);
                        if (cdnSet) {
                            img.setAttribute("srcset", cdnSet);
                            img.setAttribute("sizes", "(max-width:768px) 33vw, 20vw");
                        }
                    }
                    obs.disconnect();
                }
            },
            { root: null, rootMargin: "200px", threshold: 0.01 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [cdnDefault, cdnSet]);

    return (
        <Item ref={ref} onClick={onClick} whileHover={{ scale: 1.01 }}>
            <img
                alt={name || "gallery"}
                decoding="async"
                loading="lazy"
                style={{ background: "#111" }}
                onError={(e) => {
                    if (!errored) {
                        setErrored(true);
                        e.currentTarget.removeAttribute("srcset");
                        e.currentTarget.removeAttribute("sizes");
                        e.currentTarget.src = fallbackSrc || "";
                    } else {
                        (e.currentTarget.parentElement).style.display = "none";
                    }
                }}
            />
        </Item>
    );
});

/* ====== COMPONENT ====== */
const GallerySection = () => {
    const { t } = useLanguage();
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [visibleImages, setVisibleImages] = useState(15);
    const [driveImages, setDriveImages] = useState([]); // [{id,name,src,fallbackSrc}]
    const [loading, setLoading] = useState(true);
    const loaderRef = useRef(null);

    // Fetch from Drive
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!FOLDER_ID) throw new Error("Manca FOLDER_ID");
                const list = await listImagesInFolder(FOLDER_ID, {
                    apiKey: API_KEY || "",
                    includeSharedDrives: true,
                    pageSize: 120,
                });
                if (!alive) return;
                setDriveImages(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error(err);
                if (!alive) return;
                setDriveImages([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    // Normalizza per il modal: URL grande + alias compatibili
    const images = useMemo(
        () =>
            driveImages.map((g) => {
                const id = g.id;
                // URL grande affidabile (come nello slider)
                const full = id ? `https://lh3.googleusercontent.com/d/${id}=w1280` : (g.src || "");
                // fallback possibili
                const fallback =
                    g?.fallbackSrc ||
                    g?.src ||
                    (id ? `https://drive.google.com/uc?id=${id}` : "");

                // alias per compat con qualunque ImageModal già esistente
                return {
                    id,
                    name: g.name,
                    src: full,                // <img src={image.src} />
                    url: full,                // se il modal usa "url"
                    href: full,               // se usa "href"
                    image: full,              // se usa "image"
                    srcLarge: full,           // se usa "srcLarge"
                    fallbackSrc: fallback,
                    title: g.name,            // se usa "title"
                };
            }),
        [driveImages]
    );

    // Infinite scroll
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
        if (!images.length || !loaderRef.current) return;
        const observer = new IntersectionObserver(handleObserver, {
            root: null, rootMargin: "0px", threshold: 0.2,
        });
        observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [handleObserver, images.length]);

    const paginatedImages = useMemo(
        () => images.slice(0, Math.min(visibleImages, images.length)),
        [visibleImages, images]
    );

    // Apri rispettando l'indice GLOBALE (per usare SEMPRE lo stesso array del modal)
    const openAt = useCallback((id) => {
        const i = images.findIndex((x) => x.id === id);
        if (i >= 0) setSelectedIndex(i);
    }, [images]);

    return (
        <Section>
            <div className="container" style={{ width: "100%" }}>
                <motion.h2 layout transition={{ duration: 0.4 }}>
                    {t("gallery.title")}
                </motion.h2>

                <Subtitle
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: .35 }}
                >
                    {t("gallery.subtitle") ?? "Scatti dalle nostre serate: tocca un’immagine per ingrandire."}
                </Subtitle>

                {loading && (
                    <GalleryGrid>
                        {Array.from({ length: 15 }).map((_, i) => (
                            <GalleryTileSkeleton key={i} />
                        ))}
                    </GalleryGrid>
                )}

                {!loading && images.length === 0 && (
                    <Empty>{t("gallery.empty") ?? "Nessuna immagine disponibile."}</Empty>
                )}

                {!loading && images.length > 0 && (
                    <>
                        <GalleryGrid>
                            {paginatedImages.map((g) => (
                                <LazyImg
                                    key={g.id}
                                    id={g.id}
                                    name={g.name}
                                    fallbackSrc={g.fallbackSrc}
                                    onClick={() => openAt(g.id)}   // 👉 indice globale per il modal esistente
                                />
                            ))}
                        </GalleryGrid>
                        <div ref={loaderRef} style={{ height: 50, marginTop: "2rem", width: "100%" }} />
                    </>
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

export default React.memo(GallerySection);
