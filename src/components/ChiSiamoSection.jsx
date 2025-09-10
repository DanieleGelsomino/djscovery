import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

const Section = styled(motion.section)`
  padding: 2rem 0;
  color: var(--white);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Text = styled(motion.div)`
  max-width: 500px;
`;

const ImageWrapper = styled(motion.div)`
  img {
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
`;

const ChiSiamoSection = () => {
  const { t } = useLanguage();
  return (
    <Section>
      <div className="container">
        <Content>
          <Text
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2>{t("about.title")}</h2>
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </Text>
          <ImageWrapper
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <img src="/src/assets/img/gallery-1.png" alt="Chi siamo" />
          </ImageWrapper>
        </Content>
      </div>
    </Section>
  );
};

export default ChiSiamoSection;
