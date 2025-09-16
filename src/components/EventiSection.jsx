import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../api";
import Spinner from "./Spinner";
import ComingSoon from "./ComingSoon";
import TimedCardsLite from "./TimedCardsLite";
import heroFallback from "../assets/img/hero.png";
import { formatDMY, formatHM, formatDateRange } from "../lib/date";
import useAutoTranslate from "../lib/useAutoTranslate";

function Translated({ text, from = 'it', to = 'en' }) {
  const out = useAutoTranslate(text || '', from, to);
  return out;
}

const EventiSection = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const { data: eventsRaw, isLoading } = useQuery({
    queryKey: ["events", { status: "published" }],
    queryFn: () => fetchEvents({ status: "published" }),
  });

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  if (isLoading) return <Spinner aria-label={t("events.loading")} />;
  if (!events.length) return <ComingSoon />;

  const slides = events.map((e) => {
    // i18n-aware fields with fallback
    const tx = (e.i18n && e.i18n[lang]) || (e.translations && e.translations[lang]) || {};
    const title1 = tx.name || e.name || "Evento";
    const dj = tx.dj || e.dj || "";
    const place = tx.place || e.place || "";
    const descBase = (tx.description || e.description || (place ? `${place}` : "")).trim();

    // Dates: support start/end range
    const startDate = e.startDate || e.date || "";
    const endDate = e.endDate || e.startDate || e.date || "";
    const isRange = startDate && endDate && String(startDate) !== String(endDate);
    const dateFmt = isRange
      ? formatDateRange(startDate, endDate, lang)
      : formatDMY(startDate);
    const timeFmt = formatHM(e.time);
    const title2 = dj || (dateFmt ? `${dateFmt}${timeFmt ? ` · ${timeFmt}` : ""}` : "");
    const image = e.image || heroFallback;
    const time = timeFmt;
    const date = dateFmt;
    const price = e.soldOut ? "" : (e.price ? `${e.price}€` : (t('events.free') || 'Gratis'));
    // Auto-translate description if no localized version is provided
    const desc = tx.description || (lang === 'it' ? descBase : (
      <Translated text={descBase} from="it" to={lang || 'it'} />
    ));

    return {
      place,
      title1,
      title2,
      desc,
      time,
      date,
      isMultiDay: !!isRange,
      multiDayLabel: (lang === 'en' ? 'Multi-day' : 'Più giorni'),
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
