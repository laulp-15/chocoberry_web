
import { useCallback, useLayoutEffect, useRef } from "react";
import "./CategoryStrip.css";

export default function CategoryStrip({
  categories = [],
  activeCategory,
  onChange,
}) {
  const scrollRef = useRef(null);
  const innerRef = useRef(null);
  const itemRefs = useRef(new Map());
  const barRef = useRef(null);
  const hasPositionedRef = useRef(false);

  // Guarda las referencias de cada botón.
  const setItemRef = useCallback((value, node) => {
    if (node) {
      itemRefs.current.set(value, node);
    } else {
      itemRefs.current.delete(value);
    }
  }, []);

  // Posiciona la línea debajo de la categoría activa.
  const updateBar = useCallback((animate = true) => {
    const inner = innerRef.current;
    const bar = barRef.current;
    const activeItem = itemRefs.current.get(activeCategory);

    if (!inner || !bar) return;

    if (!activeItem) {
      bar.style.opacity = "0";
      return;
    }

    const innerRect = inner.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    const left = itemRect.left - innerRect.left;

    bar.style.width = `${itemRect.width}px`;
    bar.style.transform = `translateX(${left}px)`;
    bar.style.opacity = "1";

    // Evita animaciones al posicionar inicialmente o redimensionar.
    bar.style.transition =
      animate && hasPositionedRef.current
        ? ""
        : "none";

    hasPositionedRef.current = true;
  }, [activeCategory]);

  // Actualiza la línea cuando cambia la categoría o el tamaño.
  useLayoutEffect(() => {
    updateBar(false);

    const inner = innerRef.current;
    const activeItem = itemRefs.current.get(activeCategory);

    if (!inner) return undefined;

    let observer;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateBar(false);
      });

      observer.observe(inner);

      if (activeItem) {
        observer.observe(activeItem);
      }
    }

    window.addEventListener("resize", updateBar);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateBar);
    };
  }, [activeCategory, categories, updateBar]);

  // Centra la categoría seleccionada dentro del desplazamiento horizontal.
  const selectCategory = useCallback((value) => {
    if (value === activeCategory) return;

    onChange?.(value);

    const container = scrollRef.current;
    const item = itemRefs.current.get(value);

    if (!container || !item) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const target =
      item.offsetLeft -
      (container.clientWidth - item.offsetWidth) / 2;

    container.scrollTo({
      left: Math.max(0, target),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeCategory, onChange]);

  return (
    <nav
      className="cat-strip"
      aria-label="Categorías de productos"
    >
      <div
        className="cat-strip__scroll"
        ref={scrollRef}
      >
        <div
          className="cat-strip__inner"
          ref={innerRef}
        >
          {categories.map((cat) => {
            const isActive = cat.value === activeCategory;

            return (
              <button
                key={cat.value}
                ref={(node) => setItemRef(cat.value, node)}
                type="button"
                className={`cat-strip__item ${
                  isActive ? "is-active" : ""
                }`}
                aria-pressed={isActive}
                onClick={() => selectCategory(cat.value)}
              >
                {cat.label}
              </button>
            );
          })}

          <span
            className="cat-strip__bar"
            ref={barRef}
            aria-hidden="true"
          />
        </div>
      </div>
    </nav>
  );
}
