import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import heroImg from "../assets/img/hero.png";

const Wrapper = styled.section`
  position: relative;
  min-height: 70vh;
  display: grid;
  place-items: center;
  color: var(--white);
  overflow: hidden;
  background-image: url(${heroImg});
  background-size: cover;
  background-position: center;
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%),
              linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6));
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 3rem 1rem;
`;

const Title = styled(motion.h1)`
  font-family: Oswald, Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: clamp(42px, 8vw, 88px);
  line-height: 1.05;
  letter-spacing: 1px;
  margin: 0 0 0.5rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.35);
`;

const Subtitle = styled(motion.p)`
  font-size: clamp(16px, 2.2vw, 22px);
  opacity: 0.95;
  margin: 0 0 1.25rem;
`;

const Accent = styled.span`
  color: var(--yellow);
`;

const CTA = styled(motion.a)`
  display: inline-block;
  margin-top: 0.75rem;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 800;
  text-decoration: none;
  color: var(--black);
  background: var(--yellow);
  box-shadow: 0 10px 26px rgba(0,0,0,0.35);
`;

const ComingSoon = () => {
  const waUrl =
    import.meta.env.VITE_WHATSAPP_COMMUNITY_URL ||
    "https://chat.whatsapp.com/your-community";

  return (
    <Wrapper>
      <Overlay />
      <Content className="container">
        <Title
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Coming <Accent>Soon</Accent>
        </Title>
        <Subtitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          stiamo lavorando per voi stay tuned
        </Subtitle>
        <CTA
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Unisciti alla community
        </CTA>
      </Content>
    </Wrapper>
  );
};

export default ComingSoon;
