
import { useEffect, useRef } from "react";

export default function useScrollReveal({
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
} = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return undefined;

    const items = container.querySelectorAll("[data-reveal]");

    if (!items.length) return undefined;

    // Comprobar si el usuario prefiere reducir las animaciones
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Mostrar todos los elementos si no se admiten animaciones
    // o si IntersectionObserver no está disponible.
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => {
        item.classList.add("is-revealed");
      });

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-revealed");

          // Dejar de observar el elemento una vez revelado
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    items.forEach((item) => {
      // Evitar observar elementos que ya fueron revelados
      if (!item.classList.contains("is-revealed")) {
        observer.observe(item);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return containerRef;
}
