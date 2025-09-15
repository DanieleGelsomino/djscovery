import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import { useCookieConsent } from "./CookieConsentContext";
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaEnvelope,
  FaWhatsapp,
  FaSpotify,
  FaChevronDown,
} from "react-icons/fa";
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
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;
const Brand = styled.div`
  display: grid;
  gap: 0.9rem;
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
  gap: 0.8rem;
`;
const ColHeaderBtn = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  user-select: none;
  padding-top: 0.8rem;
  margin: 0;
  color: var(--yellow);
  font-size: 1rem;
  position: relative;
  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 34px;
    height: 4px;
    border-radius: 999px;
    background: var(--yellow);
    box-shadow: 0 0 0 2px rgba(255, 209, 102, 0.15);
    @media (max-width: 640px) {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;
const Chevron = styled(FaChevronDown)`
  flex: 0 0 auto;
  transition: transform var(--transition-fast);
  opacity: 0.9;
`;
const Collapsible = styled.div`
  overflow: hidden;
  transition: max-height var(--transition-med), opacity var(--transition-med);
  &.closed {
    max-height: 0;
    opacity: 0;
  }
  &.open {
    max-height: 400px;
    opacity: 1;
  }
`;
const LinksList = styled.nav`
  display: grid;
  gap: 0.45rem;
  a {
    color: var(--white);
    opacity: 0.88;
    transition: opacity var(--transition-med), color var(--transition-med),
      transform var(--transition-fast);
  }
  a:hover,
  a:focus-visible {
    color: var(--yellow);
    opacity: 1;
    transform: translateX(2px);
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
  a.fb:hover {
    color: #1877f2;
    border-color: #4e97ff;
  }
`;
const Contacts = styled.div`
  display: grid;
  gap: 0.55rem;
  justify-items: start;
  text-align: left;
  @media (max-width: 640px) {
    justify-items: center;
    text-align: center;
  }
  a {
    color: var(--white);
    opacity: 0.9;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    overflow-wrap: anywhere;
    transition: opacity var(--transition-med), color var(--transition-med),
      transform var(--transition-fast);
  }
  a:hover,
  a:focus-visible {
    color: var(--green);
    opacity: 1;
    transform: translateY(-1px);
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
    @media (max-width: 720px) { display: none; }
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
  const email = "hello@djscovery.tv";
  const wa =
    import.meta.env.VITE_WHATSAPP_COMMUNITY_URL ||
    "https://chat.whatsapp.com/your-community";

  const [nlEmail, setNlEmail] = useState("");
  const [nlStatus, setNlStatus] = useState("idle"); // 'idle' | 'loading' | 'ok' | 'err'

  // Mobile accordion state
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState({
    explore: true,
    contacts: true,
  });

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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // Default closed on mobile, open on desktop, but allow toggling everywhere
    setOpenSections({
      explore: isMobile ? false : true,
      contacts: isMobile ? false : true,
    });
  }, [isMobile]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="fb"
                >
                  <FaFacebook />
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
                  href="https://open.spotify.com/user"
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
              <ColHeaderBtn
                type="button"
                aria-expanded={openSections.explore}
                aria-controls="footer-explore"
                onClick={() =>
                  setOpenSections((s) => ({ ...s, explore: !s.explore }))
                }
              >
                <span>{t("nav.home") || "Esplora"}</span>
                <Chevron
                  style={{
                    transform: openSections.explore
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                  aria-hidden
                />
              </ColHeaderBtn>
              <Collapsible
                id="footer-explore"
                className={openSections.explore ? "open" : "closed"}
              >
                <LinksList aria-label="Navigazione footer">
                  <Link to="/eventi">{t("nav.events") || "Eventi"}</Link>
                  <Link to="/gallery">{t("nav.gallery") || "Gallery"}</Link>
                  <Link to="/tappe">{t("nav.tappe") || "Tappe"}</Link>
                  <Link to="/chi-siamo">{t("nav.about") || "Chi siamo"}</Link>
                  <Link to="/contatti">{t("nav.contacts") || "Contatti"}</Link>
                </LinksList>
              </Collapsible>
            </Col>

            <Col>
              <ColHeaderBtn
                type="button"
                aria-expanded={openSections.contacts}
                aria-controls="footer-contacts"
                onClick={() =>
                  setOpenSections((s) => ({ ...s, contacts: !s.contacts }))
                }
              >
                <span>{t("nav.contacts") || "Contatti"}</span>
                <Chevron
                  style={{
                    transform: openSections.contacts
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                  aria-hidden
                />
              </ColHeaderBtn>
              <Collapsible
                id="footer-contacts"
                className={openSections.contacts ? "open" : "closed"}
              >
                <Contacts>
                  <a href={`mailto:${email}`} aria-label="Email">
                    <FaEnvelope /> {email}
                  </a>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp community"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>
                </Contacts>
              </Collapsible>
            </Col>
          </Grid>
        </Container>
      </Upper>

      <Divider />

      <Lower>
        <Container>
          <LowerRow>
            <Copy>
              &copy; {year}{" "}
              {t("footer.copy") || "Djscovery. Tutti i diritti riservati."}
            </Copy>
            <SmallLinks>
              <Link to="/privacy">Privacy</Link>
              <span className="dot" />
              <Link to="/cookie">Cookie</Link>
              <span className="dot" />
              <Link to="/tos">Termini</Link>
              <span className="dot" />
              <button
                type="button"
                className="linklike"
                onClick={openManager}
                aria-label="Gestisci preferenze cookie"
              >
                Gestisci cookie
              </button>
              <span className="dot" />
              <BackToTop onClick={scrollTop} aria-label="Torna su">
                ↑ Torna su
              </BackToTop>
            </SmallLinks>
          </LowerRow>
        </Container>
      </Lower>
    </Foot>
  );
};

export default Footer;
