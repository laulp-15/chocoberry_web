// src/features/admin/orders/components/RejectReasonModal.jsx
import React, { useEffect } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import "./RejectReasonModal.css";

/**
 * Pide el motivo al rechazar un pedido (desde el desplegable de estado o
 * desde el icono "Rechazar pedido"). El estado solo se aplica al enviar.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(reason: string) => void} props.onSubmit
 */
export default function RejectReasonModal({ open, onClose, onSubmit }) {
  const { values, errors, setField, handleBlur, validateAll, reset } = useFormValidation({
    initialValues: { reason: "" },
    validators: {
      reason: (v) => (v.reason.trim() ? "" : "Escribe el motivo del rechazo."),
    },
  });

  useEffect(() => {
    if (open) reset({ reason: "" });
  }, [open]);

  const handleSubmit = () => {
    if (!validateAll()) return;
    onSubmit(values.reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Motivo del rechazo"
      maxWidth="sm"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-save" onClick={handleSubmit}>
            Guardar
          </button>
        </>
      }
    >
      <FormTextField
        label="Motivo"
        required
        multiline
        minRows={3}
        value={values.reason}
        onChange={(v) => setField("reason", v)}
        onBlur={() => handleBlur("reason")}
        placeholder="Ej: El cliente no confirmó el pago del pedido."
        error={errors.reason}
      />
    </Modal>
  );
}