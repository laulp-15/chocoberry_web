// src/features/admin/orders/components/DevolverPaymentModal.jsx
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import "./RejectReasonModal.css";

/**
 * Devuelve un comprobante Pendiente con un motivo obligatorio. El comprobante
 * queda en el historial y no cuenta para el total aprobado.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(motivo: string) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 */
export default function DevolverPaymentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
}) {
  const { values, errors, setField, handleBlur, validateAll } =
    useFormValidation({
      initialValues: { motivo: "" },
      validators: {
        motivo: (v) => {
          const motivo = v.motivo.trim();
          if (!motivo) return "Escribe el motivo de la devolución.";
          if (motivo.length < 5) {
            return "El motivo debe tener al menos 5 caracteres.";
          }
          if (motivo.length > 255) {
            return "El motivo no puede superar los 255 caracteres.";
          }
          return "";
        },
      },
    });

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateAll()) return;
    await onSubmit(values.motivo.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Devolver comprobante de pago"
      maxWidth="sm"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Devolviendo..." : "Devolver comprobante"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: "13px", lineHeight: 1.5 }}>
        El comprobante quedará como Devuelto en el historial y no contará para el
        total aprobado. El motivo será visible para el cliente.
      </p>

      {formError && (
        <div className="form-error form-error-block" role="alert">
          {formError}
        </div>
      )}

      <FormTextField
        label="Motivo de la devolución"
        required
        multiline
        minRows={3}
        value={values.motivo}
        onChange={(v) => setField("motivo", v)}
        onBlur={() => handleBlur("motivo")}
        placeholder="Ej: El comprobate no es visible."
        error={errors.motivo}
      />
    </Modal>
  );
}
