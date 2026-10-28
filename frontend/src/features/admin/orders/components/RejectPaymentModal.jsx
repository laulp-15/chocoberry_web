// src/features/admin/orders/components/RejectPaymentModal.jsx
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./RejectReasonModal.css";

const redondear2 = (valor) =>
  Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

/**
 * Rechaza un comprobante registrando el valor realmente entregado. Ese valor
 * reduce el saldo, pero no puede completarlo: el pago final debe aprobarse.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(datos: { motivo: string, monto: number }) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 * @param {number} [props.saldo]
 */
export default function RejectPaymentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
  saldo = 0,
}) {
  const saldoRedondeado = redondear2(saldo);
  const { values, errors, setField, handleBlur, validateAll } =
    useFormValidation({
      initialValues: { motivo: "", monto: "" },
      validators: {
        motivo: (v) => {
          const motivo = v.motivo.trim();
          if (!motivo) return "Escribe el motivo del rechazo.";
          if (motivo.length < 5) {
            return "El motivo debe tener al menos 5 caracteres.";
          }
          if (motivo.length > 255) {
            return "El motivo no puede superar los 255 caracteres.";
          }
          return "";
        },
        monto: (v) => {
          if (!v.monto.trim()) return "Escribe el valor entregado.";
          const monto = Number(v.monto);
          if (!Number.isFinite(monto) || monto < 0) {
            return "El valor entregado debe ser mayor o igual a cero.";
          }
          if (monto > 99999999.99) {
            return "El valor entregado es demasiado alto.";
          }

          const montoRedondeado = redondear2(monto);
          if (saldoRedondeado > 0) {
            if (montoRedondeado > saldoRedondeado) {
              return "El valor entregado no puede superar el saldo pendiente.";
            }
            if (montoRedondeado === saldoRedondeado) {
              return "Si el valor completa el saldo, usa Aprobar.";
            }
          } else if (montoRedondeado !== 0) {
            return "Con saldo cero, el valor entregado debe ser 0.";
          }

          return "";
        },
      },
    });

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateAll()) return;
    await onSubmit({
      motivo: values.motivo.trim(),
      monto: redondear2(values.monto),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rechazar comprobante de pago"
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
            {submitting ? "Rechazando..." : "Rechazar comprobante"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: "13px", lineHeight: 1.5 }}>
        Registra el valor real entregado. Ese valor reduce el saldo; si completa
        el pago, debes usar Aprobar.
      </p>
      <p style={{ margin: "0 0 16px", fontSize: "13px" }}>
        Saldo pendiente: <strong>{formatPrice(Math.max(saldo, 0))}</strong>
      </p>

      {formError && (
        <div className="form-error form-error-block" role="alert">
          {formError}
        </div>
      )}

      <FormTextField
        label="Valor entregado"
        required
        type="number"
        value={values.monto}
        onChange={(v) => setField("monto", v)}
        onBlur={() => handleBlur("monto")}
        placeholder="Ej: 40000"
        error={errors.monto}
      />

      <div style={{ marginTop: "16px" }}>
        <FormTextField
          label="Motivo del rechazo"
          required
          multiline
          minRows={3}
          value={values.motivo}
          onChange={(v) => setField("motivo", v)}
          onBlur={() => handleBlur("motivo")}
          placeholder="Ej: El monto no coincide con la transferencia."
          error={errors.motivo}
        />
      </div>
    </Modal>
  );
}
