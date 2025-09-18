import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { useLanguage } from "./LanguageContext";
import LanguageSelector from "./LanguageSelector";
import logoImg from "../assets/img/logo-dj.png";

// ✅ Firebase
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

const Nav = styled(motion.nav)`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  padding: 0.6rem 0;
  display: flex;
  align-items: center;
  min-height: 72px; /* uniform header height aligned with 4.5rem logo */
  background: ${({ scrolled }) =>
    scrolled ? "rgba(17,17,17,0.6)" : "transparent"};
  backdrop-filter: ${({ scrolled }) =>
    scrolled ? "saturate(180%) blur(18px)" : "none"};
  -webkit-backdrop-filter: ${({ scrolled }) =>
    scrolled ? "saturate(180%) blur(18px)" : "none"};
  border-bottom: ${({ scrolled }) =>
    scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent"};
  box-shadow: ${({ scrolled }) =>
    scrolled ? "0 8px 30px rgba(0,0,0,0.25)" : "none"};
  transition: background var(--transition-med), box-shadow var(--transition-med),
    border-color var(--transition-med), padding var(--transition-fast);
`;

const Container = styled.div`
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const LoginLink = styled(motion(Link))`
  font-size: 2rem;
  color: var(--yellow);
  display: flex;
  align-items: center;
`;

const Logo = styled(motion(Link))`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 2rem;
  width: auto;
  display: block;
`;

const Toggle = styled(motion.button)`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--white);
  cursor: pointer;
  display: none;
  align-items: center;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const Menu = styled(motion.ul)`
  list-style: none;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    position: fixed;
    inset: 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--black);
    width: 100%;
    height: 100vh;
    padding: 2rem;
    z-index: 2000;
    transform-origin: top right;
  }

  li a {
    color: ${({ scrolled }) => (scrolled ? "var(--white)" : "var(--white)")};
    padding: 0.5rem 0.25rem;
    position: relative;
    transition: color var(--transition-med), opacity var(--transition-med);

    &.active {
      color: var(--yellow);
    }

    &:after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 100%;
      height: 2px;
      background: var(--yellow);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--transition-med);
      opacity: 0.9;
    }

    &:hover:after {
      transform: scaleX(1);
    }
  }
`;

const MenuItem = styled(motion.li)`
  display: flex;
  align-items: center;
  a {
    display: flex;
    align-items: center;
    color: inherit;
    padding: 0.5rem 1rem;
    font-weight: 500;
    line-height: 1;
  }
`;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth > 768 : true
  );
  const [isAdmin, setIsAdmin] = useState(false); // 👈 mostra bottone solo agli admin autenticati

  const { t } = useLanguage();

  // scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // chiudi menu quando torni desktop
  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  // blocca scroll su mobile quando menu aperto
  useEffect(() => {
    document.body.style.overflow = open && !isDesktop ? "hidden" : "auto";
  }, [open, isDesktop]);

  // ✅ ascolta Firebase Auth e verifica la claim admin
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const tokenResult = await user.getIdTokenResult(true);
        setIsAdmin(!!tokenResult.claims?.admin);
      } catch {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  return (
    <Nav
      scrolled={scrolled}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container>
        <Logo whileHover={{ rotate: 2 }} to="/">
          <LogoImage src={logoImg} alt="Djscovery logo" />
        </Logo>
        <Toggle
          onClick={() => setOpen(!open)}
          whileTap={{ scale: 0.9 }}
          aria-label="Apri/chiudi menu di navigazione"
          aria-controls="main-menu"
          aria-expanded={open}
        >
          {open ? <FiX /> : <FiMenu />}
        </Toggle>
        <RightSection>
          <Menu
            id="main-menu"
            scrolled={scrolled}
            initial={{ x: "100%" }}
            animate={
              open || isDesktop
                ? { x: 0, opacity: 1 }
                : { x: "100%", opacity: 0 }
            }
            transition={{ type: "tween" }}
            style={{ display: open || isDesktop ? "flex" : "none" }}
          >
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/" onClick={() => setOpen(false)}>
                {t("nav.home")}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/gallery" onClick={() => setOpen(false)}>
                {t("nav.gallery")}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/eventi" onClick={() => setOpen(false)}>
                {t("nav.events")}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/tappe" onClick={() => setOpen(false)}>
                {t("nav.tappe") || "Tappe"}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/chi-siamo" onClick={() => setOpen(false)}>
                {t("nav.about")}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/contatti" onClick={() => setOpen(false)}>
                {t("nav.contacts")}
              </NavLink>
            </MenuItem>
          </Menu>

          <LanguageSelector />

          {/* 👇 MOSTRA SOLO AGLI ADMIN LOGGATI */}
          {isAdmin && (
            <LoginLink
              to="/admin/panel"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Admin panel"
              title="Admin panel"
            >
              <FaUserCircle />
            </LoginLink>
          )}
        </RightSection>
      </Container>
    </Nav>
  );
};

export default Navbar;
