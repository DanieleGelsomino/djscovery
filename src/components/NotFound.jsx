import React from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FiHome, FiMail } from "react-icons/fi";
import { useLanguage } from "./LanguageContext";
import heroImg from "../assets/img/hero.png";

const Wrapper = styled.section`
    min-height: calc(100vh - 80px);
    display: grid;
    place-items: center;
    padding: 2rem;
    background-image: linear-gradient(rgba(0,0,0,.6), rgba(0,0,0,.7)), url(${heroImg});
    background-size: cover;
    background-position: center;
`;

const Card = styled(motion.div)`
    width: 100%;
    max-width: 720px;
    padding: 2rem;
    border-radius: 16px;
    backdrop-filter: blur(8px);
    background: rgba(255,255,255,.08);
    box-shadow: 0 8px 24px rgba(0,0,0,.4);
    color: var(--white);
    text-align: center;
`;

const Code = styled(motion.h1)`
    font-size: clamp(4rem, 12vw, 8rem);
    line-height: 1;
    margin: 0;
    letter-spacing: 2px;
    font-weight: 800;
    background: linear-gradient(90deg, var(--yellow), var(--green));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
`;

const Subtitle = styled(motion.h2)`
    margin: .25rem 0 1rem 0;
    font-size: clamp(1.1rem, 3vw, 1.5rem);
    color: #fff;
    font-weight: 600;
`;

const PathHint = styled(motion.p)`
    margin: 0 0 1.25rem 0;
    color: rgba(255,255,255,.85);
    font-size: .95rem;
    word-break: break-all;
`;

const Buttons = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: .75rem;
    margin-top: 1rem;

    @media (min-width: 520px) {
        grid-template-columns: 1fr 1fr;
    }
`;

const Btn = styled(motion(Link))`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .85rem 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.2);
    background: rgba(0,0,0,.25);
    color: var(--white);
    text-decoration: none;
    font-weight: 600;

    &:hover {
        border-color: rgba(255,255,255,.35);
        transform: translateY(-1px);
    }
`;

/* ====== VINILE ====== */
const Vinyl = styled(motion.div)`
    width: 180px;
    height: 180px;
    margin: 0 auto 0.75rem auto;
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,.5);

    /* Corpo disco */
    background:
            radial-gradient(circle at 50% 50%, #242424 0%, #171717 55%, #0c0c0c 72%, #000 100%);

    /* Solchi sottili diffusi */
    &:after {
        content: "";
        position: absolute;
        inset: 0;
        background:
                repeating-radial-gradient(circle at 50% 50%,
                rgba(255,255,255,.045) 0px,
                rgba(255,255,255,.045) 1px,
                transparent 2px,
                transparent 4px
                );
        mix-blend-mode: overlay;
        pointer-events: none;
    }

    /* Etichetta centrale */
    &:before {
        content: "";
        position: absolute;
        top: 50%; left: 50%;
        width: 56px; height: 56px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: radial-gradient(circle, #ffd54f 0%, #ffb300 60%, #f57c00 100%);
        box-shadow: inset 0 0 0 4px rgba(0,0,0,.25);
    }
`;

/* 👇 Nuove linee concentriche interne (più visibili) */
const InnerRings = styled.div`
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 110px; height: 110px; /* area attorno all'etichetta */
    border-radius: 50%;
    pointer-events: none;
    /* alcune “tracce” marcate, stile anelli */
    box-shadow:
            0 0 0 2px rgba(255,255,255,.10),
            0 0 0 8px rgba(255,255,255,.08),
            0 0 0 14px rgba(255,255,255,.065),
            0 0 0 20px rgba(255,255,255,.055),
            0 0 0 26px rgba(255,255,255,.045);
    mix-blend-mode: overlay;
`;

const CenterHole = styled.div`
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #000;
    box-shadow: 0 0 0 2px rgba(255,255,255,.2);
`;

const DropShadow = styled(motion.div)`
  width: 140px;
  height: 18px;
  margin: 0 auto 1rem auto;
  background: radial-gradient(ellipse at center, rgba(0,0,0,.45) 0%, transparent 70%);
  filter: blur(2px);
`;
/* ====== FINE VINILE ====== */

const NotFound = () => {
    const { t } = useLanguage();
    const { pathname } = useLocation();

    return (
        <Wrapper>
            <Card
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease: "easeOut" }}
            >
                {/* Vinile fluttuante + rotazione lenta */}
                <Vinyl
                    role="img"
                    aria-label="Vinile fluttuante"
                    animate={{ y: [0, -8, 0], rotate: [0, 360] }}
                    transition={{
                        y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 12, repeat: Infinity, ease: "linear" }
                    }}
                >
                    <InnerRings /> {/* 👈 nuove linee interne */}
                    <CenterHole />
                </Vinyl>
                <DropShadow
                    animate={{ scaleX: [1, 0.92, 1], opacity: [0.9, 0.75, 0.9] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                <Code
                    initial={{ letterSpacing: "-.25em", opacity: 0 }}
                    animate={{ letterSpacing: ".02em", opacity: 1 }}
                    transition={{ duration: .6 }}
                >
                    404
                </Code>

                <Subtitle
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: .1, duration: .5 }}
                >
                    {t?.("notFound.title") || "Pagina non trovata"}
                </Subtitle>

                <PathHint
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: .9, y: 0 }}
                    transition={{ delay: .2, duration: .5 }}
                    aria-live="polite"
                >
                    {t?.("notFound.desc") || "Il percorso richiesto non esiste:"} <strong>{pathname}</strong>
                </PathHint>

                <Buttons>
                    <Btn to="/" whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                        <FiHome /> {t?.("nav.home") || "Homepage"}
                    </Btn>
                    <Btn to="/contatti" whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
                        <FiMail /> {t?.("nav.contacts") || "Contatti"}
                    </Btn>
                </Buttons>
            </Card>
        </Wrapper>
    );
};

export default NotFound;
