import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../api";
import ComingSoon from "./ComingSoon";
import TimedCardsLite from "./TimedCardsLite";
import heroFallback from "../assets/img/hero.png";
import { toDateLike, formatDMY, formatHM, formatDateRange } from "../lib/date";
import useAutoTranslate from "../lib/useAutoTranslate";

function Translated({ text, from = 'it', to = 'en' }) {
  const out = useAutoTranslate(text || '', from, to);
  return out;
}

const DRIVE_DEFAULT_WIDTH = 1920;
const DRIVE_RETINA_WIDTH = 3200;

function adjustDriveSizedUrl(url = '', targetWidth) {
  if (!url || typeof url !== "string" || !Number.isFinite(targetWidth)) {
    return { url, changed: false };
  }
  if (!/googleusercontent\.com/.test(url)) {
    return { url, changed: false };
  }

  const match = url.match(/=w(\d+)([^?]*)/i);
  if (!match) return { url, changed: false };

  const originalChunk = match[0];
  const originalWidth = parseInt(match[1], 10);
  if (!Number.isFinite(originalWidth) || originalWidth >= targetWidth) {
    return { url, changed: false };
  }

  const suffix = match[2] || "";
  let updatedSuffix = suffix;
  const heightMatch = suffix.match(/-h(\d+)/i);
  if (heightMatch) {
    const originalHeight = parseInt(heightMatch[1], 10);
    if (Number.isFinite(originalHeight) && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      const newHeight = Math.round(targetWidth * ratio);
      updatedSuffix = suffix.replace(/-h\d+/i, `-h${newHeight}`);
    }
  }

  const replacement = `=w${targetWidth}${updatedSuffix}`;
  return { url: url.replace(originalChunk, replacement), changed: true };
}

function getImageVariants(src) {
  if (!src) {
    return { image: heroFallback, imageSet: null };
  }

  if (typeof src !== "string") {
    return { image: src, imageSet: null };
  }

  if (!/googleusercontent\.com/.test(src)) {
    return { image: src, imageSet: null };
  }

  const { url: firstCandidate } = adjustDriveSizedUrl(src, DRIVE_DEFAULT_WIDTH);
  const baseImage = firstCandidate || src;

  const { url: retinaCandidate, changed: retinaChanged } = adjustDriveSizedUrl(src, DRIVE_RETINA_WIDTH);
  const retinaImage = retinaChanged ? retinaCandidate : baseImage;

  const parts = [`url("${baseImage}") 1x`];
  if (retinaImage && retinaImage !== baseImage) {
    parts.push(`url("${retinaImage}") 2x`);
  }

  return {
    image: baseImage,
    imageSet: parts.length > 1 ? `image-set(${parts.join(", ")})` : null,
  };
}

const EventiSection = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const { data: eventsRaw, isLoading } = useQuery({
    queryKey: ["events", { status: "published" }],
    queryFn: () => fetchEvents({ status: "published" }),
  });

  const events = Array.isArray(eventsRaw) ? eventsRaw : [];
  if (isLoading) return null;
  if (!events.length) return <ComingSoon />;

  const toTime = (value) => {
    const d = toDateLike(value);
    return d ? d.getTime() : null;
  };

  const getRawStart = (ev) => (ev?.startDate ?? ev?.date ?? "");

  const hasStartDate = (ev) => {
    const raw = getRawStart(ev);
    if (raw === null || raw === undefined) return false;
    if (typeof raw === "string") return raw.trim() !== "";
    return true;
  };

  const isUpcomingEvent = (ev) => !!(ev && ev.upcoming) || !hasStartDate(ev);

  const getStartTime = (ev) => toTime(getRawStart(ev));

  const getCreationTime = (ev) => {
    if (!ev) return null;
    const candidates = [ev.createdAt, ev.created, ev._createdAt, ev.updatedAt];
    for (const candidate of candidates) {
      const t = toTime(candidate);
      if (t != null) return t;
    }
    return null;
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aUpcoming = isUpcomingEvent(a);
    const bUpcoming = isUpcomingEvent(b);
    if (aUpcoming !== bUpcoming) return aUpcoming ? 1 : -1;

    const aStart = getStartTime(a);
    const bStart = getStartTime(b);

    if (!aUpcoming) {
      if (aStart != null && bStart != null && aStart !== bStart) {
        return aStart - bStart;
      }
      if (aStart != null && bStart == null) return -1;
      if (aStart == null && bStart != null) return 1;
    }

    const aCreated = getCreationTime(a);
    const bCreated = getCreationTime(b);
    if (aCreated != null || bCreated != null) {
      if (aCreated == null) return 1;
      if (bCreated == null) return -1;
      if (aCreated !== bCreated) return bCreated - aCreated;
    }

    const aName = String(a?.name || "").toLowerCase();
    const bName = String(b?.name || "").toLowerCase();
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });

  const slides = sortedEvents.map((e) => {
    // i18n-aware fields with fallback
    const tx = (e.i18n && e.i18n[lang]) || (e.translations && e.translations[lang]) || {};
    const title1 = tx.name || e.name || "Evento";
    const dj = tx.dj || e.dj || "";
    const place = tx.place || e.place || "";
    const descBase = (tx.description || e.description || (place ? `${place}` : "")).trim();

    // Dates: support start/end range
    const rawStartDate = e.startDate ?? e.date ?? "";
    const rawEndDate = e.endDate ?? e.startDate ?? e.date ?? "";
    const hasStartDate = !(
      rawStartDate === null ||
      rawStartDate === undefined ||
      (typeof rawStartDate === "string" && rawStartDate.trim() === "")
    );
    const hasEndDate = !(
      rawEndDate === null ||
      rawEndDate === undefined ||
      (typeof rawEndDate === "string" && rawEndDate.trim() === "")
    );
    const startDate = hasStartDate ? rawStartDate : "";
    const endDate = hasEndDate ? rawEndDate : "";
    const isUpcoming = !!e.upcoming || !hasStartDate;
    const isRange = hasStartDate && hasEndDate && String(startDate) !== String(endDate);
    const dateFmt = isRange
      ? formatDateRange(startDate, endDate, lang)
      : formatDMY(startDate);
    const timeFmt = isUpcoming ? "" : formatHM(e.time);
    const dateDisplay = isUpcoming
      ? t("events.upcoming") || "In arrivo"
      : dateFmt;
    const title2 =
      dj ||
      (dateDisplay
        ? `${dateDisplay}${timeFmt ? ` · ${timeFmt}` : ""}`
        : "");
    const { image, imageSet } = getImageVariants(e.image || heroFallback);
    const time = timeFmt;
    const date = isUpcoming ? "" : dateDisplay;
    const price = isUpcoming
      ? ""
      : e.soldOut
        ? ""
        : e.price
          ? `${e.price}€`
          : t('events.free') || 'Gratis';
    // Auto-translate description if no localized version is provided
    const desc = tx.description || (lang === 'it' ? descBase : (
      <Translated text={descBase} from="it" to={lang || 'it'} />
    ));

    const isSoldOut = !!e.soldOut;
    const ctaLabel = isUpcoming
      ? t('events.upcoming') || 'In arrivo'
      : isSoldOut
        ? t('events.sold_out') || 'Sold out'
        : t('events.book_now') || 'Prenota ora';
    const ctaDisabled = isUpcoming || isSoldOut;

    return {
      place,
      title1,
      title2,
      desc,
      time,
      date,
      isMultiDay: !isUpcoming && !!isRange,
      multiDayLabel: lang === 'en' ? 'Multi-day' : 'Più giorni',
      price,
      soldOut: isSoldOut,
      upcoming: isUpcoming,
      ctaLabel,
      ctaDisabled,
      image,
      imageSet,
      onDiscover: ctaDisabled ? undefined : () => navigate(`/prenota?event=${e.id}`),
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
