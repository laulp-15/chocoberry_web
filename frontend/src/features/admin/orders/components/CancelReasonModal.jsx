// src/features/admin/orders/components/CancelReasonModal.jsx
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import "./RejectReasonModal.css";

/**
 * Pide el motivo obligatorio al cancelar un pedido. El estado solo se aplica
 * al enviar el formulario.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(reason: string) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 */
export default function CancelReasonModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
}) {
  const { values, errors, setField, handleBlur, validateAll } =
    useFormValidation({
      initialValues: { reason: "" },
      validators: {
        reason: (v) => {
          const motivo = v.reason.trim();
          if (!motivo) return "Escribe el motivo de la cancelación.";
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
    await onSubmit(values.reason.trim());
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Motivo de la cancelación"
      maxWidth="sm"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Volver
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Cancelando..." : "Cancelar pedido"}
          </button>
        </>
      }
    >
      {formError && (
        <div className="form-error form-error-block" role="alert">
          {formError}
        </div>
      )}
      <FormTextField
        label="Motivo"
        required
        multiline
        minRows={3}
        value={values.reason}
        onChange={(v) => setField("reason", v)}
        onBlur={() => handleBlur("reason")}
        placeholder="Ej: El cliente solicitó cancelar la entrega."
        error={errors.reason}
      />
    </Modal>
  );
}
