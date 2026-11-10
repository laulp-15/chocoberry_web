// src/validators/permiso.validator.js
// Esquemas de validación del módulo de permisos (combinación módulo + acción).
import { z } from 'zod';

export const filtrosPermisoSchema = z.object({
  modulo: z.string().trim().optional(),
  accion: z.string().trim().optional(),
});

const idModuloField = z.coerce
  .number({ invalid_type_error: 'El módulo es obligatorio.' })
  .int()
  .positive('Selecciona un módulo válido.');

const idAccionField = z.coerce
  .number({ invalid_type_error: 'La acción es obligatoria.' })
  .int()
  .positive('Selecciona una acción válida.');

const nombrePermisoField = z
  .string()
  .trim()
  .min(3, 'El nombre del permiso debe tener al menos 3 caracteres.')
  .max(100, 'El nombre del permiso no puede superar los 100 caracteres.');

// En la creación, el nombre es opcional: si no viene, se genera
// automáticamente como "<Acción> <Módulo>" (ej. "Ver Usuarios").
export const crearPermisoSchema = z.object({
  id_modulo: idModuloField,
  id_accion: idAccionField,
  nombre: nombrePermisoField.optional(),
});

export const actualizarPermisoSchema = z
  .object({
    id_modulo: idModuloField.optional(),
    id_accion: idAccionField.optional(),
    nombre: nombrePermisoField.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });
