// src/features/admin/users/utils/documentTypes.js

// Tipos de documento disponibles en el formulario de usuarios.
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
