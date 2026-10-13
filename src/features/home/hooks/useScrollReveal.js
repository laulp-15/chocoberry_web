// src/shared/hooks/useScrollReveal.js
import { useEffect, useRef } from "react";

export default function useScrollReveal({ threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const items = container.querySelectorAll("[data-reveal]");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      items.forEach((item) => item.classList.add("is-revealed"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return containerRef;
}