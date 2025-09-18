import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import aboutUsImg from "../assets/img/about_us.jpeg";

const Section = styled(motion.section)`
  position: relative;
  display: flex;
  align-items: center;
  padding: clamp(4rem, 10vw, 6rem) 0;
  min-height: clamp(520px, 70vh, 760px);
  overflow: hidden;
  color: var(--white);
  background: url(${aboutUsImg}) center / cover no-repeat;

  &:before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(8, 8, 10, 0.85) 0%,
      rgba(8, 8, 10, 0.55) 45%,
      rgba(8, 8, 10, 0.9) 100%
    );
  }
  @media (max-width: 768px) {
    min-height: 70vh;
  }
`;

const Content = styled(motion.div)`
  position: relative;
  z-index: 1;
  max-width: min(860px, 100%);
  margin: 0 auto;
  text-align: center;

  h2 {
    margin-bottom: clamp(1.4rem, 3vw, 2rem);
    font-size: clamp(2rem, 5vw, 3.2rem);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    text-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
  }

  p {
    margin-bottom: clamp(1rem, 2.2vw, 1.6rem);
    font-size: clamp(1rem, 2.1vw, 1.25rem);
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
  }
`;

const ChiSiamoSection = () => {
  const { t } = useLanguage();
  return (
    <Section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.45 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="container">
        <Content
          initial={{ y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.55 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2>{t("about.title")}</h2>
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
        </Content>
      </div>
    </Section>
  );
};

export default ChiSiamoSection;
