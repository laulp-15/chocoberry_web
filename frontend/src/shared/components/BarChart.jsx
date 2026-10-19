// src/shared/components/BarChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./BarChart.css";

const compact = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/** Escala "bonita": devuelve el paso y el máximo redondeado para el eje Y. */
function niceScale(max, intervals = 4) {
  const rawStep = Math.max(max, 1) / intervals;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const factor = [1, 1.5, 2, 2.5, 3, 4, 5, 10].find((f) => norm <= f);
  const step = factor * mag;
  return { step, niceMax: step * intervals, intervals };
}

/**
 * Gráfica de barras sin librerías externas.
 * - Hover o foco en una columna: tooltip con el valor.
 * - Clic (o Enter/Espacio): fija la selección; otro clic la quita.
 * - Eje Y con líneas guía y el total del periodo en el encabezado.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {{ label: string, value: number }[]} props.data
 * @param {(value: number) => string} [props.formatValue] - tooltip y resumen (ej: formatPrice)
 * @param {(value: number) => string} [props.formatTick] - marcas del eje Y (por defecto, formato compacto)
 * @param {string} [props.unit] - texto tras el valor en el tooltip (ej: "ventas")
 */
export default function BarChart({
  title,
  subtitle,
  data,
  formatValue = (v) => v,
  formatTick = (v) => compact.format(v),
  unit = "",
}) {
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [ready, setReady] = useState(false);

  // Las barras crecen una sola vez al montar.
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 30);
    return () => clearTimeout(id);
  }, []);

  const { total, maxIndex, scale, ticks } = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const sc = niceScale(maxValue);
    return {
      total: sum,
      maxIndex: data.findIndex((d) => d.value === maxValue),
      scale: sc,
      ticks: Array.from({ length: sc.intervals + 1 }, (_, i) => i * sc.step),
    };
  }, [data]);

  const active = hovered ?? pinned;
  const pct = (v) => (v / scale.niceMax) * 100;

  return (
    <div className="bc-card">
      <div className="bc-header">
        <div className="bc-heading">
          {title && <h3 className="bc-title">{title}</h3>}
          {subtitle && <p className="bc-subtitle">{subtitle}</p>}
        </div>
        <div className="bc-stats">
          <div className="bc-stat">
            <span className="bc-stat-value">{formatValue(total)}</span>
            <span className="bc-stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="bc-chart">
        <div className="bc-yaxis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="bc-ytick" style={{ bottom: `${pct(t)}%` }}>
              {formatTick(t)}
            </span>
          ))}
        </div>

        <div className="bc-plot" onMouseLeave={() => setHovered(null)}>
          <div className="bc-grid" aria-hidden="true">
            {ticks.map((t) => (
              <div key={t} className="bc-gridline" style={{ bottom: `${pct(t)}%` }} />
            ))}
          </div>

          <div className="bc-cols">
            {data.map((d, i) => {
              const isActive = active === i;
              const isHighlight = active === null ? i === maxIndex : isActive;
              const tipClass = i === 0 ? "tip-start" : i === data.length - 1 ? "tip-end" : "";

              return (
                <button
                  key={d.label}
                  type="button"
                  className={`bc-col ${isActive ? "is-active" : ""}`}
                  aria-pressed={pinned === i}
                  aria-label={`${d.label}: ${formatValue(d.value)} ${unit}`.trim()}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  onClick={() => setPinned((p) => (p === i ? null : i))}
                >
                  <span className="bc-track">
                    <span
                      className={`bc-bar ${isHighlight ? "highlight" : ""}`}
                      style={{ height: ready ? `${pct(d.value)}%` : "0%" }}
                    >
                      <span className={`bc-tip ${tipClass} ${isActive ? "visible" : ""}`} role="tooltip">
                        <span className="bc-tip-label">{d.label}</span>
                        <span className="bc-tip-value">
                          {formatValue(d.value)} {unit}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="bc-label">{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}