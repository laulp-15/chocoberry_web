// src/features/admin/users/utils/validators.js
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
} from "../../../login/utils/validators";

// Se reexportan tal cual: la política de nombre/correo/contraseña/teléfono
// del sistema es UNA sola, la definió el subproceso de login y este módulo
// no debería tener una regla distinta para el mismo dato.
export { validateFullName, validateEmail, validateConfirmPassword, validatePhone };

export function validateRole(value) {
  if (!value) return "Selecciona un rol.";
  return "";
}

/**
 * En "Crear usuario" la contraseña es obligatoria y debe cumplir la
 * política. En "Editar usuario" es opcional (CA_10: si se deja en
 * blanco, se conserva la actual) — pero si se escribe algo, sí debe
 * cumplir la política.
 */
export function validatePasswordForCreate(value) {
  return validatePassword(value);
}

export function validatePasswordForEdit(value) {
  if (!value) return "";
  return validatePassword(value);
}

// -----------------------------------------------------------------------------
// Campos propios del módulo de usuarios (admin)
// -----------------------------------------------------------------------------

// Solo letras (con tildes/ñ) y espacios internos. A diferencia de
// validateFullName, NO exige dos palabras: un nombre o un apellido pueden
// ser una sola palabra.
const SINGLE_NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
const ID_NUMBER_REGEX = /^\d+$/;

export function validateDocType(value) {
  if (!value) return "Selecciona el tipo de documento.";
  return "";
}

export function validateIdNumber(value) {
  const v = value?.trim() ?? "";
  if (!v) return "El número de documento es obligatorio.";
  if (!ID_NUMBER_REGEX.test(v)) return "El documento solo debe contener números.";
  if (v.length < 6 || v.length > 15) return "El documento debe tener entre 6 y 15 dígitos.";
  return "";
}

export function validateNombres(value) {
  const v = value?.trim() ?? "";
  if (!v) return "El nombre es obligatorio.";
  if (v.length < 2) return "El nombre es demasiado corto.";
  if (!SINGLE_NAME_REGEX.test(v)) return "El nombre solo debe contener letras.";
  return "";
}

export function validateApellidos(value) {
  const v = value?.trim() ?? "";
  if (!v) return "El apellido es obligatorio.";
  if (v.length < 2) return "El apellido es demasiado corto.";
  if (!SINGLE_NAME_REGEX.test(v)) return "El apellido solo debe contener letras.";
  return "";
}

export function validateAddress(value) {
  const v = value?.trim() ?? "";
  if (!v) return "La dirección es obligatoria.";
  if (v.length < 5) return "Ingresa una dirección válida.";
  return "";
}

export function validateNeighborhood(value) {
  const v = value?.trim() ?? "";
  if (!v) return "El barrio es obligatorio.";
  if (v.length < 3) return "El barrio es demasiado corto.";
  return "";
}
