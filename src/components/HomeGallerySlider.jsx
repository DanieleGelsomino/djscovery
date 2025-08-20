// src/components/HomeGallerySlider.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listImagesInFolder } from "../lib/driveGallery";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const HomeGallerySlider = ({
                               folderId,
                               apiKey,
                               includeSharedDrives = true,
                               autoplayMs = 3500,
                               loop = true,
                               slidesPerView = 1,
                               spaceBetween = 12,
                               caption = false,
                               className = "",
                               // breakpoints responsive opzionali (esempio sotto)
                               breakpoints = {
                                   640: { slidesPerView: 1, spaceBetween: 12 },
                                   768: { slidesPerView: 2, spaceBetween: 12 },
                                   1024: { slidesPerView: 3, spaceBetween: 16 },
                               },
                           }) => {
    // fallback su env Vite o window.APP_CONFIG
    const FOLDER_ID = useMemo(
        () =>
            folderId ??
            (import.meta?.env && import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID) ??
            (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_DRIVE_FOLDER_ID),
        [folderId]
    );
    const API_KEY = useMemo(
        () =>
            apiKey ??
            (import.meta?.env && import.meta.env.VITE_GOOGLE_API_KEY) ??
            (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY),
        [apiKey]
    );

    const [imgs, setImgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!FOLDER_ID || !API_KEY) {
                    throw new Error("Manca VITE_GOOGLE_DRIVE_FOLDER_ID o VITE_GOOGLE_API_KEY");
                }
                const items = await listImagesInFolder(FOLDER_ID, {
                    apiKey: API_KEY,
                    includeSharedDrives,
                    pageSize: 120,
                });
                if (alive) setImgs(items);
            } catch (e) {
                console.error(e);
                if (alive) setErr("Impossibile caricare la gallery.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [FOLDER_ID, API_KEY, includeSharedDrives]);

    if (loading) return <div>Carico gallery…</div>;
    if (err) return <div className="text-danger">{err}</div>;
    if (!imgs.length) return <div>Nessuna immagine disponibile.</div>;

    return (
        <div className={className}>
            <Swiper
                modules={[Autoplay, Pagination, Navigation, A11y]}
                slidesPerView={slidesPerView}
                spaceBetween={spaceBetween}
                breakpoints={breakpoints}
                loop={loop}
                autoplay={{ delay: autoplayMs, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                navigation
                style={{ width: "100%", borderRadius: 12, overflow: "hidden" }}
            >
                {imgs.map((img) => (
                    <SwiperSlide key={img.id}>
                        <figure style={{ margin: 0 }}>
                            {/* contenitore 16:9 per evitare layout shift */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    paddingTop: "56.25%",
                                    background: "#f5f6f7",
                                }}
                            >
                                <img
                                    src={img.src}
                                    alt={img.name || "gallery"}
                                    loading="lazy"
                                    onError={(e) => {
                                        // se il file non è davvero pubblico, nascondo lo slide
                                        e.currentTarget.closest(".swiper-slide").style.display = "none";
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>
                            {caption && (
                                <figcaption style={{ padding: "8px 10px", fontSize: 14 }}>
                                    {img.name}
                                </figcaption>
                            )}
                        </figure>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default HomeGallerySlider;
