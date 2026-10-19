// src/validators/accion.validator.js
// Esquemas de validación del catálogo de acciones.
import { z } from 'zod';

export const filtrosAccionSchema = z.object({
  nombre: z.string().trim().optional(),
});

const nombreAccionField = z
  .string({ required_error: 'El nombre de la acción es obligatorio.' })
  .trim()
  .min(3, 'El nombre de la acción debe tener al menos 3 caracteres.')
  .max(50, 'El nombre de la acción no puede superar los 50 caracteres.');

export const crearAccionSchema = z.object({ nombre: nombreAccionField });
export const actualizarAccionSchema = z.object({ nombre: nombreAccionField });
