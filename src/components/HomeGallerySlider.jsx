import React from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import img1 from "../assets/img/gallery-1.png";
import img2 from "../assets/img/gallery-2.png";
import img3 from "../assets/img/djscovery-logo.png";
import img4 from "../assets/img/logo-principale.png";
import img5 from "../assets/img/gallery-3.png";
import img6 from "../assets/img/gallery-4.png";
import img7 from "../assets/img/hero.png";
import img8 from "../assets/img/logo-dj.png";
import Container from "./Container";

const Section = styled.section`
  background-color: #222;
  padding: 2rem 0;
  text-align: center;
`;

const SlideImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;

  @media (min-width: 768px) {
    height: 220px;
  }

  @media (min-width: 1024px) {
    height: 250px;
  }
`;

const images = [img1, img2, img3, img4, img5, img6, img7, img8];

const HomeGallerySlider = () => (
  <Section>
    <Container>
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000 }}
        loop
        slidesPerView={1}
        spaceBetween={10}
        breakpoints={{
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        style={{ borderRadius: "8px" }}
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <SlideImage src={src} alt="gallery item" loading="lazy" />
          </SwiperSlide>
        ))}
      </Swiper>
    </Container>
  </Section>
);

export default HomeGallerySlider;
