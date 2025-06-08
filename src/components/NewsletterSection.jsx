import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Section = styled.section`
  padding: 3rem 0;
  background: linear-gradient(180deg, var(--green), #013a14);
  color: var(--white);
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 1rem auto 0;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const Input = styled(motion.input)`
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
`;

const Button = styled(motion.button)`
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  background: var(--yellow);
  color: var(--black);
  font-weight: bold;
`;

const NewsletterSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Section>
      <div className="container">
        <h2>Newsletter</h2>
        <p>Iscriviti per rimanere aggiornato sui nostri eventi</p>
        <Form onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" required whileFocus={{ scale: 1.02 }} />
          <Button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Iscriviti
          </Button>
        </Form>
        {submitted && <p>Grazie per la tua iscrizione!</p>}
      </div>
    </Section>
  );
};

export default NewsletterSection;
