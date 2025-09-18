import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { useCookieConsent } from "./CookieConsentContext";
import {
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaWhatsapp,
  FaSpotify,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import logoImg from "../assets/img/logo-dj.png";
import { subscribeNewsletter } from "../api";

/* Aesthetic helpers */
const shimmer = keyframes`
  0% { transform: translateX(-100%) }
  100% { transform: translateX(100%) }
`;

/* Layout */
const Foot = styled(motion.footer)`
  position: relative;
  color: var(--white);
  background: radial-gradient(
      1200px 600px at -10% -10%,
      rgba(255, 209, 102, 0.07),
      transparent 60%
    ),
    radial-gradient(
      900px 600px at 110% 10%,
      rgba(33, 191, 115, 0.07),
      transparent 60%
    ),
    linear-gradient(180deg, rgba(16, 16, 16, 0.96), rgba(14, 14, 14, 0.96));
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);
  isolation: isolate;

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.04) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: radial-gradient(120% 90% at 50% 0%, #000 45%, transparent 100%);
    opacity: 0.35;
  }
  &:after {
    content: "";
    position: absolute;
    top: -26px;
    left: 0;
    right: 0;
    height: 26px;
    background: radial-gradient(
      80% 120% at 50% 120%,
      rgba(255, 255, 255, 0.08),
      transparent 70%
    );
    filter: blur(8px);
    pointer-events: none;
  }
`;

const AccentBar = styled.div`
  height: 2px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #ffd16633, #21bf7333, #ffd16633);
  &:after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, #ffd166, transparent);
    animation: ${shimmer} 3.5s linear infinite;
    opacity: 0.35;
  }
`;

const Upper = styled.div`
  padding: 2.8rem 0 1.8rem;
`;
const Container = styled.div`
  max-width: 1200px;
  padding: 0 20px;
  margin: 0 auto;
`;
const Grid = styled.div`
  display: grid;
  gap: 2rem;
  grid-template-columns: 1.2fr 1fr 1.2fr;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
    gap: 0.9rem;
    align-items: start;
  }
`;
const Brand = styled.div`
  display: grid;
  gap: 0.9rem;

  @media (max-width: 1000px) {
    grid-column: 1 / -1;
    text-align: center;
  }
`;
const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: inherit;
  transition: transform var(--transition-fast), filter var(--transition-med);
  &:hover {
    transform: translateY(-1px);
    filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.25));
  }
`;
const LogoImg = styled.img`
  height: 58px;
  width: auto;
  display: block;
  @media (max-width: 560px) {
    height: 50px;
  }
`;
const Tagline = styled.p`
  opacity: 0.9;
  font-size: 0.98rem;
  line-height: 1.45;
  max-width: 680px;
`;
const Col = styled.div`
  display: grid;
  align-content: start;
  gap: 0.6rem;
  text-align: left;

  @media (max-width: 640px) {
    justify-items: flex-start;
  }
`;
const LinksList = styled.nav`
  display: grid;
  gap: 0.55rem;

  a {
    color: rgba(255, 255, 255, 0.88);
    font-weight: 500;
    letter-spacing: 0.18px;
    font-size: 0.9rem;
    transition: color var(--transition-med);
  }

  a:hover,
  a:focus-visible {
    color: var(--yellow);
  }

  @media (max-width: 640px) {
    justify-items: flex-start;
    a {
      font-size: 0.92rem;
      letter-spacing: 0.1px;
    }
  }
`;
const Social = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  @media (max-width: 640px) {
    justify-content: center;
  }
  a {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    transition: transform var(--transition-fast),
      border-color var(--transition-med), background var(--transition-med),
      filter var(--transition-med);
  }
  a:hover,
  a:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.12);
    filter: drop-shadow(0 6px 22px rgba(0, 0, 0, 0.25));
  }
  a.ig:hover {
    border-color: #feda75;
    color: #feda75;
  }
  a.yt:hover {
    border-color: #ff3355;
    color: #ff3355;
  }
  a.sp:hover {
    color: #1db954;
    border-color: #38d56d;
  }
  a.tt:hover {
    color: #25f4ee; /* TikTok cyan */
    border-color: #fe2c55; /* TikTok pink */
  }
`;
const Contacts = styled.div`
  display: grid;
  gap: 0.6rem;
  justify-items: start;
  text-align: left;
  a {
    color: rgba(255, 255, 255, 0.92);
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    max-width: 100%;
    transition: color var(--transition-med);
  }
  a:hover,
  a:focus-visible {
    color: var(--yellow);
  }

  a span {
    flex: 1;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  @media (max-width: 640px) {
    justify-items: flex-start;
  }
`;

const MobileContactsList = styled(Contacts)`
  @media (max-width: 640px) {
    gap: 0.55rem;
    a {
      font-size: 0.9rem;
      gap: 0.4rem;
      align-items: center;
    }
  }
`;
const NewsForm = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  @media (max-width: 640px) {
    justify-content: center;
  }
`;
const EmailInput = styled.input`
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--white);
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  outline: none;
  transition: border-color var(--transition-med),
    background var(--transition-med), box-shadow var(--transition-med);
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  &:focus {
    border-color: var(--yellow);
    background: rgba(255, 255, 255, 0.12);
    box-shadow: 0 0 0 3px rgba(255, 209, 102, 0.18);
  }
`;
const SubmitBtn = styled.button`
  background: var(--yellow);
  color: var(--black);
  font-weight: 800;
  padding: 0.65rem 0.95rem;
  border-radius: 10px;
  border: 0;
  cursor: pointer;
  transition: transform var(--transition-fast), filter var(--transition-med);
  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.03);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const Divider = styled.hr`
  height: 1px;
  border: none;
  margin: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.16),
    rgba(255, 255, 255, 0)
  );
`;
const Lower = styled.div`
  padding: 1rem 0 1.3rem;
  font-size: 0.96rem;
  text-align: center;
`;
const LowerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  @media (max-width: 720px) {
    justify-content: center;
  }
`;
const Copy = styled.span`
  opacity: 0.9;
`;
const SmallLinks = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  @media (max-width: 720px) {
    width: 100%;
  }
  a {
    color: var(--yellow);
  }
  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.35);
    display: inline-block;
    @media (max-width: 720px) {
      display: none;
    }
  }
  button.linklike {
    background: transparent;
    border: 0;
    padding: 0;
    color: var(--yellow);
    cursor: pointer;
    font: inherit;
  }
`;
const BackToTop = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: var(--white);
  padding: 0.55rem 0.8rem;
  border-radius: 12px;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-med),
    border-color var(--transition-med);
  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.28);
  }
  @media (max-width: 720px) {
    flex-basis: 100%;
    width: 100%;
    text-align: center;
    min-height: 44px; /* tap target */
    margin-top: 6px;
  }
`;

/* Component */
const Footer = () => {
  const { t } = useLanguage();
  const { openManager } = useCookieConsent(); // <-- QUI (prima del return)
  const year = new Date().getFullYear();
  const email = "djscovery.channel@gmail.com";
  const wa =
    import.meta.env.VITE_WHATSAPP_COMMUNITY_URL ||
    "https://chat.whatsapp.com/HheBIUyTc9R6MuPcGu7guj?mode=ems_sms_t";

  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState("idle"); // 'idle' | 'loading' | 'ok' | 'err'

  const onSubscribe = async (e) => {
    e.preventDefault();
    if (!nlEmail) return;
    try {
      setNlStatus("loading");
      await subscribeNewsletter(nlEmail, {
        website: window?.location?.host || "",
      });
      setNlStatus("ok");
      setNlEmail("");
    } catch {
      setNlStatus("err");
    }
  };

  useEffect(() => {
    if (nlStatus === "ok" || nlStatus === "err") {
      const id = setTimeout(() => setNlStatus("idle"), 3000);
      return () => clearTimeout(id);
    }
  }, [nlStatus]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const copyText = t("footer.copy") || "Djscovery. Tutti i diritti riservati.";
  const privacyLabel = t("footer.privacy") || "Privacy";
  const cookiesLabel = t("footer.cookies") || "Cookie";
  const termsLabel = t("footer.terms") || "Termini";
  const manageCookiesLabel = t("footer.manage_cookies") || "Gestisci cookie";
  const backToTopLabel = t("footer.back_to_top") || "Torna su";

  return (
    <Foot initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AccentBar aria-hidden />
      <Upper>
        <Container>
          <Grid>
            <Brand>
              <Logo to="/" aria-label="Djscovery home">
                <LogoImg src={logoImg} alt="Djscovery" />
              </Logo>
              <Tagline>
                {t("footer.text") ||
                  "Community, eventi e musica: scopri il mondo Djscovery."}
              </Tagline>
              <Social aria-label="Social media">
                <motion.a
                  whileHover={{ scale: 1.06 }}
                  href="https://instagram.com/djscovery.tv"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="ig"
                >
                  <FaInstagram />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.06 }}
                  href="https://www.tiktok.com/@djscovery.tv"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="tt"
                >
                  <SiTiktok />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.06 }}
                  href="https://www.youtube.com/@djscoverytv"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="yt"
                >
                  <FaYoutube />
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.06 }}
                  href="https://open.spotify.com/user/31cxctdzgar4zt2trblfp55ebpl4?si=13e12fbb6994410a&nd=1&dlsi=7ed72ca7c49e4954"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Spotify"
                  className="sp"
                >
                  <FaSpotify />
                </motion.a>
              </Social>
            </Brand>

            <Col>
              <ColTitle>{t("nav.home") || "Esplora"}</ColTitle>
              <LinksList aria-label="Navigazione footer">
                <Link to="/eventi">{t("nav.events") || "Eventi"}</Link>
                <Link to="/gallery">{t("nav.gallery") || "Gallery"}</Link>
                <Link to="/tappe">{t("nav.tappe") || "Tappe"}</Link>
                <Link to="/chi-siamo">{t("nav.about") || "Chi siamo"}</Link>
                <Link to="/contatti">{t("nav.contacts") || "Contatti"}</Link>
              </LinksList>
            </Col>

            <Col>
              <ColTitle>{t("nav.contacts") || "Contatti"}</ColTitle>
              <MobileContactsList>
                <a href={`mailto:${email}`} aria-label="Email">
                  <FaEnvelope />
                  <span>{email}</span>
                </a>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp community"
                >
                  <FaWhatsapp />
                  <span>WhatsApp</span>
                </a>
              </MobileContactsList>
            </Col>
          </Grid>
        </Container>
      </Upper>

      <Divider />

      <Lower>
        <Container>
          <LowerRow>
            <Copy>
              &copy; {year} {copyText}
            </Copy>
            <SmallLinks>
              <Link to="/privacy">{privacyLabel}</Link>
              <span className="dot" />
              <Link to="/cookie">{cookiesLabel}</Link>
              <span className="dot" />
              <Link to="/tos">{termsLabel}</Link>
              <span className="dot" />
              <button
                type="button"
                className="linklike"
                onClick={openManager}
                aria-label={manageCookiesLabel}
              >
                {manageCookiesLabel}
              </button>
              <span className="dot" />
              <BackToTop onClick={scrollTop} aria-label={backToTopLabel}>
                ↑ {backToTopLabel}
              </BackToTop>
            </SmallLinks>
          </LowerRow>
        </Container>
      </Lower>
    </Foot>
  );
};

export default Footer;
const ColTitle = styled.div`
  font-weight: 700;
  letter-spacing: 2.4px;
  color: var(--yellow);
  text-transform: uppercase;
  font-size: 0.8rem;
`;
