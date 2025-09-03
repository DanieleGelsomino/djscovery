import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    width: 100%;
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
    width: 100%;
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

    &[type="number"]::-webkit-outer-spin-button,
    &[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    &[type="number"] {
        -moz-appearance: textfield;
    }
`;

const Button = styled.button`
    width: 100%;
    padding: 0.75rem;
    background-color: var(--red);
    color: var(--white);
    border: none;
    border-radius: 4px;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.05);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const FieldWrapper = styled.div`
  display: flex;
  flex-direction: column;

  &.full {
    grid-column: span 2;
  }

  label {
    text-align: left;
    font-size: 0.9rem;
    color: #bbb;
    margin-bottom: 0.35rem;
  }

  small {
    color: #f66;
    margin-top: 0.25rem;
  }
`;

const TicketBookingForm = () => {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('event');

    const [formData, setFormData] = useState({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        quantita: 1, // nuovo
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();
    const { showToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'quantita') {
            const n = parseInt(value, 10);
            setFormData((prev) => ({ ...prev, quantita: Number.isNaN(n) ? '' : n }));
            return;
        }
        if (name === 'telefono') {
            const digits = value.replace(/\D/g, '');
            setFormData({ ...formData, [name]: digits });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const validate = () => {
        const { nome, cognome, email, telefono, quantita } = formData;
        const errs = {};
        if (!nome) errs.nome = t('booking.required_field') || 'Campo obbligatorio';
        if (!cognome) errs.cognome = t('booking.required_field') || 'Campo obbligatorio';
        if (!email) errs.email = t('booking.required_field') || 'Campo obbligatorio';
        if (email && !validateEmail(email)) errs.email = t('booking.invalid_email') || 'Email non valida';
        if (!telefono) errs.telefono = t('booking.required_field') || 'Campo obbligatorio';
        if (telefono && !/^\d+$/.test(telefono)) errs.telefono = t('booking.invalid_phone') || 'Numero non valido';
        const q = Number(quantita);
        if (!q || q < 1) errs.quantita = t('booking.invalid_quantity') || 'Minimo 1 biglietto';
        if (q > 20) errs.quantita = t('booking.max_quantity') || 'Max 20 a prenotazione';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            showToast(t('booking.required') || 'Compila correttamente i campi', 'error');
            return;
        }
        setLoading(true);
        try {
            // mappiamo quantita -> quantity (il backend accetta entrambi, ma preferiamo essere espliciti)
            await sendBooking({ ...formData, eventId, quantity: formData.quantita });
            showToast(t('booking.success') || 'Prenotazione inviata! Controlla la tua email.', 'success');
            setFormData({ nome: '', cognome: '', email: '', telefono: '', quantita: 1 });
            setErrors({});
        } catch {
            showToast(t('booking.error') || 'Errore durante la prenotazione', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Wrapper>
            <div className="container">
                <h2>{t('booking.title')}</h2>
                <Form onSubmit={handleSubmit} noValidate>
                    <FieldWrapper>
                        <label htmlFor="nome">{t('booking.name') || 'Nome'}</label>
                        <Input
                            id="nome"
                            name="nome"
                            placeholder={t('booking.name')}
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            aria-invalid={!!errors.nome}
                        />
                        {errors.nome && <small>{errors.nome}</small>}
                    </FieldWrapper>

                    <FieldWrapper>
                        <label htmlFor="cognome">{t('booking.surname') || 'Cognome'}</label>
                        <Input
                            id="cognome"
                            name="cognome"
                            placeholder={t('booking.surname')}
                            value={formData.cognome}
                            onChange={handleChange}
                            required
                            aria-invalid={!!errors.cognome}
                        />
                        {errors.cognome && <small>{errors.cognome}</small>}
                    </FieldWrapper>

                    <FieldWrapper>
                        <label htmlFor="email">Email</label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            placeholder={t('booking.email')}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && <small>{errors.email}</small>}
                    </FieldWrapper>

                    <FieldWrapper>
                        <label htmlFor="telefono">{t('booking.phone') || 'Telefono'}</label>
                        <Input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            placeholder={t('booking.phone')}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                            aria-invalid={!!errors.telefono}
                        />
                        {errors.telefono && <small>{errors.telefono}</small>}
                    </FieldWrapper>

                    <FieldWrapper className="full">
                        <label htmlFor="quantita">{t('booking.quantity') || 'Quantità biglietti'}</label>
                        <Input
                            type="number"
                            id="quantita"
                            name="quantita"
                            min={1}
                            max={20}
                            inputMode="numeric"
                            placeholder={t('booking.quantity_placeholder') || 'Es. 1'}
                            value={formData.quantita}
                            onChange={handleChange}
                            required
                            aria-invalid={!!errors.quantita}
                        />
                        {errors.quantita && <small>{errors.quantita}</small>}
                    </FieldWrapper>

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
