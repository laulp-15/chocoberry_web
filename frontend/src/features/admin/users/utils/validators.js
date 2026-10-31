// src/features/admin/users/utils/validators.js
import {
  validateFullName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
  validateDocType,
  validateIdNumber,
  validateNombres,
  validateApellidos,
  validateAddress,
  validateNeighborhood,
} from "../../../login/utils/validators";

// Se reexportan tal cual: la política de nombre/correo/contraseña/teléfono y
// la de los datos de identidad (documento, nombres/apellidos, dirección y
// barrio) es UNA sola, la define el subproceso de login, y este módulo no
// debería tener una regla distinta para el mismo dato.
export {
  validateFullName,
  validateEmail,
  validateConfirmPassword,
  validatePhone,
  validateDocType,
  validateIdNumber,
  validateNombres,
  validateApellidos,
  validateAddress,
  validateNeighborhood,
};

export function validateRole(value) {
  if (!value) return "Selecciona un rol.";
  return "";
}

/**
 * En "Crear usuario" el backend genera la contraseña temporal y envía el
 * correo de activación. En "Editar usuario" la contraseña es opcional
 * (si se deja en blanco, se conserva la actual), pero si se escribe algo
 * debe cumplir la política.
 */
export function validatePasswordForEdit(value) {
  if (!value) return "";
  return validatePassword(value);
}
