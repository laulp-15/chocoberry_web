// src/validators/rol.validator.js
// Esquemas de validación del módulo de roles.
import { z } from 'zod';

export const filtrosRolSchema = z.object({
  nombre: z.string().trim().optional(),
});

const nombreRolField = z
  .string({ required_error: 'El nombre del rol es obligatorio.' })
  .trim()
  .min(3, 'El nombre del rol debe tener al menos 3 caracteres.')
  .max(50, 'El nombre del rol no puede superar los 50 caracteres.');

const permisosField = z
  .array(z.coerce.number().int().positive(), { required_error: 'Debes asignar los permisos.' })
  .min(1, 'Debes asignar al menos un permiso.');

export const crearRolSchema = z.object({
  nombre: nombreRolField,
  permisos: permisosField,
});

// Al actualizar, los permisos son opcionales (si no vienen, se conservan).
export const actualizarRolSchema = z.object({
  nombre: nombreRolField,
  permisos: permisosField.optional(),
});

export const asignarPermisosSchema = z.object({
  permisos: permisosField,
});
