import React from 'react';
import styles from './ContattiSection.module.css';

const ContattiSection = () => {
  return (
    <section className={styles.contact}>
      <div className="container">
        <h2>Contattaci</h2>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Nome" required />
          <input type="email" placeholder="Email" required />
          <textarea placeholder="Messaggio" rows="5" required></textarea>
          <button type="submit">Invia</button>
        </form>
      </div>
    </section>
  );
};

export default ContattiSection;
