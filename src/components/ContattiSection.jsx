import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Section = styled(motion.section)`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  @media (min-width: 768px) {
    width: 60%;
    margin: 1rem auto 0;
  }
`;

const Input = styled(motion.input)`
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
`;

const TextArea = styled(motion.textarea)`
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
`;

const Button = styled(motion.button)`
  padding: 0.75rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  border-radius: 4px;
  font-weight: bold;
`;

const ContattiSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Section>
      <div className="container">
        <h2>Contattaci</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <Form as={motion.form} onSubmit={handleSubmit} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <Input whileFocus={{ scale:1.02 }} type="text" placeholder="Nome" required />
          <Input whileFocus={{ scale:1.02 }} type="email" placeholder="Email" required />
          <TextArea whileFocus={{ scale:1.02 }} placeholder="Messaggio" rows="5" required />
          <Button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Invia</Button>
        </Form>
        {submitted && <p>Messaggio inviato!</p>}
      </div>
    </Section>
  );
};

export default ContattiSection;
