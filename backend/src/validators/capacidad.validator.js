// src/validators/capacidad.validator.js
// Validación de los parámetros y cuerpos del módulo de capacidad.
import { z } from 'zod';
import { parseFecha, parseMes } from '../utils/dates.js';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const mesField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, 'El mes debe tener el formato YYYY-MM.')
  .refine((valor) => parseMes(valor) !== null, 'El mes indicado no es válido.');

const fechaField = z
  .string({ required_error: 'La fecha es obligatoria.' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')
  .refine((valor) => parseFecha(valor) !== null, 'La fecha indicada no es válida.');

const topeField = z.coerce
  .number({
    required_error: 'El tope es obligatorio.',
    invalid_type_error: 'El tope debe ser un número.',
  })
  .int('El tope debe ser un número entero.')
  .min(0, 'El tope no puede ser negativo.');

export const filtrosCapacidadSchema = z.object({
  mes: z.preprocess(vacioAUndefined, mesField.optional()),
});

export const fechaCapacidadSchema = z.object({
  fecha: fechaField,
});

export const topeDiaSchema = z.object({
  maxFresas: topeField,
});

export const topeEstandarSchema = z.object({
  maxFresas: topeField.positive('El tope estándar debe ser mayor que cero.'),
});
