import React, { useState } from 'react';
import styled from 'styled-components';
import { saveBooking } from '../firebase/functions';
import { useLanguage } from './LanguageContext';

const Wrapper = styled.section`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nome, cognome, email, telefono } = formData;
    if (!nome || !cognome || !email || !telefono) {
      setError(t('booking.required'));
      return;
    }
    if (!validateEmail(email)) {
      setError(t('booking.invalid_email'));
      return;
    }
    setError('');
    try {
      await saveBooking(formData);
      setSuccess(true);
      setFormData({ nome: '', cognome: '', email: '', telefono: '' });
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(t('booking.error'));
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
          <Button type="submit">{t('booking.book')}</Button>
        </Form>
        {error && <p>{error}</p>}
        {success && <p>{t('booking.success')}</p>}
      </div>
    </Wrapper>
  );
};

export default TicketBookingForm;
