// src/features/admin/capacity/components/CapacityDayLimitModal.jsx
import { useState } from "react";

import Modal from "../../../../shared/components/Modal";
import "./CapacityModals.css";
import FormTextField from "../../../../shared/components/FormTextField";
import {
  formatearFechaCorta,
  formatearFechaLarga,
} from "../utils/capacityUtils";

export default function CapacityDayLimitModal({
  open,
  fecha,
  initialValue,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [valor, setValor] = useState(() => String(initialValue ?? ""));
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;

    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero <= 0) {
      setError("Ingresa un número entero mayor que cero.");
      return;
    }

    setError("");
    try {
      await onSubmit(numero);
    } catch (err) {
      setError(
        err?.message || "No se pudo actualizar el tope especial del día."
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tope especial del día"
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
            className="btn-save"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Guardando..." : "Guardar tope"}
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

      <FormTextField
        label="Fresas para este día"
        required
        type="number"
        value={valor}
        onChange={setValor}
        placeholder="Ej. 250"
      />

      <p className="capacity-modal-note">
        Este tope reemplaza el estándar únicamente para el{" "}
        {formatearFechaCorta(fecha)}. Para dejar el día sin cupo usa “Bloquear
        día”.
      </p>
    </Modal>
  );
}
