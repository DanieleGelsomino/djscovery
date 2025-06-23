import React, { useState } from 'react';
import styled from 'styled-components';
import { sendBooking } from '../api';
import { useLanguage } from './LanguageContext';
import Spinner from './Spinner';
import { useToast } from './ToastContext';

const Wrapper = styled.section`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  button {
    grid-column: span 2;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #111;
  color: var(--white);
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--yellow);
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  border-radius: 4px;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const TicketBookingForm = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
  });
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { showToast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nome, cognome, email, telefono } = formData;
    if (!nome || !cognome || !email || !telefono) {
      showToast(t('booking.required'), 'error');
      return;
    }
    if (!validateEmail(email)) {
      showToast(t('booking.invalid_email'), 'error');
      return;
    }
    setLoading(true);
    try {
      await sendBooking(formData);
      showToast(t('booking.success'), 'success');
      setFormData({ nome: '', cognome: '', email: '', telefono: '' });
    } catch (err) {
      showToast(t('booking.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <div className="container">
        <h2>{t('booking.title')}</h2>
        <Form onSubmit={handleSubmit} noValidate>
          <Input
            name="nome"
            placeholder={t('booking.name')}
            value={formData.nome}
            onChange={handleChange}
            required
          />
          <Input
            name="cognome"
            placeholder={t('booking.surname')}
            value={formData.cognome}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder={t('booking.email')}
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            name="telefono"
            placeholder={t('booking.phone')}
            value={formData.telefono}
            onChange={handleChange}
            required
          />
          <Button type="submit" disabled={loading}>
            {t('booking.book')}
          </Button>
          {loading && <Spinner />}
        </Form>
      </div>
    </Wrapper>
  );
};

export default TicketBookingForm;
