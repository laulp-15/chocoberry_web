// src/features/admin/capacity/components/CapacityLegend.jsx
import "./CapacityLegend.css";

const ITEMS = [
  { clave: "libre", etiqueta: "Con cupo" },
  { clave: "parcial", etiqueta: "Cupo parcial" },
  { clave: "lleno", etiqueta: "Sin cupo" },
  { clave: "bloqueado", etiqueta: "Bloqueado" },
  { clave: "excepcion", etiqueta: "Tope especial" },
];

export default function CapacityLegend() {
  return (
    <div className="capacity-legend" aria-label="Leyenda de capacidad">
      {ITEMS.map(({ clave, etiqueta }) => (
        <span key={clave} className="capacity-legend-item">
          <i className={`capacity-legend-dot capacity-legend-dot--${clave}`} />
          {etiqueta}
        </span>
      ))}
    </div>
  );
}