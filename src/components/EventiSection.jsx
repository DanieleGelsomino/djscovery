import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../api";
import Spinner from "./Spinner";
import ComingSoon from "./ComingSoon";
import TimedCardsLite from "./TimedCardsLite";
import heroFallback from "../assets/img/hero.png";
import { formatDMY, formatHM } from "../lib/date";

const EventiSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: eventsRaw, isLoading } = useQuery({
    queryKey: ["events", { status: "published" }],
    queryFn: () => fetchEvents({ status: "published" }),
  });

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  if (isLoading) return <Spinner aria-label={t("events.loading")} />;
  if (!events.length) return <ComingSoon />;

  const slides = events.map((e) => {
    const title1 = e.name || "Evento";
    const dateFmt = formatDMY(e.date);
    const timeFmt = formatHM(e.time);
    const title2 = e.dj || (dateFmt ? `${dateFmt}${timeFmt ? ` · ${timeFmt}` : ""}` : "");
    const desc = e.description || (e.place ? `${e.place}` : "");
    const place = e.place || "";
    const image = e.image || heroFallback;
    const time = e.time || "";
    const date = dateFmt;
    const price = e.soldOut ? "" : (e.price ? `${e.price}€` : (t('events.free') || 'Gratis'));
    return {
      place,
      title1,
      title2,
      desc,
      time,
      date,
      price,
      soldOut: !!e.soldOut,
      image,
      onDiscover: () => navigate(`/prenota?event=${e.id}`),
    };
  });

  return (
    <TimedCardsLite
      slides={slides}
      autoPlay={true}
      intervalMs={6000}
      className="events-timed-cards"
    />
  );
};

export default EventiSection;
