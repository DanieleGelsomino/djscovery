import React from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
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
  background-color: #222;
  padding: 2rem 0;
  text-align: center;
`;

const SlideImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
`;

const images = [img1, img2, img3, img4, img5, img6, img7, img8];

const HomeGallerySlider = () => (
  <Section>
    <div className="container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop
        style={{ borderRadius: "8px" }}
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <SlideImage src={src} alt="gallery item" loading="lazy" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </Section>
);

export default HomeGallerySlider;
