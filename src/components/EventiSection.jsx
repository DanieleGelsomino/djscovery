import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { fetchEvents } from "../api";
import heroImg from "../assets/img/hero.png";
import Spinner from "./Spinner";
import {
  Card as MuiCard,
  CardContent,
  CardMedia,
  Button as MuiButton,
  Typography,
} from "@mui/material";

const Section = styled.section`
  text-align: center;
  background-color: #f7f7f7;
  color: var(--black);
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-bottom: 2rem;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MotionCard = motion(MuiCard);
const MotionButton = motion(MuiButton);

const EventiSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section>
      <div className="container">
        <h2>{t("events.title")}</h2>
        <p>{t("events.subtitle")}</p>
        {loading && <Spinner aria-label={t("events.loading")} />}
        {!loading && events.length === 0 && <p>{t("events.none")}</p>}
        <Cards>
          {events.map((event) => (
            <MotionCard
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              sx={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                color: "var(--black)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                textAlign: "left",
                width: "100%",
                margin: 0,
                display: "flex",
                flexDirection: "column",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  position: "relative",
                  height: "220px",
                  backgroundImage: `url(${event.image || heroImg})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {event.soldOut && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0,0,0,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {t("events.sold_out")}
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    padding: "1rem",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    color: "#fff",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {event.name}
                  </Typography>
                  <Typography variant="body2">{event.dj}</Typography>
                  <Typography variant="body2">
                    {event.place} • {event.time}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mt: 1 }}
                  >
                    {event.date}
                  </Typography>
                </div>
              </CardMedia>

              <CardContent sx={{ flex: "1 1 auto", padding: "1rem" }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 2, color: "text.secondary" }}
                  >
                    {event.description}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {event.place} - {event.time} | € {event.price}
                  </Typography>
                </CardContent>

              {!event.soldOut && (
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/prenota")}
                  sx={{
                    backgroundColor: "var(--black)",
                    color: "white",
                    borderRadius: "20px",
                    alignSelf: "start",
                    margin: "0 1rem 1rem",
                    padding: "0.5rem 1.5rem",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {t("events.book_now")}
                </MotionButton>
              )}
            </MotionCard>
          ))}
        </Cards>
      </div>
    </Section>
  );
};

export default EventiSection;
