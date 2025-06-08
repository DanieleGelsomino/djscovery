import React, { useState } from 'react';
import styled from 'styled-components';
import { saveBooking } from '../firebase/functions';

const Wrapper = styled.section`
  padding: 2rem 0;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  margin: 0 auto;
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nome, cognome, email, telefono } = formData;
    if (!nome || !cognome || !email || !telefono) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    if (!validateEmail(email)) {
      setError('Email non valida');
      return;
    }
    setError('');
    try {
      await saveBooking(formData);
      setSuccess(true);
      setFormData({ nome: '', cognome: '', email: '', telefono: '' });
    } catch (err) {
      setError('Errore durante il salvataggio');
    }
  };

  return (
    <Wrapper>
      <div className="container">
        <h2>Prenota il tuo biglietto</h2>
        <Form onSubmit={handleSubmit} noValidate>
          <Input
            name="nome"
            placeholder="Nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
          <Input
            name="cognome"
            placeholder="Cognome"
            value={formData.cognome}
            onChange={handleChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            name="telefono"
            placeholder="Telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
          <Button type="submit">Prenota</Button>
        </Form>
        {error && <p>{error}</p>}
        {success && <p>Prenotazione avvenuta con successo!</p>}
      </div>
    </Wrapper>
  );
};

export default TicketBookingForm;
