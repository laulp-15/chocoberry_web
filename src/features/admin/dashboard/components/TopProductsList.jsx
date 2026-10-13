// src/features/admin/dashboard/components/TopProductsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./TopProductsList.css";

/**
 * Ranking de productos más vendidos, interactivo.
 * - Hover o foco en una fila: resalta esa fila y atenúa las demás.
 * - Clic: despliega el detalle (unidades vendidas y distancia al primer lugar).
 *
 * @param {object} props
 * @param {{ name: string, sold: number }[]} props.products
 * @param {(product: { name: string, sold: number }) => void} [props.onSelect] - se llama al abrir un producto
 */
export default function TopProductsList({ products, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(id);
  }, []);

  const { total, maxSold, ranked } = useMemo(() => {
    const sum = products.reduce((acc, p) => acc + p.sold, 0);
    const maxValue = Math.max(...products.map((p) => p.sold), 1);
    const sorted = [...products]
      .sort((a, b) => b.sold - a.sold);
    return { total: sum, maxSold: maxValue, ranked: sorted };
  }, [products]);

  const handleToggle = (name) => {
    const opening = selected !== name;
    setSelected(opening ? name : null);
    if (opening && onSelect) onSelect(ranked.find((p) => p.name === name));
  };

  return (
    <div className="tp-card">
      <div className="tp-header">
        <div>
          <h3 className="tp-title">Productos más vendidos</h3>
          <p className="tp-subtitle">{total} unidades en total</p>
        </div>
      </div>

      <ul className="tp-list">
        {ranked.map((p, i) => {
          const isOpen = selected === p.name;
          const dimmed = hovered !== null && hovered !== p.name;
          const gap = ranked[0].sold - p.sold;

          return (
            <li
              key={p.name}
              className={`tp-item ${hovered === p.name ? "is-hover" : ""} ${isOpen ? "is-open" : ""}`}
              style={{ opacity: dimmed ? 0.55 : 1 }}
              onMouseEnter={() => setHovered(p.name)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                type="button"
                className="tp-row"
                aria-expanded={isOpen}
                onClick={() => handleToggle(p.name)}
                onFocus={() => setHovered(p.name)}
                onBlur={() => setHovered(null)}
              >
                <span className={`tp-rank ${i === 0 ? "first" : ""}`}>{i + 1}</span>

                <span className="tp-info">
                  <span className="tp-line">
                    <span className="tp-name" title={p.name}>
                      {p.name}
                    </span>
                    <span className="tp-value">{p.sold}</span>
                  </span>
                  <span className="tp-bar">
                    <span
                      className="tp-bar-fill"
                      style={{ width: ready ? `${(p.sold / maxSold) * 100}%` : "0%" }}
                    />
                  </span>
                </span>

                <i className={`fa-solid fa-chevron-down tp-chevron ${isOpen ? "open" : ""}`} aria-hidden="true" />
              </button>

              {isOpen && (
                <div className="tp-detail">
                  <span>
                    <strong>{p.sold}</strong> unidades vendidas
                  </span>
                  <span>{i === 0 ? "Primer lugar" : `A ${gap} unidades del primer lugar`}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}