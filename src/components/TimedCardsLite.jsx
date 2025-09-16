import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import "./timed-cards-lite.css";

const Root = styled.div`
  --primary: var(--yellow);
  --text: #ffffffdd;
  --bg: transparent;
`;

export default function TimedCardsLite({
  slides = [],
  autoPlay = true,
  intervalMs = 5000,
  className = "",
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0..100
  const raf = useRef(null);

  const total = slides.length;
  const isSingle = total === 1;
  const current = useMemo(() => slides[index] ?? {}, [slides, index]);

  const go = (dir) => {
    setIndex((i) => (i + dir + total) % total);
    setProgress(0);
  };

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(100, ((now - start) / intervalMs) * 100);
      setProgress(p);
      if (p >= 100) go(+1);
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, autoPlay, intervalMs, total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(+1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!total) return null;

  const overall = total > 0 ? ((index + progress / 100) / total) * 100 : 0;

  return (
    <Root className={`tc-root ${className}`}>
      {slides.map((s, i) => (
        <div
          key={i}
          className={`tc-card ${i === index ? "is-active" : "is-inactive"}`}
          style={{ backgroundImage: `url(${s.image})` }}
          aria-hidden={i !== index}
        />
      ))}

      <Details
        alt
        place={current.place}
        title1={current.title1}
        title2={current.title2}
        desc={current.desc}
        time={current.time}
        date={current.date}
        isMultiDay={current.isMultiDay}
        multiDayLabel={current.multiDayLabel}
        price={current.price}
        soldOut={current.soldOut}
        onDiscover={current.onDiscover}
      />
      <Details
        place={current.place}
        title1={current.title1}
        title2={current.title2}
        desc={current.desc}
        time={current.time}
        date={current.date}
        isMultiDay={current.isMultiDay}
        multiDayLabel={current.multiDayLabel}
        price={current.price}
        soldOut={current.soldOut}
        onDiscover={current.onDiscover}
      />

      <div className="tc-pagination">
        <button
          className="tc-arrow left"
          onClick={() => go(-1)}
          aria-label="Prev"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M15.75 19.5 8.25 12l7.5-7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          className="tc-arrow right"
          onClick={() => go(+1)}
          aria-label="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="tc-progress">
          <div className="tc-progress-bg">
            <div className="tc-progress-fg" style={{ width: `${overall}%` }} />
            <div className="tc-progress-marks" aria-hidden>
              {Array.from({ length: Math.max(total - 1, 0) }).map((_, i) => (
                <span
                  key={i}
                  className="tc-mark"
                  style={{ left: `${((i + 1) / total) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`tc-card-picker ${isSingle ? "is-single" : ""}`}>
        {slides.map((s, i) => (
          <button
            key={i}
            className={`tc-thumb ${i === index ? "is-active" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
            onClick={() => {
              setIndex(i);
              setProgress(0);
            }}
            aria-label={`Vai a ${s.title1 || ""} ${s.title2 || ""}`}
          >
            <div className="tc-thumb-overlay">
              <div className="bar" />
              <div className="t1">{s.place || s.title1}</div>
              <div className="t2">{s.title2 || s.title1}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="tc-cover" aria-hidden="true" />
    </Root>
  );
}

function Details({
  place,
  title1,
  title2,
  desc,
  time,
  date,
  isMultiDay = false,
  multiDayLabel = '',
  price,
  soldOut = false,
  onDiscover,
  alt = false,
}) {
  return (
    <div className={`tc-details ${alt ? "alt" : ""}`}>
      {place && (
        <div className="place-box">
          <div className="text">{place}</div>
        </div>
      )}
      <div className="title-box-1">
        <div className="title-1">{title1}</div>
      </div>
      {title2 && (
        <div className="title-box-2">
          <div className="title-2">{title2}</div>
        </div>
      )}
      {isMultiDay && !!multiDayLabel && (
        <div className="tc-badge" aria-label="multi-day">{multiDayLabel}</div>
      )}
      {desc && <div className="desc">{desc}</div>}
      {(time || price) && (
        <div className="tc-meta">
          {time && <div className="meta-item">{time}</div>}
          {date && <div className="meta-item">{date}</div>}
          {price && <div className="meta-item price">{price}</div>}
        </div>
      )}
      <div className="cta">
        <button
          className={`discover ${soldOut ? "soldout" : ""}`}
          onClick={soldOut ? undefined : onDiscover}
          disabled={soldOut}
        >
          {soldOut ? "Sold Out" : "Prenota ora"}
        </button>
      </div>
    </div>
  );
}
