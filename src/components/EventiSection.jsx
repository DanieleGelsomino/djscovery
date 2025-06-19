import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEuroSign, FaUser } from 'react-icons/fa';
import { fetchEvents } from '../api';
import heroImg from '../assets/img/hero.png';
import Spinner from './Spinner';


const Section = styled.section`
  text-align: center;
  background: linear-gradient(180deg, #111, #000);
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  padding-bottom: 2rem;
`;

const Card = styled(motion.div)`
  background-color: #111;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--gray);
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  text-align: left;

  img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }

  h3 {
    color: var(--yellow);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  p {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin: 0.25rem 0;
  }
`;

const CardContent = styled.div`
  flex: 1;
`;

const Button = styled(motion.button)`
  margin-top: 1rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  align-self: flex-start;
`;

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
          <Card
            key={event.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--green)' }}
          >
            <img src={event.image || heroImg} alt={event.place} />
            <CardContent>
              <h3>{event.name}</h3>
              <p><FaUser /> {event.dj}</p>
              <p><FaMapMarkerAlt /> {event.place}</p>
              <p><FaCalendarAlt /> {event.date}</p>
              <p><FaClock /> {event.time}</p>
              <p>{event.description}</p>
              <p><FaEuroSign /> {event.price}</p>
            </CardContent>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigate('/prenota');
              }}
            >
              {t('events.book_now')}
            </Button>
          </Card>
        ))}
      </Cards>
    </div>
  </Section>
  );
};

export default EventiSection;
