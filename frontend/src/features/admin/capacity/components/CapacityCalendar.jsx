// src/features/admin/capacity/components/CapacityCalendar.jsx
import {
  DIAS_SEMANA,
  construirGrillaMes,
  formatearFechaLarga,
  hoyISO,
  obtenerEstadoDia,
  porcentajeOcupacion,
} from "../utils/capacityUtils";
import "./CapacityCalendar.css";

// Texto corto que se ve dentro de la celda (solo si aporta información).
function textoCelda(dia, estado) {
  if (!dia) return "Cargando...";
  if (estado.clave === "bloqueado") return "Sin pedidos";
  if (dia.fresasAgendadas > dia.tope) {
    return `+${dia.fresasAgendadas - dia.tope} sobre el tope`;
  }
  if (dia.disponible <= 0) return "Sin cupo";
  if (dia.fresasAgendadas === 0) return ""; // día libre: sin ruido visual
  return `Quedan ${dia.disponible}`;
}

export default function CapacityCalendar({
  mes,
  dias = [],
  selectedFecha,
  loading = false,
  onSelect,
}) {
  const mapaDias = new Map(dias.map((dia) => [dia.fecha, dia]));
  const celdas = construirGrillaMes(mes);
  const hoy = hoyISO();

  if (loading && dias.length === 0) {
    return (
      <div className="capacity-calendar-card capacity-calendar-state">
        <i className="fa-solid fa-spinner fa-spin" />
        <span>Cargando capacidad del mes...</span>
      </div>
    );
  }

  return (
    <div className="capacity-calendar-card">
      <div className="capacity-weekdays" aria-hidden="true">
        {DIAS_SEMANA.map((dia) => (
          <span key={dia}>{dia}</span>
        ))}
      </div>

      <div
        className={`capacity-grid ${loading ? "is-loading" : ""}`}
        aria-busy={loading}
      >
        {celdas.map((celda, index) => {
          if (!celda) {
            return (
              <div
                key={`vacio-${index}`}
                className="capacity-day capacity-day--vacio"
                aria-hidden="true"
              />
            );
          }

          const dia = mapaDias.get(celda.fecha);
          const estado = obtenerEstadoDia(dia);
          const porcentaje = porcentajeOcupacion(dia);
          const esHoy = celda.fecha === hoy;
          const esPasado = celda.fecha < hoy;
          const seleccionado = celda.fecha === selectedFecha;
          const sinOcupacion = dia && dia.fresasAgendadas === 0;
          const textoRestante = textoCelda(dia, estado);

          const detalle = dia
            ? `${formatearFechaLarga(celda.fecha)}. ${dia.fresasAgendadas} fresas agendadas de ${dia.tope}. ${
                textoRestante || "Con cupo completo"
              }.`
            : formatearFechaLarga(celda.fecha);

          return (
            <button
              key={celda.fecha}
              type="button"
              className={[
                "capacity-day",
                `capacity-day--${estado.clave}`,
                esHoy && "is-today",
                esPasado && "is-past",
                sinOcupacion && "is-empty",
                seleccionado && "is-selected",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={seleccionado}
              aria-label={detalle}
              title={detalle}
              onClick={() => onSelect(celda.fecha)}
            >
              <span className="capacity-day-top">
                <span className="capacity-day-number">{celda.dia}</span>
                {dia?.bloqueado && (
                  <span
                    className="capacity-day-flag capacity-day-flag--blocked"
                    title="Día bloqueado"
                  >
                    <i className="fa-solid fa-ban" />
                  </span>
                )}
                {!dia?.bloqueado && dia?.tieneExcepcion && (
                  <span
                    className="capacity-day-flag capacity-day-flag--exception"
                    title="Tope especial"
                  >
                    <i className="fa-solid fa-star" />
                  </span>
                )}
              </span>

              {dia ? (
                <>
                  <span className="capacity-day-count">
                    <strong>{dia.fresasAgendadas}</strong>
                    <span>/ {dia.tope}</span>
                  </span>
                  <span className="capacity-day-remaining">{textoRestante}</span>
                  <span className="capacity-day-bar" aria-hidden="true">
                    <span style={{ width: `${porcentaje}%` }} />
                  </span>
                </>
              ) : (
                <span className="capacity-day-remaining">Sin datos</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}