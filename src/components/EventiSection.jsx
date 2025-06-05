import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const eventi = [
  { id: 1, date: '2024-07-01', place: 'Rome', time: '21:00' },
  { id: 2, date: '2024-08-15', place: 'Milan', time: '22:00' },
  { id: 3, date: '2024-09-10', place: 'Naples', time: '20:00' },
];

const Section = styled.section`
  padding: 2rem 0;
  text-align: center;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled(motion.div)`
  background-color: #111;
  padding: 1rem;
  border-radius: 4px;

  h3 {
    color: var(--yellow);
  }
`;

const Button = styled.button`
  margin-top: 1rem;
  background-color: var(--red);
  color: var(--white);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
`;

const EventiSection = () => (
  <Section>
    <div className="container">
      <h2>Prossimi Eventi</h2>
      <Cards>
        {eventi.map(event => (
          <Card key={event.id} whileHover={{ scale: 1.05, boxShadow: '0 0 8px var(--green)' }}>
            <h3>{event.place}</h3>
            <p>{event.date}</p>
            <p>{event.time}</p>
            <Button>Prenota ora</Button>
          </Card>
        ))}
      </Cards>
    </div>
  </Section>
);

export default EventiSection;
