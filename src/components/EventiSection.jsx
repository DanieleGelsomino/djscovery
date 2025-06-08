import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaEuroSign } from 'react-icons/fa';

const eventi = [
  {
    id: 1,
    date: '2024-07-01',
    place: 'Roma',
    time: '21:00',
    price: 25,
    image: 'https://source.unsplash.com/400x300/?concert',
    description: "Serata di apertura dell'estate con DJ Alpha.",
  },
  {
    id: 2,
    date: '2024-08-15',
    place: 'Milano',
    time: '22:00',
    price: 30,
    image: 'https://source.unsplash.com/400x300/?party',
    description: 'Ferragosto in musica con i migliori DJ italiani.',
  },
  {
    id: 3,
    date: '2024-09-10',
    place: 'Napoli',
    time: '20:00',
    price: 20,
    image: 'https://source.unsplash.com/400x300/?dj',
    description: 'Chiusura della stagione estiva sul lungomare.',
  },
];

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
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  return (
  <Section>
    <div className="container">
      <h2>Prossimi Eventi</h2>
      <p>Scopri e prenota le nostre serate speciali in tutta Italia.</p>
      <Cards>
        {eventi.map(event => (
          <Card
            key={event.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--green)' }}
          >
            <img src={event.image} alt={event.place} />
            <CardContent>
              <h3><FaMapMarkerAlt /> {event.place}</h3>
              <p><FaCalendarAlt /> {event.date}</p>
              <p><FaClock /> {event.time}</p>
              <p>{event.description}</p>
              <p><FaEuroSign /> {event.price}</p>
            </CardContent>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addItem({ id: event.id, name: `Biglietto ${event.place}`, price: event.price });
                navigate('/prenota');
                setMessage('Aggiunto al carrello!');
                setTimeout(() => setMessage(''), 2000);
              }}
            >
              Prenota ora
            </Button>
          </Card>
        ))}
      </Cards>
      {message && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--green)', marginTop: '1rem' }}>{message}</motion.p>}
    </div>
  </Section>
  );
};

export default EventiSection;
