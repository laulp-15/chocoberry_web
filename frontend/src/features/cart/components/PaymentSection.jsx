// src/features/cart/components/PaymentSection.jsx
import FileDropzone from "../../../shared/components/FileDropZone";
import { IMAGE_ACCEPT } from "../../../shared/utils/fileValidation";
import { NEQUI_ACCOUNT, NEQUI_QR } from "../data/paymentInfo";
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

      {/* Código QR */}
      <div className="payment-qr">
        <div className="payment-qr-image-wrapper">
          <img
            src={NEQUI_QR}
            alt={`Código QR para transferir a la cuenta Nequi ${NEQUI_ACCOUNT}`}
            className="payment-qr-image"
            loading="lazy"
            onError={(e) => {
              console.warn(
                `[PaymentSection] No se pudo cargar el QR en la ruta: ${NEQUI_QR}. ` +
                  "Verifica que el archivo exista en public/ con ese nombre exacto."
              );
              e.currentTarget.closest(".payment-qr").style.display = "none";
            }}
          />
        </div>

        <div className="payment-qr-info">
          <p className="payment-qr-caption">
            También puedes escanear este código QR para transferir.
          </p>
          <a
            href={NEQUI_QR}
            download="qr-nequi-chocoberry.png"
            className="payment-qr-download"
          >
            <i className="fa-solid fa-download" />
            Descargar QR
          </a>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Comprobante de pago *</label>
        <FileDropzone
          file={proofFile}
          onChange={onProofFileChange}
          label="Subir comprobante de pago"
          hint="PNG, JPG o WEBP (máx. 5 MB)"
          accept={IMAGE_ACCEPT}
          allowPdf={false}
          error={proofFileError}
        />
      </div>
    </div>
  );
}