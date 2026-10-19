// src/shared/components/DonutChart.jsx
import React, { useMemo, useState } from "react";
import "./DonutChart.css";

// Paleta pensada para el proyecto: carmesí + chocolate + acentos de estado.
// Evitamos tonos rosa muy claros (se pierden sobre el fondo de la tarjeta).
const DEFAULT_COLORS = [
  "var(--primario)",
  "var(--chocolate-80, #7A3245)",
  "var(--primario-claro)",
  "var(--warning-100, #F49505)",
  "var(--info-100, #1D77ED)",
  "var(--success-100, #249434)",
  "var(--chocolate-60, #B98A97)",
];

const CX = 100;
const CY = 100;
const OUTER = 84;
const INNER_DONUT = 56;
const HOVER_SHIFT = 6;

function polar(r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

/** Sector (de dona si innerR > 0, de torta si innerR = 0). */
function sectorPath(startDeg, endDeg, outerR, innerR) {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const [x1, y1] = polar(outerR, startDeg);
  const [x2, y2] = polar(outerR, endDeg);

  if (innerR <= 0) {
    return `M ${CX} ${CY} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} Z`;
  }
  const [x3, y3] = polar(innerR, endDeg);
  const [x4, y4] = polar(innerR, startDeg);
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
}

/**
 * Gráfica de dona o torta, SVG puro, interactiva.
 * - Hover/foco en un sector o en la leyenda: el sector se separa, los demás se atenúan
 *   y (en dona) el centro muestra el detalle.
 * - Leyenda con valor y barra de proporción.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {{ label: string, value: number, color?: string }[]} props.data
 * @param {"donut" | "pie"} [props.variant]
 * @param {string} [props.unit] - texto bajo el total del centro (ej: "pedidos")
 * @param {string|number} [props.centerValue] - reemplaza el total del centro (ej: promedio "4.5")
 * @param {string} [props.centerCaption] - reemplaza la unidad del centro
 * @param {(value: number) => string} [props.formatValue]
 */
export default function DonutChart({
  title,
  subtitle,
  data,
  variant = "donut",
  unit = "",
  centerValue,
  centerCaption,
  formatValue = (v) => v,
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const isDonut = variant === "donut";
  const innerR = isDonut ? INNER_DONUT : 0;

  const { segments, total } = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + d.value, 0);
    let angle = -90;
    const segs = data.map((d, i) => {
      const pct = sum ? (d.value / sum) * 100 : 0;
      // Tope en 359.99° para que un único sector al 100% siga dibujándose.
      const sweep = Math.min((pct / 100) * 360, 359.99);
      const start = angle;
      const end = angle + sweep;
      angle += (pct / 100) * 360;
      const mid = ((start + end) / 2) * (Math.PI / 180);
      return {
        ...d,
        pct,
        color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        path: sweep > 0 ? sectorPath(start, end, OUTER, innerR) : null,
        shiftX: Math.cos(mid) * HOVER_SHIFT,
        shiftY: Math.sin(mid) * HOVER_SHIFT,
        labelPos: polar(OUTER * 0.64, (start + end) / 2),
      };
    });
    return { segments: segs, total: sum };
  }, [data, innerR]);

  const active = activeIndex !== null ? segments[activeIndex] : null;
  const hasData = total > 0;

  const centerMain = active ? formatValue(active.value) : centerValue ?? formatValue(total);
  const centerSub = active ? active.label : centerCaption ?? unit;

  return (
    <div className="dc-card">
      {(title || subtitle) && (
        <div className="dc-header">
          {title && <h3 className="dc-title">{title}</h3>}
          {subtitle && <p className="dc-subtitle">{subtitle}</p>}
        </div>
      )}

      {!hasData ? (
        <div className="dc-empty">Aún no hay datos para mostrar.</div>
      ) : (
        <>
          <div className="dc-chart" onMouseLeave={() => setActiveIndex(null)}>
            <svg viewBox="0 0 200 200" className="dc-svg" role="img" aria-label={title}>
              {segments.map(
                (seg, i) =>
                  seg.path && (
                    <g
                      key={seg.label}
                      className="dc-segment"
                      tabIndex={0}
                      role="button"
                      aria-label={`${seg.label}: ${seg.value}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onFocus={() => setActiveIndex(i)}
                      onBlur={() => setActiveIndex(null)}
                      style={{
                        opacity: activeIndex === null || activeIndex === i ? 1 : 0.4,
                        transform:
                          activeIndex === i ? `translate(${seg.shiftX}px, ${seg.shiftY}px)` : "none",
                      }}
                    >
                      <path d={seg.path} fill={seg.color} className="dc-path" />
                      {!isDonut && seg.pct >= 8 && (
                        <text
                          x={seg.labelPos[0]}
                          y={seg.labelPos[1]}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="dc-slice-label"
                        >
                          {formatValue(seg.value)}
                        </text>
                      )}
                    </g>
                  )
              )}
            </svg>

            {isDonut && (
              <div className="dc-center">
                <span className="dc-center-value">{centerMain}</span>
                {centerSub && <span className="dc-center-caption">{centerSub}</span>}
              </div>
            )}
          </div>

          {/* En torta no hay centro, así que el detalle va en una línea bajo la gráfica */}
          {!isDonut && (
            <div className="dc-readout" aria-live="polite">
              {active ? (
                <>
                  <strong>{active.label}</strong>: {formatValue(active.value)}
                </>
              ) : (
                <>
                  Total: <strong>{formatValue(total)}</strong> {unit}
                </>
              )}
            </div>
          )}

          <ul className="dc-legend">
            {segments.map((seg, i) => (
              <li
                key={seg.label}
                className={`dc-legend-item ${activeIndex === i ? "is-active" : ""}`}
                style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.55 }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span className="dc-legend-dot" style={{ background: seg.color }} />
                <span className="dc-legend-label" title={seg.label}>
                  {seg.label}
                </span>
                <span className="dc-legend-value">{formatValue(seg.value)}</span>
                <span className="dc-legend-bar">
                  <span
                    className="dc-legend-bar-fill"
                    style={{ width: `${seg.pct}%`, background: seg.color }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}