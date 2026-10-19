// src/features/login/utils/validators.js

/**
 * Validaciones puras (sin JSX) para los formularios de acceso.
 * Cada validate* devuelve "" cuando el campo es válido, o el mensaje
 * de error a mostrar cuando no lo es. Así los formularios solo hacen:
 *   const error = validateEmail(email);
 *
 * También viven aquí los datos de identidad del sistema (documento,
 * nombres/apellidos, dirección y barrio): los usan el registro, el perfil
 * y el panel de usuarios, y deben regirse por UNA sola política.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Solo letras (con tildes/ñ) y espacios, mínimo 2 palabras razonable.
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;

export function validateEmail(value) {
  if (!value?.trim()) return "El correo electrónico es obligatorio.";
  if (!EMAIL_REGEX.test(value.trim())) return "Ingresa un correo válido.";
  return "";
}

export function validateFullName(value) {
  if (!value?.trim()) return "El nombre completo es obligatorio.";
  if (value.trim().length < 3) return "El nombre es demasiado corto.";
  if (!NAME_REGEX.test(value.trim()))
    return "Ingresa tu nombre y apellido (solo letras).";
  return "";
}

/**
 * Reglas de contraseña, alineadas 1:1 con el checklist de la vista
 * "¡Cambia tu contraseña!" del prototipo:
 * mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
 */
export function getPasswordChecks(value = "") {
  return {
    minLength: value.length >= 8,
    hasUpper: /[A-Z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value),
  };
}

export function isPasswordStrong(value = "") {
  const checks = getPasswordChecks(value);
  return Object.values(checks).every(Boolean);
}

export function validatePassword(value) {
  if (!value) return "La contraseña es obligatoria.";
  if (!isPasswordStrong(value)) {
    return "La contraseña no cumple con los requisitos mínimos.";
  }
  return "";
}

export function validateLoginPassword(value) {
  // En login NO se re-exige la política completa (una contraseña
  // antigua podría no cumplirla), solo que no venga vacía.
  if (!value) return "La contraseña es obligatoria.";
  return "";
}

const PHONE_ALLOWED_REGEX = /^[\d\s-]+$/;

/**
 * Formato de teléfono: solo números (se toleran espacios y guiones) y
 * exactamente 10 dígitos. Si el campo viene vacío no valida nada, así
 * cada formulario decide si el teléfono es obligatorio.
 */
export function validatePhone(value) {
  const v = value?.trim() ?? "";
  if (!v) return "";
  if (!PHONE_ALLOWED_REGEX.test(v)) return "El teléfono solo debe contener números.";
  if (v.replace(/\D/g, "").length !== 10) return "El teléfono debe tener 10 dígitos.";
  return "";
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Confirma tu contraseña.";
  if (password !== confirmPassword) return "Las contraseñas no coinciden.";
  return "";
}

export function validateTermsAccepted(accepted) {
  if (!accepted) return "Debes aceptar los Términos y la Política de Privacidad.";
  return "";
}

// -----------------------------------------------------------------------------
// DATOS DE IDENTIDAD
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
