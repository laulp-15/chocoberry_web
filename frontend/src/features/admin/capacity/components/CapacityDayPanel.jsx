// src/features/admin/capacity/components/CapacityDayPanel.jsx
import {
  formatearFechaLarga,
  obtenerEstadoDia,
} from "../utils/capacityUtils";
import "./CapacityDayPanel.css";

export default function CapacityDayPanel({
  fecha,
  dia,
  loading = false,
  error = "",
  canEdit = false,
  saving = false,
  onRetry,
  onSpecialLimit,
  onBlock,
  onReset,
}) {
  if (!fecha) {
    return (
      <aside className="capacity-day-panel capacity-day-panel--empty">
        <span className="capacity-panel-icon">
          <i className="fa-solid fa-calendar-day" />
        </span>
        <h2>Detalle del día</h2>
        <p>Selecciona un día del calendario para consultar su capacidad.</p>
      </aside>
    );
  }

  const estado = obtenerEstadoDia(dia);
  const pedidos = dia?.pedidos ?? [];
  const fechaMostrada = dia?.fecha ?? fecha;

  // Porcentaje real (puede superar 100) y ancho de barra limitado a 100.
  const ocupacion =
    dia && dia.tope > 0
      ? Math.round((dia.fresasAgendadas / dia.tope) * 100)
      : dia?.fresasAgendadas > 0
        ? 100
        : 0;
  const anchoBarra = Math.min(ocupacion, 100);

  return (
    <aside className="capacity-day-panel" aria-busy={loading}>
      <div className="capacity-panel-heading">
        <h2>{formatearFechaLarga(fechaMostrada)}</h2>
        {loading && (
          <span className="capacity-panel-updating">
            <i className="fa-solid fa-spinner fa-spin" /> Actualizando...
          </span>
        )}
      </div>

      {error && !dia && (
        <p className="capacity-panel-error" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="crud-retry" onClick={onRetry}>
            Reintentar
          </button>
        </p>
      )}

      {!dia && loading && (
        <div className="capacity-panel-state">
          <i className="fa-solid fa-spinner fa-spin" />
          <span>Cargando detalle del día...</span>
        </div>
      )}

      {!dia && !loading && !error && (
        <div className="capacity-panel-state">
          <span>No hay información para este día.</span>
          <button type="button" className="crud-retry" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      )}

      {dia && (
        <>
          <div className="capacity-panel-badges">
            <span
              className={`capacity-status capacity-status--${estado.clave}`}
            >
              {estado.etiqueta}
            </span>
            {dia.tieneExcepcion && !dia.bloqueado && (
              <span className="capacity-status capacity-status--exception">
                <i className="fa-solid fa-star" /> Tope especial
              </span>
            )}
          </div>

          <div className="capacity-meter">
            <div className="capacity-meter-head">
              <span>Ocupación del día</span>
              <strong>{ocupacion}%</strong>
            </div>
            <div
              className="capacity-meter-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={anchoBarra}
              aria-label="Ocupación del día"
            >
              <span
                className={`capacity-meter-fill capacity-meter-fill--${estado.clave}`}
                style={{ width: `${anchoBarra}%` }}
              />
            </div>
          </div>

          <div className="capacity-stats">
            <div className="capacity-stat">
              <span>Tope del día</span>
              <strong>{dia.tope}</strong>
            </div>
            <div className="capacity-stat">
              <span>Agendadas</span>
              <strong>{dia.fresasAgendadas}</strong>
            </div>
            <div className="capacity-stat">
              <span>Disponibles</span>
              <strong>{Math.max(dia.disponible, 0)}</strong>
            </div>
          </div>

          {dia.fresasAgendadas > dia.tope && (
            <p className="capacity-panel-note capacity-panel-note--warning">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>
                La ocupación supera el tope actual. No hay cupo disponible para
                nuevas fechas en este día.
              </span>
            </p>
          )}

          {dia.bloqueado && (
            <p className="capacity-panel-note capacity-panel-note--warning">
              <i className="fa-solid fa-ban" />
              <span>
                Este día no recibe nuevos pedidos. Los pedidos ya agendados se
                conservan.
              </span>
            </p>
          )}

          {canEdit ? (
            <div className="capacity-actions">
              <button
                type="button"
                className="capacity-action capacity-action--special"
                onClick={onSpecialLimit}
                disabled={saving}
              >
                <i className="fa-solid fa-star" />
                {dia.tieneExcepcion && !dia.bloqueado
                  ? "Editar tope especial"
                  : "Establecer tope especial"}
              </button>
              {!dia.bloqueado && (
                <button
                  type="button"
                  className="capacity-action capacity-action--danger"
                  onClick={onBlock}
                  disabled={saving}
                >
                  <i className="fa-solid fa-ban" />
                  Bloquear día
                </button>
              )}
              {dia.tieneExcepcion && (
                <button
                  type="button"
                  className="capacity-action capacity-action--secondary"
                  onClick={onReset}
                  disabled={saving}
                >
                  <i className="fa-solid fa-rotate-left" />
                  Restablecer al estándar
                </button>
              )}
            </div>
          ) : (
            <p className="capacity-readonly">
              <i className="fa-solid fa-lock" /> Solo lectura: no tienes permiso
              para editar la capacidad.
            </p>
          )}

          <div className="capacity-orders">
            <div className="capacity-orders-header">
              <h3>Pedidos que ocupan cupo</h3>
              <span>{pedidos.length}</span>
            </div>

            {pedidos.length === 0 ? (
              <p className="capacity-orders-empty">
                No hay pedidos agendados para este día.
              </p>
            ) : (
              <ul className="capacity-orders-list">
                {pedidos.map((pedido) => (
                  <li key={pedido.id} className="capacity-order-item">
                    <span>Pedido #{pedido.id}</span>
                    <strong>{pedido.fresas} fresas</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  );
}