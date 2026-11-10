// src/validators/resena.validator.js
// Validación del módulo de reseñas. El cliente solo envía calificación y
// comentario; el usuario, la fecha y el estado se resuelven en el servidor.
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const calificacionField = z.coerce
  .number({
    required_error: 'La calificación es obligatoria.',
    invalid_type_error: 'La calificación debe ser un número.',
  })
  .int('La calificación debe ser un número entero.')
  .min(1, 'La calificación mínima es 1.')
  .max(5, 'La calificación máxima es 5.');

const calificacionFiltro = z.preprocess(
  vacioAUndefined,
  calificacionField.optional()
);

export const crearResenaSchema = z.object({
  calificacion: calificacionField,
  comentario: z
    .string({ required_error: 'El comentario es obligatorio.' })
    .trim()
    .min(1, 'El comentario no puede estar vacío.')
    .max(300, 'El comentario no puede superar los 300 caracteres.'),
});

export const filtrosResenaPublicaSchema = z.object({
  calificacion: calificacionFiltro,
});

export const filtrosResenaSchema = z.object({
  cliente: z.string().trim().optional(),
  calificacion: calificacionFiltro,
  estado: z.preprocess(vacioAUndefined, booleanoFlexible.optional()),
});

export const cambiarEstadoResenaSchema = z.object({
  estado: booleanoFlexible,
});
