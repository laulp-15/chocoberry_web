// src/shared/components/GooeyNav.jsx
//
// Menú horizontal con indicador "gooey": una pastilla que se desliza entre
// opciones y suelta partículas que se funden con ella (filtro SVG). Sin
// dependencias externas. Colores desde tokens.css, así que sigue el tema
// claro/oscuro solo; `theme` permite forzarlo.
//
// Uso:
//   <GooeyNav
//     items={[{ label: "Inicio", href: "/" }]}
//     activeIndex={0}                 // controlado (opcional)
//     onChange={(index, item) => ...} // se llama al elegir una opción
//   />

import { useId, useLayoutEffect, useRef, useState } from "react";
import "./GooeyNav.css";

const SIZES = ["sm", "md", "lg"];

// Crea las partículas y las anima con la Web Animations API; cada una se
// elimina sola al terminar. Vive fuera del componente: es puro DOM, no estado.
function spawnParticles(layer, el, { particleCount, spread, animationTime, timeVariance }) {
  if (!layer || !el || !layer.animate) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const cx = el.offsetLeft + el.offsetWidth / 2;
  const cy = el.offsetHeight / 2;

  for (let i = 0; i < particleCount; i += 1) {
    const dot = document.createElement("span");
    dot.className = "gn-particle";
    const dotSize = 4 + Math.random() * 7;
    dot.style.width = `${dotSize}px`;
    dot.style.height = `${dotSize}px`;
    dot.style.left = `${cx - dotSize / 2}px`;
    dot.style.top = `${cy - dotSize / 2}px`;
    layer.appendChild(dot);

    const angle = Math.random() * Math.PI * 2;
    const distance = spread * (0.35 + Math.random() * 0.65);
    const dx = Math.cos(angle) * distance * 1.4; // un poco más ancho que alto
    const dy = Math.sin(angle) * distance * 0.7;
    const duration = Math.max(200, animationTime + (Math.random() - 0.5) * 2 * timeVariance);

    dot
      .animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0.6 },
        ],
        { duration, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)", fill: "forwards" }
      )
      .finished.then(() => dot.remove())
      .catch(() => dot.remove());
  }
}

export default function GooeyNav({
  items,
  activeIndex,
  initialActiveIndex = 0,
  onChange,
  theme = "auto", // "auto" | "light" | "dark"
  size = "md",
  frame = false,
  particleCount = 15,
  spread = 56,
  animationTime = 600,
  timeVariance = 300,
  gooeyness = 0.5,
  wobble = 0.5,
  hoverEffect = true,
  className = "",
  ariaLabel = "Navegación principal",
}) {
  const filterId = `gn-goo-${useId().replace(/:/g, "")}`;
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const blobRef = useRef(null);
  const particlesRef = useRef(null);
  const placedRef = useRef(false);

  const [innerActive, setInnerActive] = useState(initialActiveIndex);
  const current = activeIndex !== undefined ? activeIndex : innerActive;

  // Mueve la pastilla bajo la opción activa y la ajusta si cambia el tamaño.
  useLayoutEffect(() => {
    const list = listRef.current;
    const blob = blobRef.current;
    if (!list || !blob) return undefined;

    const place = (animate) => {
      const el = itemRefs.current[current];
      if (!el) {
        blob.style.opacity = "0";
        return;
      }
      blob.style.opacity = "1";
      blob.style.transition = animate ? "" : "none";
      blob.style.width = `${el.offsetWidth}px`;
      blob.style.transform = `translateX(${el.offsetLeft}px)`;

      // Pequeño "aplastamiento" vertical al viajar, controlado por `wobble`.
      if (animate && wobble > 0 && blob.animate) {
        blob.animate(
          [
            { scale: "1 1" },
            { scale: `1.04 ${1 - wobble * 0.3}`, offset: 0.4 },
            { scale: "1 1" },
          ],
          { duration: animationTime, easing: "ease-in-out" }
        );
      }
    };

    place(placedRef.current);
    placedRef.current = true;

    const observer = new ResizeObserver(() => place(false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [current, items, wobble, animationTime]);

  // Ráfaga de partículas alrededor de la opción elegida.
  const burst = (index) =>
    spawnParticles(particlesRef.current, itemRefs.current[index], {
      particleCount, spread, animationTime, timeVariance,
    });

  const handleSelect = (event, index) => {
    // Ctrl/Cmd/clic central: dejar que el navegador abra el enlace normal.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;

    if (onChange) event.preventDefault();
    if (index === current) return;

    if (activeIndex === undefined) setInnerActive(index);
    burst(index);
    onChange?.(index, items[index]);
  };

  // gooeyness (0–1) controla cuánto se funden la pastilla y las partículas.
  const blur = 3 + gooeyness * 6;
  const contrast = 10 + gooeyness * 16;

  const classes = [
    "gn",
    `gn--${SIZES.includes(size) ? size : "md"}`,
    frame ? "gn--frame" : "",
    hoverEffect ? "gn--hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav
      className={classes}
      aria-label={ariaLabel}
      data-theme-force={theme === "auto" ? undefined : theme}
    >
      <svg className="gn-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-30%" y="-200%" width="160%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${contrast} ${-contrast * 0.39}`}
            />
          </filter>
        </defs>
      </svg>

      <ul className="gn-list" ref={listRef}>
        {/* Capa con el filtro: solo la pastilla y las partículas, nunca el texto */}
        <li className="gn-goo" aria-hidden="true" style={{ filter: `url(#${filterId})` }}>
          <span
            className="gn-blob"
            ref={blobRef}
            style={{
              transitionDuration: `${animationTime}ms`,
              transitionTimingFunction: `cubic-bezier(0.34, ${1 + wobble * 0.9}, 0.5, 1)`,
            }}
          />
          <span className="gn-particles" ref={particlesRef} />
        </li>

        {items.map((item, index) => (
          <li
            key={item.href ?? item.label}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className={`gn-item${index === current ? " is-active" : ""}`}
          >
            <a
              href={item.href ?? "#"}
              className="gn-link"
              aria-current={index === current ? "page" : undefined}
              onClick={(event) => handleSelect(event, index)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
