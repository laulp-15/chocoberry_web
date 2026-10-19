// src/shared/utils/fileValidation.js
// Validación compartida de archivos para los campos de subida (foto de
// producto, comprobantes de pago, etc.). Fuente única de las reglas de
// tipo y tamaño.

// Formatos de imagen permitidos (lista explícita: excluye GIF, SVG, etc.).
export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const ALLOWED_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
export const PDF_MIME = "application/pdf";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
export const IMAGE_OR_PDF_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
export const MAX_FILE_SIZE_MB = 5;

function hasAllowedExtension(name, extensions) {
  const ext = name?.split(".").pop()?.toLowerCase();
  return Boolean(ext) && extensions.includes(ext);
}

export function isImageFile(file) {
  if (!file) return false;
  // Si el navegador reporta un tipo, se usa la lista explícita (estricto).
  if (file.type) return ALLOWED_IMAGE_MIME_TYPES.includes(file.type);
  // Respaldo por extensión solo cuando no hay metadatos de tipo.
  return hasAllowedExtension(file.name, ALLOWED_IMAGE_EXTENSIONS);
}

export function isPdfFile(file) {
  if (!file) return false;
  if (file.type) return file.type === PDF_MIME;
  return hasAllowedExtension(file.name, ["pdf"]);
}

/**
 * Valida un archivo por tipo y tamaño.
 *
 * @param {File} file
 * @param {{ allowPdf?: boolean, maxSizeMB?: number }} [options]
 * @returns {string} mensaje de error, o "" si el archivo es válido.
 */
export function validateFile(file, { allowPdf = false, maxSizeMB = MAX_FILE_SIZE_MB } = {}) {
  if (!file) return "No se seleccionó ningún archivo.";

  const validType = isImageFile(file) || (allowPdf && isPdfFile(file));
  if (!validType) {
    return allowPdf
      ? "Formato no permitido. Sube una imagen (PNG, JPG o WEBP) o un PDF."
      : "Formato no permitido. Sube una imagen (PNG, JPG o WEBP).";
  }

  if (maxSizeMB > 0 && file.size > maxSizeMB * 1024 * 1024) {
    return `El archivo supera el tamaño máximo de ${maxSizeMB} MB.`;
  }

  return "";
}
