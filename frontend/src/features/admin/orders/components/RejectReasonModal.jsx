// src/features/admin/orders/components/RejectReasonModal.jsx
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
 * @param {(reason: string) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 */
export default function RejectReasonModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
  title = "Motivo del rechazo",
  label = "Motivo",
  placeholder = "Ej: El cliente no confirmó el pago del pedido.",
  submitLabel = "Guardar",
}) {
  const { values, errors, setField, handleBlur, validateAll } =
    useFormValidation({
      initialValues: { reason: "" },
      validators: {
        reason: (v) => {
          const motivo = v.reason.trim();
          if (!motivo) return "Escribe el motivo del rechazo.";
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
      title={title}
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
            {submitting ? "Guardando..." : submitLabel}
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
        label={label}
        required
        multiline
        minRows={3}
        value={values.reason}
        onChange={(v) => setField("reason", v)}
        onBlur={() => handleBlur("reason")}
        placeholder={placeholder}
        error={errors.reason}
      />
    </Modal>
  );
}
