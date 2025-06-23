import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';
import { FaPaperPlane } from 'react-icons/fa';
import { useToast } from './ToastContext';
import heroImg from '../assets/img/hero.png';

const Section = styled.section`
  position: relative;
  padding: 3rem 0;
  color: var(--white);
  text-align: center;
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url(${heroImg});
  background-size: cover;
  background-position: center;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const NewsletterSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    showToast(t('newsletter.success'), 'success');
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <Section>
      <div className="container">
        <h2>{t('newsletter.title')}</h2>
        <p>{t('newsletter.subtitle')}</p>
        <Form onSubmit={handleSubmit}>
          <Input type="email" placeholder={t('newsletter.email')} required whileFocus={{ scale: 1.02 }} />
          <Button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t('newsletter.subscribe')} <FaPaperPlane />
          </Button>
        </Form>
        {/* success handled via toast */}
      </div>
    </Section>
  );
};

export default NewsletterSection;
