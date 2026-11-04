
import { useState, useEffect, useCallback } from "react";
import "./Home.css";

const bannerImages = [
  {
    id: 1,
    url: "/img/carrusel/img(1).jpeg",
    alt: "I",
  },
  {
    id: 2,
    url: "/img/carrusel/img(2).jpeg",
    alt: "s",
  },
  {
    id: 3,
    url: "/img/carrusel/img(3).jpeg",
    alt: "s",
  },
  {
    id: 4,
    url: "/img/carrusel/img(4).jpeg",
    alt: "m",
  },
];

const AUTOPLAY_DELAY = 5000;

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const totalImages = bannerImages.length;

  // Navegación del carrusel
  const goToSlide = useCallback((index) => {
    setCurrentIndex((index + totalImages) % totalImages);
  }, [totalImages]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  // Reproducción automática
  useEffect(() => {
    if (paused || totalImages <= 1) return;

    const timer = setTimeout(handleNext, AUTOPLAY_DELAY);

    return () => clearTimeout(timer);
  }, [currentIndex, paused, handleNext, totalImages]);

  // Desplazamiento al catálogo
  const goToCatalog = () => {
    const catalog = document.getElementById("catalogo");

    if (!catalog) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    catalog.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <section
      className="full-width-carousel"
      aria-label="Banner principal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="carousel-inner">

        {/* Imágenes del carrusel */}
        {bannerImages.map((img, index) => {
          const isActive = index === currentIndex;

          return (
            <img
              key={img.id}
              src={img.url}
              alt={img.alt}
              className={`carousel-img ${isActive ? "active" : ""}`}
              aria-hidden={!isActive}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              draggable="false"
            />
          );
        })}

        {/* Navegación anterior */}
        <button
          type="button"
          className="carousel-nav-btn btn-left"
          onClick={handlePrev}
          aria-label="Imagen anterior"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>

        {/* Navegación siguiente */}
        <button
          type="button"
          className="carousel-nav-btn btn-right"
          onClick={handleNext}
          aria-label="Imagen siguiente"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>

        {/* Acceso al catálogo */}
        <button
          type="button"
          className="carousel-cta"
          onClick={goToCatalog}
        >
          Ver catálogo
          <i
            className="fa-solid fa-arrow-down"
            aria-hidden="true"
          />
        </button>

        {/* Indicadores */}
        <div className="carousel-dots" aria-label="Seleccionar imagen">
          {bannerImages.map((img, index) => (
            <button
              key={img.id}
              type="button"
              className={`dot ${currentIndex === index ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={currentIndex === index ? "true" : undefined}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
