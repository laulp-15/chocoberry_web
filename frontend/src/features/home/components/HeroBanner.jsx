// src/features/home/components/HeroBanner.jsx
import React, { useState, useEffect } from "react";
import "./Home.css";

const bannerImages = [
  {
    id: 1,
    url: "/img/carrusel/imagen1.png",
    alt: "Fresas cubiertas de chocolate Chocoberry",
  },
  {
    id: 2,
    url: "/img/carrusel/imagen2.png",
    alt: "Arreglos florales y detalles dulces",
  },
  {
    id: 3,
    url: "/img/carrusel/imagen3.png",
    alt: "Regalos sorpresa para ocasiones especiales",
  },
  {
    id: 4,
    url: "/img/carrusel/imagen4.png",
    alt: "Regalos sorpresa para ocasiones especiales",
  },
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Cambio automático cada 5 segundos. Se reinicia al navegar a mano
  // y se detiene mientras el mouse está sobre el banner.
  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, paused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  return (
    <div className="full-width-carousel">
      <div
        className="carousel-inner"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Todas las imágenes se apilan; solo la activa es visible */}
        {bannerImages.map((img, index) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt}
            className={`carousel-img ${index === currentIndex ? "active" : ""}`}
            aria-hidden={index !== currentIndex}
          />
        ))}

        {/* Botón Anterior */}
        <button className="carousel-nav-btn btn-left" onClick={handlePrev} aria-label="Anterior">
          <i className="fa-solid fa-chevron-left" />
        </button>

        {/* Botón Siguiente */}
        <button className="carousel-nav-btn btn-right" onClick={handleNext} aria-label="Siguiente">
          <i className="fa-solid fa-chevron-right" />
        </button>

        {/* Puntos Indicadores */}
        <div className="carousel-dots">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              className={`dot ${currentIndex === index ? "active" : ""}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}