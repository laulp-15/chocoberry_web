// src/features/admin/capacity/components/CapacityConfirmModal.jsx
import Modal from "../../../../shared/components/Modal";
import "./CapacityModals.css";
import {
  formatearFechaCorta,
  formatearFechaLarga,
} from "../utils/capacityUtils";

export default function CapacityConfirmModal({
  open,
  accion,
  fecha,
  topeEstandar,
  submitting = false,
  error = "",
  onClose,
  onConfirm,
}) {
  if (!fecha) return null;

  const esBloqueo = accion === "bloquear";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esBloqueo ? "Bloquear día" : "Restablecer día"}
      maxWidth="sm"
      footer={
        <>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`btn-save ${esBloqueo ? "capacity-btn-danger" : ""}`}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting
              ? "Guardando..."
              : esBloqueo
                ? "Bloquear día"
                : "Restablecer"}
          </button>
        </>
      }
    >
      {error && (
        <div className="form-error form-error-block" role="alert">
          {error}
        </div>
      )}

      <p className="capacity-confirm-title">
        {formatearFechaLarga(fecha)}
      </p>

      <p className="capacity-modal-note">
        {esBloqueo
          ? `El ${formatearFechaCorta(
              fecha
            )} dejará de recibir nuevos pedidos. Los pedidos ya agendados se conservan.`
          : `El ${formatearFechaCorta(
              fecha
            )} volverá a usar el tope estándar de ${topeEstandar} fresas por día.`}
      </p>
    </Modal>
  );
}
