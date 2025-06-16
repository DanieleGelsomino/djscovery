import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaShoppingBag } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";
import LanguageSelector from "./LanguageSelector";
import logoImg from "../assets/img/logo-dj.png";

const Nav = styled(motion.nav)`
  background-color: ${({ scrolled }) =>
    scrolled ? "var(--black)" : "transparent"};
  padding: 1rem 0;
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  backdrop-filter: blur(6px);
  box-shadow: ${({ scrolled }) =>
    scrolled ? "0 2px 8px rgba(0,0,0,0.6)" : "none"};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
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

const Logo = styled(motion(Link))`
  display: flex;
  align-items: center;
`;

const LogoImage = styled.img`
  height: 6rem;
`;

const Toggle = styled(motion.button)`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--white);
  cursor: pointer;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Menu = styled(motion.ul)`
  list-style: none;
  display: flex;
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
    color: ${({ scrolled }) => (scrolled ? 'var(--yellow)' : 'var(--white)')};
    padding: 0.5rem 1rem;
    position: relative;
    transition: color 0.3s;

    &.active {
      color: var(--green);
    }

    &:after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0%;
      height: 2px;
      background: var(--yellow);
      transition: width 0.3s;
    }

    &:hover:after {
      width: 100%;
    }
  }
`;

const MenuItem = styled(motion.li)`
  a {
    display: block;
    color: inherit;
    padding: 0.5rem 1rem;
    font-weight: 500;
  }
`;

const CartLink = styled(motion(NavLink))`
  position: relative;
  display: flex;
  align-items: center;
  transition: transform 0.2s;

  svg {
    color: var(--white);
  }
`;

const CartCount = styled.span`
  position: absolute;
  top: -4px;
  right: -8px;
  background-color: var(--green);
  color: var(--white);
  border-radius: 50%;
  height: 1.25rem;
  min-width: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  font-size: 0.75rem;
  line-height: 1;
`;

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    document.body.style.overflow = open && !isDesktop ? "hidden" : "auto";
  }, [open, isDesktop]);

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
          aria-label="Toggle menu"
        >
          {open ? <FiX /> : <FiMenu />}
        </Toggle>
        <RightSection>
          <Menu
            scrolled={scrolled}
            initial={{ x: '100%' }}
            animate={open || isDesktop ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }}
            transition={{ type: 'tween' }}
            style={{ display: open || isDesktop ? 'flex' : 'none' }}
          >
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/" onClick={() => setOpen(false)}>
                {t('nav.home')}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/eventi" onClick={() => setOpen(false)}>
                {t('nav.events')}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/shop" onClick={() => setOpen(false)}>
                {t('nav.shop')}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/chi-siamo" onClick={() => setOpen(false)}>
                {t('nav.about')}
              </NavLink>
            </MenuItem>
            <MenuItem whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <NavLink to="/contatti" onClick={() => setOpen(false)}>
                {t('nav.contacts')}
              </NavLink>
            </MenuItem>
          </Menu>
          <CartLink
            to="/carrello"
            aria-label={t('nav.cart')}
            onClick={() => setOpen(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaShoppingBag size={20} />
            {totalItems > 0 && <CartCount>{totalItems}</CartCount>}
          </CartLink>
          <LanguageSelector />
        </RightSection>
      </Container>
    </Nav>
  );
};

export default Navbar;
