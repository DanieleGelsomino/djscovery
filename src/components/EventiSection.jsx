import React from 'react';
import styles from './EventiSection.module.css';

const eventi = [
  { id: 1, date: '2024-07-01', place: 'Rome', time: '21:00' },
  { id: 2, date: '2024-08-15', place: 'Milan', time: '22:00' },
  { id: 3, date: '2024-09-10', place: 'Naples', time: '20:00' },
];

const EventiSection = () => {
  return (
    <section className={styles.events}>
      <div className="container">
        <h2>Prossimi Eventi</h2>
        <div className={styles.cards}>
          {eventi.map(event => (
            <div key={event.id} className={styles.card}>
              <h3>{event.place}</h3>
              <p>{event.date}</p>
              <p>{event.time}</p>
              <button className={styles.btn}>Prenota ora</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventiSection;
