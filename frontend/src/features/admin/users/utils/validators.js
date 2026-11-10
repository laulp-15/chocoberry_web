// src/features/admin/users/utils/validators.js
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateDocType,
  validateIdNumber,
  validateNombres,
  validateApellidos,
  validateAddress,
} from "../../../login/utils/validators";

// Se reexportan tal cual: la política de nombre/correo/teléfono y la de los
// datos de identidad (documento, nombres/apellidos y dirección) es UNA sola,
// la define el subproceso de login, y este módulo no debería tener una regla
// distinta para el mismo dato.
export {
  validateFullName,
  validateEmail,
  validatePhone,
  validateDocType,
  validateIdNumber,
  validateNombres,
  validateApellidos,
  validateAddress,
};

export function validateRole(value) {
  if (!value) return "Selecciona un rol.";
  return "";
}
