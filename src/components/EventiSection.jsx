import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const eventi = [
  {
    id: 1,
    date: '2024-07-01',
    place: 'Rome',
    time: '21:00',
    price: 25,
    image: 'https://source.unsplash.com/400x300/?concert',
  },
  {
    id: 2,
    date: '2024-08-15',
    place: 'Milan',
    time: '22:00',
    price: 30,
    image: 'https://source.unsplash.com/400x300/?party',
  },
  {
    id: 3,
    date: '2024-09-10',
    place: 'Naples',
    time: '20:00',
    price: 20,
    image: 'https://source.unsplash.com/400x300/?dj',
  },
];

const Section = styled.section`
  padding: 2rem 0;
  text-align: center;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const Card = styled(motion.div)`
  background-color: #111;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;

  h3 {
    color: var(--yellow);
  }
`;

const Button = styled(motion.button)`
  margin-top: 1rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

const EventiSection = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  return (
  <Section>
    <div className="container">
      <h2>Prossimi Eventi</h2>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
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
            <h3><FaMapMarkerAlt /> {event.place}</h3>
            <p><FaCalendarAlt /> {event.date}</p>
            <p><FaClock /> {event.time}</p>
            <Button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addItem({ id: event.id, name: `Biglietto ${event.place}`, price: event.price });
                navigate('/prenota');
              }}
            >
              Prenota ora
            </Button>
          </Card>
        ))}
      </Cards>
    </div>
  </Section>
  );
};

export default EventiSection;
