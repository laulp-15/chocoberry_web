// src/features/admin/orders/components/UploadPaymentModal.jsx
import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FileDropzone from "../../../../shared/components/FileDropZone";
import { IMAGE_ACCEPT } from "../../../../shared/utils/fileValidation";

/**
 * Sube un comprobante de pago adicional a un pedido pendiente.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(file: File) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {string} [props.formError]
 */
export default function UploadPaymentModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
  formError = "",
}) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;
    if (!file) {
      setFileError("Selecciona el comprobante de pago.");
      return;
    }

    await onSubmit(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir comprobante de pago"
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
            {submitting ? "Subiendo..." : "Subir comprobante"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: "13px", lineHeight: 1.5 }}>
        Selecciona la imagen del comprobante de pago.
      </p>

      {formError && (
        <div className="form-error form-error-block" role="alert">
          {formError}
        </div>
      )}

      <FileDropzone
        file={file}
        onChange={(nuevoArchivo) => {
          setFile(nuevoArchivo);
          setFileError("");
        }}
        label="Subir comprobante de pago"
        hint="PNG, JPG o WEBP (máx. 5 MB)"
        accept={IMAGE_ACCEPT}
        allowPdf={false}
        error={fileError}
      />
    </Modal>
  );
}
