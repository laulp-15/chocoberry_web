// src/validators/categoria.validator.js
// Esquemas de validación del módulo de categorías.
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

const nombreField = z
  .string({ required_error: 'El nombre de la categoría es obligatorio.' })
  .trim()
  .min(2, 'El nombre de la categoría debe tener al menos 2 caracteres.')
  .max(100, 'El nombre de la categoría no puede superar los 100 caracteres.');

export const filtrosCategoriaSchema = z.object({
  nombre: z.string().trim().optional(),
  estado: booleanoFlexible.optional(),
});

export const crearCategoriaSchema = z.object({
  nombre: nombreField,
  estado: booleanoFlexible.optional(),
});

// Al actualizar, todos los campos son opcionales (actualización parcial).
// El estado se cambia únicamente con PATCH /categorias/:id/estado.
export const actualizarCategoriaSchema = z.object({
  nombre: nombreField.optional(),
});
