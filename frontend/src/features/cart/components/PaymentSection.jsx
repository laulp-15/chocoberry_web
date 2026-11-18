// src/features/cart/components/PaymentSection.jsx
import { useState } from "react";
import FileDropzone from "../../../shared/components/FileDropZone";
import ImageLightbox from "../../../shared/components/ImageLightbox";
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
  const [qrLightboxOpen, setQrLightboxOpen] = useState(false);

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
        <button
          type="button"
          className="payment-qr-image-wrapper"
          onClick={() => setQrLightboxOpen(true)}
          aria-label="Ampliar código QR de Nequi"
          title="Ver QR ampliado"
        >
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
          <span className="payment-qr-zoom" aria-hidden="true">
            <i className="fa-solid fa-magnifying-glass-plus" />
          </span>
        </button>

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

      <ImageLightbox
        open={qrLightboxOpen}
        onClose={() => setQrLightboxOpen(false)}
        src={NEQUI_QR}
        alt={`Código QR para transferir a la cuenta Nequi ${NEQUI_ACCOUNT}`}
      />

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