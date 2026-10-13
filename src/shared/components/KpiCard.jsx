// src/shared/components/KpiCard.jsx
import React from "react";
import "./KpiCard.css";

/**
 * Tarjeta de indicador (KPI) interactiva.
 * - Hover: la tarjeta se eleva, el borde toma el color del indicador y el ícono se rellena.
 * - Si `value` es un número, se muestra con `formatValue` (ej: formatPrice); si es texto, tal cual.
 * - Si recibe `onClick`, se comporta como botón (teclado incluido) y muestra una flecha.
 *
 * @param {object} props
 * @param {string} props.icon - clase de FontAwesome, ej: "fa-clock"
 * @param {string} [props.iconColor] - color del indicador (usa un token, ej: "var(--primario)")
 * @param {string|number} props.value - número o texto
 * @param {(n: number) => string} [props.formatValue] - formato del número (ej: formatPrice)
 * @param {string} props.label
 * @param {{ text: string, positive: boolean }} [props.delta]
 * @param {() => void} [props.onClick]
 * @param {string} [props.hint] - texto del tooltip nativo al pasar el mouse
 */
export default function KpiCard({
  icon,
  iconColor = "var(--primario)",
  value,
  formatValue = (n) => Math.round(n).toLocaleString("es-CO"),
  label,
  delta,
  onClick,
  hint,
}) {
  const isNumber = typeof value === "number";
  const display = isNumber ? formatValue(value) : value;

  const interactive = typeof onClick === "function";
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`kpi-card ${interactive ? "is-clickable" : ""}`}
      style={{ "--kpi-accent": iconColor }}
      title={hint}
      {...(interactive && {
        role: "button",
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
      })}
    >
      <div className="kpi-icon">
        <i className={`fa-solid ${icon}`} />
      </div>

      <div className="kpi-content">
        <div className={`kpi-value ${isNumber ? "" : "is-text"}`} title={isNumber ? undefined : String(value)}>
          {display}
        </div>
        <div className="kpi-label">{label}</div>
        {delta && (
          <div className={`kpi-delta ${delta.positive ? "positive" : "negative"}`}>
            <i className={`fa-solid ${delta.positive ? "fa-arrow-up" : "fa-arrow-down"}`} aria-hidden="true" />
            {delta.text}
          </div>
        )}
      </div>

      {interactive && <i className="fa-solid fa-arrow-right-long kpi-go" aria-hidden="true" />}
    </div>
  );
}