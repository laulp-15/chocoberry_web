// src/features/admin/capacity/components/CapacityStandardModal.jsx
import { useState } from "react";

import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import "./CapacityModals.css";

export default function CapacityStandardModal({
  open,
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
      setError(err?.message || "No se pudo actualizar el tope estándar.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar tope estándar"
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
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      {error && (
        <div className="form-error form-error-block" role="alert">
          {error}
        </div>
      )}

      <FormTextField
        label="Fresas por día"
        required
        type="number"
        value={valor}
        onChange={setValor}
        placeholder="Ej. 200"
      />

      <p className="capacity-modal-note">
        Este tope aplica a todos los días sin excepción. Los días bloqueados
        conservan su tope en cero hasta que los restablezcas.
      </p>
    </Modal>
  );
}
