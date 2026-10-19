// src/validators/modulo.validator.js
// Esquemas de validación del catálogo de módulos.
import { z } from 'zod';

export const filtrosModuloSchema = z.object({
  nombre: z.string().trim().optional(),
});

const nombreModuloField = z
  .string({ required_error: 'El nombre del módulo es obligatorio.' })
  .trim()
  .min(3, 'El nombre del módulo debe tener al menos 3 caracteres.')
  .max(100, 'El nombre del módulo no puede superar los 100 caracteres.');

export const crearModuloSchema = z.object({ nombre: nombreModuloField });
export const actualizarModuloSchema = z.object({ nombre: nombreModuloField });
