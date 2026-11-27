// src/features/admin/capacity/pages/CapacityPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useCapacity from "../hooks/useCapacity";
import CapacityLegend from "../components/CapacityLegend";
import CapacityCalendar from "../components/CapacityCalendar";
import CapacityDayPanel from "../components/CapacityDayPanel";
import CapacityStandardModal from "../components/CapacityStandardModal";
import CapacityDayLimitModal from "../components/CapacityDayLimitModal";
import CapacityConfirmModal from "../components/CapacityConfirmModal";
import {
  formatearFechaCorta,
  mesActualISO,
  mesMaximoCapacidad,
  nombreMes,
  sumarMeses,
} from "../utils/capacityUtils";
import "../../../../shared/css/adminCrud.css";
import "./CapacityPage.css";

export default function CapacityPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canEdit = can("Capacidad", "Editar");
  const canVerPedidos = can("Pedidos", "Ver");

  const {
    mes,
    cambiarMes,
    datosMes,
    topeEstandar,
    loading,
    error,
    reload,
    selectedFecha,
    seleccionarDia,
    datosDia,
    dayLoading,
    dayError,
    reloadDay,
    savingStandard,
    savingDayLimit,
    savingAction,
    actualizarEstandar,
    actualizarTopeDia,
    bloquearDia,
    restablecerDia,
  } = useCapacity();

  const [standardOpen, setStandardOpen] = useState(false);
  const [dayLimitOpen, setDayLimitOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const mesMaximo = mesMaximoCapacidad();
  const puedeAvanzar = mes < mesMaximo;

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const cambiarMesPorDelta = (delta) => {
    const siguienteMes = sumarMeses(mes, delta);
    if (delta > 0 && siguienteMes > mesMaximo) return;
    cambiarMes(siguienteMes);
    setFeedback(null);
  };

  const irAlMesActual = () => {
    cambiarMes(mesActualISO());
    setFeedback(null);
  };

  const handleSelectDay = (fecha) => {
    seleccionarDia(fecha);
    setConfirmacion("");
    setConfirmError("");
  };

  const handleSaveStandard = async (maxFresas) => {
    await actualizarEstandar(maxFresas);
    setStandardOpen(false);
    setFeedback({
      message: `Tope estándar actualizado a ${maxFresas} fresas por día.`,
    });
  };

  const handleOpenDayLimit = () => {
    if (!canEdit || !selectedFecha) return;
    setDayLimitOpen(true);
  };

  const handleSaveDayLimit = async (maxFresas) => {
    await actualizarTopeDia(maxFresas);
    setDayLimitOpen(false);
    setFeedback({
      message: `Tope especial del ${formatearFechaCorta(
        selectedFecha
      )} actualizado a ${maxFresas} fresas.`,
    });
  };

  const handleOpenConfirm = (accion) => {
    if (!canEdit) return;
    setConfirmError("");
    setConfirmacion(accion);
  };

  const handleConfirm = async () => {
    setConfirmError("");
    try {
      if (confirmacion === "bloquear") {
        await bloquearDia();
        setFeedback({
          message: `Día ${formatearFechaCorta(selectedFecha)} bloqueado.`,
        });
      } else {
        await restablecerDia();
        setFeedback({
          message: `Día ${formatearFechaCorta(
            selectedFecha
          )} restablecido al tope estándar.`,
        });
      }
      setConfirmacion("");
    } catch (err) {
      setConfirmError(err?.message || "No se pudo actualizar el día.");
    }
  };

  return (
    <div className="crud-page capacity-page">
      <header className="capacity-header">
        <div className="capacity-heading">
          {canVerPedidos && (
            <button
              type="button"
              className="capacity-back"
              onClick={() => navigate("/admin/pedidos")}
            >
              <i className="fa-solid fa-arrow-left-long" />
              Pedidos
            </button>
          )}
          <h1 className="capacity-title">Capacidad diaria</h1>
          <p className="capacity-description">
            Consulta la producción agendada por día y administra el cupo de
            fresas.
          </p>
        </div>
      </header>

      <div className="capacity-toolbar">
        <div className="capacity-month-nav">
          <button
            type="button"
            className="capacity-month-btn"
            aria-label="Mes anterior"
            title="Mes anterior"
            onClick={() => cambiarMesPorDelta(-1)}
          >
            <i className="fa-solid fa-arrow-left-long" />
          </button>
          <span className="capacity-month-label">
            {nombreMes(mes)}
            {loading && (
              <i className="fa-solid fa-spinner fa-spin capacity-month-spinner" />
            )}
          </span>
          <button
            type="button"
            className="capacity-month-btn"
            aria-label={
              puedeAvanzar
                ? "Mes siguiente"
                : "Mes siguiente no disponible: límite de 3 años"
            }
            title={
              puedeAvanzar
                ? "Mes siguiente"
                : "Máximo 3 años hacia adelante"
            }
            disabled={!puedeAvanzar}
            onClick={() => cambiarMesPorDelta(1)}
          >
            <i className="fa-solid fa-arrow-right-long" />
          </button>
          <button
            type="button"
            className="capacity-today"
            onClick={irAlMesActual}
          >
            Hoy
          </button>
        </div>

        <div className="capacity-standard-box">
          <div className="capacity-standard-info">
            <span>Tope estándar</span>
            <strong>
              {topeEstandar > 0 ? `${topeEstandar} fresas/día` : "—"}
            </strong>
          </div>
          {canEdit && (
            <button
              type="button"
              className="capacity-standard-edit"
              title="Editar tope estándar"
              aria-label="Editar tope estándar"
              disabled={loading || topeEstandar <= 0}
              onClick={() => setStandardOpen(true)}
            >
              <i className="fa-solid fa-pen" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="capacity-feedback" role="status">
          <i className="fa-solid fa-circle-check" />
          <span>{feedback.message}</span>
          <button
            type="button"
            aria-label="Cerrar mensaje"
            onClick={() => setFeedback(null)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {error && (
        <p className="crud-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="crud-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      <div className="capacity-layout">
        <section className="capacity-calendar-column">
          <CapacityCalendar
            mes={mes}
            dias={datosMes.dias}
            selectedFecha={selectedFecha}
            loading={loading}
            onSelect={handleSelectDay}
          />

          <CapacityLegend />
        </section>

        <CapacityDayPanel
          fecha={selectedFecha}
          dia={datosDia}
          loading={dayLoading}
          error={dayError}
          canEdit={canEdit}
          saving={savingAction}
          onRetry={reloadDay}
          onSpecialLimit={handleOpenDayLimit}
          onBlock={() => handleOpenConfirm("bloquear")}
          onReset={() => handleOpenConfirm("restablecer")}
        />
      </div>

      {standardOpen && (
        <CapacityStandardModal
          open
          initialValue={topeEstandar}
          submitting={savingStandard}
          onClose={() => setStandardOpen(false)}
          onSubmit={handleSaveStandard}
        />
      )}

      {dayLimitOpen && selectedFecha && (
        <CapacityDayLimitModal
          key={selectedFecha}
          open
          fecha={selectedFecha}
          initialValue={
            datosDia?.tieneExcepcion && datosDia.tope > 0
              ? datosDia.tope
              : topeEstandar
          }
          submitting={savingDayLimit}
          onClose={() => setDayLimitOpen(false)}
          onSubmit={handleSaveDayLimit}
        />
      )}

      <CapacityConfirmModal
        open={Boolean(confirmacion)}
        accion={confirmacion}
        fecha={selectedFecha}
        topeEstandar={topeEstandar}
        submitting={savingAction}
        error={confirmError}
        onClose={() => {
          setConfirmacion("");
          setConfirmError("");
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
