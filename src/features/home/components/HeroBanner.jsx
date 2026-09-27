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

  // Cambio automático cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + bannerImages.length) % bannerImages.length);
  };

  return (
    <div className="full-width-carousel">
      <div className="carousel-inner">
        <img
          src={bannerImages[currentIndex].url}
          alt={bannerImages[currentIndex].alt}
          className="carousel-img"
        />

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