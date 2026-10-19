// src/features/cart/components/PaymentSection.jsx
import React from "react";
import FileDropzone from "../../../shared/components/FileDropZone";
import { NEQUI_ACCOUNT } from "../data/paymentInfo";
import "./PaymentSection.css";

/**
 * @param {object} props
 * @param {File | null} props.proofFile
 * @param {(file: File | null) => void} props.onProofFileChange
 * @param {string} [props.proofFileError]
 */
export default function PaymentSection({
  proofFile,
  onProofFileChange,
  proofFileError,
}) {
  return (
    <div className="checkout-section">
      <div className="checkout-section-title">
        <i className="fa-solid fa-credit-card" />
        Información de Pago
      </div>

      <p className="payment-intro">
        Por favor, realiza la transferencia y adjunta tu comprobante para procesar tu pedido.
      </p>
      <div className="payment-nequi">
        <i className="fa-solid fa-phone" />
        Transferencias a Nequi: <strong>{NEQUI_ACCOUNT}</strong>
      </div>

      <div className="form-field">
        <label className="form-label">Comprobante de pago *</label>
        <FileDropzone
          file={proofFile}
          onChange={onProofFileChange}
          label="Subir comprobante de pago"
          hint="PNG, JPG, WEBP o PDF (máx. 5 MB)"
          error={proofFileError}
        />
      </div>
    </div>
  );
}