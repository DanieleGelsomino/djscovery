import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

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
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
`;

const ChiSiamoSection = () => (
  <Section>
    <div className="container">
      <Content>
        <Text initial={{ x: -50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}>
          <h2>Chi Siamo</h2>
          <p>
            Siamo un team di appassionati di musica e viaggi che organizza eventi unici in location indimenticabili. La nostra missione è far scoprire nuovi luoghi attraverso il ritmo della musica.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </Text>
        <ImageWrapper initial={{ x: 50, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}>
          <img src="https://source.unsplash.com/600x400/?dj" alt="Chi siamo" />
        </ImageWrapper>
      </Content>
    </div>
  </Section>
);

export default ChiSiamoSection;
