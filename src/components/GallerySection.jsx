import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import img1 from '../assets/img/Copia di Testo del paragraf.png';
import img2 from '../assets/img/Copia di Testo del paragrafo.png';
import img3 from '../assets/img/DJSCOVERY LOGO.png';
import img4 from '../assets/img/LOGO PRINCIPALE.png';
import img5 from '../assets/img/Testo del paragrafo_HQ.png';
import img6 from '../assets/img/Testo del paragrafo_HQ2.png';
import img7 from '../assets/img/hero.png';
import img8 from '../assets/img/logo-dj.png';

const Section = styled.section`
  padding: 2rem 0;
  background-color: #222;
  text-align: center;
`;

const StyledSwiper = styled(Swiper)`
  margin-top: 1rem;

  .swiper-slide {
    display: flex;
    justify-content: center;
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
  }
`;

const images = [
  'https://source.unsplash.com/400x300/?music',
  'https://source.unsplash.com/400x300/?party',
  'https://source.unsplash.com/400x300/?dj',
  'https://source.unsplash.com/400x300/?concert',
  'https://source.unsplash.com/400x300/?club',
  'https://source.unsplash.com/400x300/?festival',
  img1,
  img2,
  img3,
  img4,
  img5,
  img6,
  img7,
  img8
];

const GallerySection = () => (
  <Section>
    <div className="container">
      <h2>Gallery</h2>
      <StyledSwiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        spaceBetween={10}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 }
        }}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx}>
            <motion.img src={img} alt="gallery" whileHover={{ scale: 1.05 }} />
          </SwiperSlide>
        ))}
      </StyledSwiper>
    </div>
  </Section>
);

export default GallerySection;
