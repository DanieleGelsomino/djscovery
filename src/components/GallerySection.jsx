import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import img1 from "../assets/img/Copia di Testo del paragraf.png";
import img2 from "../assets/img/Copia di Testo del paragrafo.png";
import img3 from "../assets/img/DJSCOVERY LOGO.png";
import img4 from "../assets/img/LOGO PRINCIPALE.png";
import img5 from "../assets/img/Testo del paragrafo_HQ.png";
import img6 from "../assets/img/Testo del paragrafo_HQ2.png";
import img7 from "../assets/img/hero.png";
import img8 from "../assets/img/logo-dj.png";

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

  .swiper-button-next,
  .swiper-button-prev {
    color: var(--yellow);
  }
`;

const SlideContent = styled(motion.div)`
  overflow: hidden;
  border-radius: 6px;

  img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    transition: transform 0.4s;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const images = [img1, img2, img3, img4, img5, img6, img7, img8];

const GallerySection = () => (
  <Section>
    <div className="container">
      <h2>Gallery</h2>
      <StyledSwiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 2500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        spaceBetween={10}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {images.map((img, idx) => (
          <SwiperSlide key={idx}>
            <SlideContent whileHover={{ scale: 1.02 }}>
              <img src={img} alt="gallery" />
            </SlideContent>
          </SwiperSlide>
        ))}
      </StyledSwiper>
    </div>
  </Section>
);

export default GallerySection;
