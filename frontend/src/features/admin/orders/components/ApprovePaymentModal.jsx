// src/features/admin/orders/components/ApprovePaymentModal.jsx
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./RejectReasonModal.css";

const redondear2 = (valor) =>
  Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

/**
 * Pide el monto realmente verificado al aprobar un comprobante. Solo se
 * permite cuando coincide exactamente con el saldo pendiente.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(monto: number) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 * @param {number} [props.saldo]
 */
export default function ApprovePaymentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
  saldo = 0,
}) {
  const saldoRedondeado = redondear2(saldo);
  const sugerido = saldoRedondeado > 0 ? saldoRedondeado : "";
  const { values, errors, setField, handleBlur, validateAll } =
    useFormValidation({
      initialValues: { monto: sugerido ? String(sugerido) : "" },
      validators: {
        monto: (v) => {
          if (!v.monto.trim()) return "Escribe el monto verificado.";
          const monto = Number(v.monto);
          if (!Number.isFinite(monto) || monto <= 0) {
            return "El monto verificado debe ser mayor que cero.";
          }
          if (monto > 99999999.99) {
            return "El monto verificado es demasiado alto.";
          }
          if (saldoRedondeado <= 0) {
            return "El pedido no tiene saldo pendiente por aprobar.";
          }
          if (redondear2(monto) !== saldoRedondeado) {
            return `El monto debe coincidir exactamente con el saldo pendiente (${formatPrice(
              saldoRedondeado
            )}).`;
          }
          return "";
        },
      },
    });

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateAll()) return;
    await onSubmit(redondear2(values.monto));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aprobar comprobante de pago"
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
            {submitting ? "Aprobando..." : "Aprobar pago"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: "13px", lineHeight: 1.5 }}>
        Verifica el valor real de la transferencia antes de aprobarla.
      </p>
      <p style={{ margin: "0 0 16px", fontSize: "13px" }}>
        Saldo pendiente: <strong>{formatPrice(Math.max(saldoRedondeado, 0))}</strong>
      </p>

      {formError && (
        <div className="form-error form-error-block" role="alert">
          {formError}
        </div>
      )}

      <FormTextField
        label="Monto verificado"
        required
        type="number"
        value={values.monto}
        onChange={(v) => setField("monto", v)}
        onBlur={() => handleBlur("monto")}
        placeholder="Ej: 85000"
        error={errors.monto}
      />

    </Modal>
  );
}
