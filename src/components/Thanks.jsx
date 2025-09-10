import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import heroImg from "../assets/img/hero.png";

const Wrapper = styled.section`
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  padding: 2rem;
  background-image: linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.65)), url(${heroImg});
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

const Title = styled(motion.h1)`
  margin: 0 0 .5rem 0;
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  font-weight: 800;
`;

const Subtitle = styled(motion.p)`
  margin: 0 0 1.25rem 0;
  color: rgba(255,255,255,.9);
  font-size: 1rem;
`;

const Btn = styled(motion(Link))`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .85rem 1.1rem;
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

const Thanks = () => {
  const { t } = useLanguage();
  return (
    <Wrapper>
      <Card initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
        <Title>{t("thanks.title") || "Grazie!"}</Title>
        <Subtitle>
          {t("thanks.subtitle") || "La tua iscrizione è stata confermata. A presto nella newsletter!"}
        </Subtitle>
        <Btn to="/" whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.02 }}>
          {t("thanks.back_home") || "Torna alla Home"}
        </Btn>
      </Card>
    </Wrapper>
  );
};

export default Thanks;

