import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

const Section = styled(motion.section)`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  @media (min-width: 768px) {
    width: 60%;
    margin: 1rem auto 0;
    grid-template-columns: repeat(2, 1fr);
  }

  textarea,
  button {
    grid-column: span 2;
  }
`;

const Input = styled(motion.input)`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray);
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
`;

const TextArea = styled(motion.textarea)`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray);
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
  resize: none;
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  border-radius: 4px;
  font-weight: bold;
`;

const ContattiSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Section>
      <div className="container">
        <h2>{t("contacts.title")}</h2>
        <p>{t("contacts.subtitle")}</p>
        <Form
          as={motion.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Input
            whileFocus={{ scale: 1.02 }}
            type="text"
            placeholder={t("contacts.name")}
            required
          />
          <Input
            whileFocus={{ scale: 1.02 }}
            type="email"
            placeholder={t("contacts.email")}
            required
          />
          <TextArea
            whileFocus={{ scale: 1.02 }}
            placeholder={t("contacts.message")}
            rows="5"
            required
          />
          <Button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("contacts.send")}
          </Button>
        </Form>
        {submitted && <p>{t("contacts.sent")}</p>}
      </div>
    </Section>
  );
};

export default ContattiSection;
