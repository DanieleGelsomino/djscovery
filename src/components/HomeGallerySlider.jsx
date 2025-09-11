// src/components/HomeGallerySlider.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listImagesInFolder } from "../lib/driveGallery";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { SliderSkeleton } from "./Skeletons";

const widths = [480, 768, 1024, 1600];

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
                               breakpoints = {
                                   640: { slidesPerView: 1, spaceBetween: 12 },
                                   768: { slidesPerView: 2, spaceBetween: 12 },
                                   1024: { slidesPerView: 3, spaceBetween: 16 },
                               },
                           }) => {
    // 1) Hook SEMPRE allo stesso ordine
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
                if (!FOLDER_ID) throw new Error("Manca VITE_GOOGLE_DRIVE_FOLDER_ID");
                const items = await listImagesInFolder(FOLDER_ID, {
                    apiKey: API_KEY || "",
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

    // 2) Anche QUESTO è un hook → deve stare prima di qualunque return
    const slides = useMemo(() => {
        return imgs.map((img) => {
            const cdnSet = widths
                .map((w) => `https://lh3.googleusercontent.com/d/${img.id}=w${w} ${w}w`)
                .join(", ");
            const cdnDefault = `https://lh3.googleusercontent.com/d/${img.id}=w1280`;

            return (
                <SwiperSlide key={img.id}>
                    <figure style={{ margin: 0 }}>
                        <div
                            style={{
                                position: "relative",
                                width: "100%",
                                paddingTop: "56.25%",
                                background: "#111",
                            }}
                        >
                            <img
                                src={cdnDefault}
                                srcSet={cdnSet}
                                sizes="(max-width:768px) 100vw, 50vw"
                                alt={img.name || "gallery"}
                                loading="lazy"
                                decoding="async"
                                fetchpriority="low"
                                onError={(e) => {
                                    e.currentTarget.removeAttribute("srcset");
                                    e.currentTarget.removeAttribute("sizes");
                                    e.currentTarget.src = img.fallbackSrc;
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
            );
        });
    }, [imgs, caption]);

    // 3) Ora i return condizionali possono stare qui sotto
    if (loading) return <SliderSkeleton count={3} />;
    if (err) return <div className="text-danger">{err}</div>;
    if (!imgs.length) return <div>Nessuna immagine disponibile.</div>;

    return (
        <div className={className}>
            <Swiper
                modules={[Autoplay]}
                slidesPerView={slidesPerView}
                spaceBetween={spaceBetween}
                breakpoints={breakpoints}
                loop={loop}
                autoplay={{ delay: autoplayMs, disableOnInteraction: false }}
                style={{ width: "100%", overflow: "hidden" }}
            >
                {slides}
            </Swiper>
        </div>
    );
};

export default React.memo(HomeGallerySlider);
