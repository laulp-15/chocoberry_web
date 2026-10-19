// src/shared/components/FileDropzone.jsx
import React, { useRef, useState } from "react";
import {
  IMAGE_OR_PDF_ACCEPT,
  MAX_FILE_SIZE_MB,
  PDF_MIME,
  validateFile,
} from "../utils/fileValidation";
import ImageLightbox from "./ImageLightbox";
import "./FileDropZone.css";

/**
 * Zona de arrastrar-y-soltar (o clic) para subir un archivo. Reutilizada en
 * el comprobante de pago del checkout y en el admin de pedidos.
 *
 * Valida el tipo (imágenes y, opcionalmente, PDF) y el tamaño máximo.
 *
 * @param {object} props
 * @param {File | null} props.file
 * @param {(file: File | null) => void} props.onChange
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {string} [props.error] - error externo (validación del formulario)
 * @param {string} [props.accept] - valor del atributo accept del input
 * @param {boolean} [props.allowPdf] - si se permite subir PDF
 * @param {number} [props.maxSizeMB]
 */
export default function FileDropzone({
  file,
  onChange,
  label = "Subir archivo",
  hint = "Arrastra tu archivo aquí o haz clic para buscarlo",
  error,
  accept = IMAGE_OR_PDF_ACCEPT,
  allowPdf = true,
  maxSizeMB = MAX_FILE_SIZE_MB,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleFiles = (fileList) => {
    const f = fileList?.[0];
    if (!f) return;

    const validationError = validateFile(f, { allowPdf, maxSizeMB });
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    onChange(f);
  };

  const isPdf = file?.type === PDF_MIME;
  const shownError = error || localError;
  // URL de la vista previa (solo imágenes): se reutiliza en la miniatura y en
  // el visor ampliado.
  const previewUrl = file && !isPdf ? URL.createObjectURL(file) : null;

  if (file) {
    return (
      <>
        <div className="dropzone-preview">
          {isPdf ? (
            <div className="dropzone-preview-pdf">
              <i className="fa-solid fa-file-pdf" />
            </div>
          ) : (
            <button
              type="button"
              className="dropzone-preview-thumb"
              onClick={() => setLightboxOpen(true)}
              title="Ver imagen ampliada"
            >
              <img src={previewUrl} alt={label} />
              <span className="dropzone-preview-zoom">
                <i className="fa-solid fa-magnifying-glass-plus" />
              </span>
            </button>
          )}
          <div className="dropzone-preview-info">
            <span className="dropzone-preview-name">{file.name}</span>
            <button type="button" className="dropzone-remove" onClick={() => onChange(null)}>
              <i className="fa-solid fa-xmark" />
              Quitar
            </button>
          </div>
        </div>

        {previewUrl && (
          <ImageLightbox
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            src={previewUrl}
            alt={label}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <div
        className={`dropzone ${isDragging ? "dragging" : ""} ${shownError ? "has-error" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="dropzone-icon">
          <i className="fa-solid fa-file-import" />
        </div>
        <div className="dropzone-title">{label}</div>
        <div className="dropzone-subtitle">{hint}</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // permite volver a elegir el mismo archivo
          }}
        />
      </div>
      {shownError && <div className="form-error">{shownError}</div>}
    </div>
  );
}
