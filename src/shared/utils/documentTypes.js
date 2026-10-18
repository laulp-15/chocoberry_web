// src/shared/utils/documentTypes.js

// Tipos de documento de identidad del sistema. Vive en shared porque lo usan
// el registro de clientes (login), el perfil y el panel de usuarios (admin):
// el código del documento debe ser el mismo en todas partes.
export const DOC_TYPE_OPTIONS = [
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "NIT", label: "NIT" },
  { value: "PA", label: "Pasaporte" },
];

// Devuelve la etiqueta legible del tipo de documento (para el detalle).
export function docTypeLabel(value) {
  const found = DOC_TYPE_OPTIONS.find((opt) => opt.value === value);
  return found ? found.label : value || "";
}
