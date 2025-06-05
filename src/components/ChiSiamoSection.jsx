import React from 'react';
import styles from './ChiSiamoSection.module.css';

const ChiSiamoSection = () => {
  return (
    <section className={styles.about}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.text}>
            <h2>Chi Siamo</h2>
            <p>
              Siamo un team di appassionati di musica e viaggi che organizza eventi
              unici in location indimenticabili. La nostra missione è far scoprire
              nuovi luoghi attraverso il ritmo della musica.
            </p>
          </div>
          <div className={styles.imageWrapper}>
            <img src="https://source.unsplash.com/600x400/?dj" alt="Chi siamo" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChiSiamoSection;
