import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEuroSign, FaUser } from 'react-icons/fa';
import { fetchEvents } from '../api';
import heroImg from '../assets/img/hero.png';
import Spinner from './Spinner';
import {
  Card as MuiCard,
  CardContent,
  CardMedia,
  Button as MuiButton,
  Typography,
} from '@mui/material';


const Section = styled.section`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-bottom: 2rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  @media (min-width: 992px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;

const MotionCard = motion(MuiCard);
const MotionButton = motion(MuiButton);

const EventiSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
  <Section>
    <div className="container">
      <h2>{t('events.title')}</h2>
      <p>{t('events.subtitle')}</p>
      {loading && <Spinner aria-label={t('events.loading')} />}
      {!loading && events.length === 0 && <p>{t('events.none')}</p>}
      <Cards>
        {events.map(event => (
          <MotionCard
            key={event.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
            sx={{
              backgroundColor: '#111',
              border: '1px solid var(--gray)',
              color: 'var(--white)',
              textAlign: 'left',
              maxWidth: 380,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image={event.image || heroImg}
              alt={event.place}
            />
            <CardContent sx={{ flex: '1 1 auto', padding: '1rem' }}>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  color: 'var(--yellow)',
                  mb: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                {event.name}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', m: '0.25rem 0' }}>
                <FaUser /> {event.dj}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', m: '0.25rem 0' }}>
                <FaMapMarkerAlt /> {event.place}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', m: '0.25rem 0' }}>
                <FaCalendarAlt /> {event.date}
              </Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', m: '0.25rem 0' }}>
                <FaClock /> {event.time}
              </Typography>
              <Typography sx={{ m: '0.25rem 0' }}>{event.description}</Typography>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem', m: '0.25rem 0' }}>
                <FaEuroSign /> {event.price}
              </Typography>
            </CardContent>
            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigate('/prenota');
              }}
              sx={{
                backgroundColor: 'var(--red)',
                color: 'var(--white)',
                borderRadius: 0,
                padding: '0.75rem 1rem',
                fontWeight: 600,
                mt: 'auto',
              }}
            >
              {t('events.book_now')}
            </MotionButton>
          </MotionCard>
        ))}
      </Cards>
    </div>
  </Section>
  );
};

export default EventiSection;
