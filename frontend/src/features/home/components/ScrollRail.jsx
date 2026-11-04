// src/features/home/components/ScrollRail.jsx
//
// Fila horizontal con scroll suave, imanes (scroll-snap) y flechas. Sirve para
// el carrusel de productos y el de pasos. Cada hijo directo es una "tarjeta";
// su ancho lo define el CSS del contenedor que lo usa (--rail-per-view).

import { useEffect, useRef, useState } from "react";
import "./ScrollRail.css";

export default function ScrollRail({ children, className = "", label }) {
  const trackRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = {
      start: track.scrollLeft <= 2,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    };
    setEdge((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  };

  // Recalcula las flechas cuando cambia el tamaño de la fila o de sus tarjetas
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    Array.from(track.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);

  const scrollByPage = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const noOverflow = edge.start && edge.end;

  return (
    <div className={`rail ${className}`.trim()}>
      <button
        type="button"
        className="rail__arrow rail__arrow--prev"
        onClick={() => scrollByPage(-1)}
        disabled={edge.start}
        hidden={noOverflow}
        aria-label="Ver anteriores"
      >
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>

      <div
        className="rail__track"
        ref={trackRef}
        onScroll={measure}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>

      <button
        type="button"
        className="rail__arrow rail__arrow--next"
        onClick={() => scrollByPage(1)}
        disabled={edge.end}
        hidden={noOverflow}
        aria-label="Ver siguientes"
      >
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
