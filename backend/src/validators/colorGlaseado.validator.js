// src/validators/colorGlaseado.validator.js
// Esquemas de validación del módulo de glaseados (nombre y color hexadecimal).
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const nombreField = z
  .string({ required_error: 'El nombre del glaseado es obligatorio.' })
  .trim()
  .min(2, 'El nombre del glaseado debe tener al menos 2 caracteres.')
  .max(50, 'El nombre del glaseado no puede superar los 50 caracteres.');

// El panel envía `hex`; la API también acepta `codigoHex` / `codigo_hex`.
// Se normaliza siempre a "#RRGGBB" antes de guardarlo.
const hexField = z.preprocess(
  vacioAUndefined,
  z
    .string({ invalid_type_error: 'El color debe ser un código hexadecimal.' })
    .trim()
    .regex(/^#?[0-9A-Fa-f]{6}$/, 'Usa un color hexadecimal válido (ej: #EF818A).')
    .transform((valor) => `#${valor.replace('#', '').toUpperCase()}`)
    .optional()
);

export const filtrosColorGlaseadoSchema = z.object({
  nombre: z.string().trim().optional(),
  estado: booleanoFlexible.optional(),
});

export const crearColorGlaseadoSchema = z
  .object({
    nombre: nombreField,
    codigoHex: hexField,
    codigo_hex: hexField,
    hex: hexField,
    estado: booleanoFlexible.optional(),
  })
  .refine(
    (datos) =>
      datos.codigoHex !== undefined ||
      datos.codigo_hex !== undefined ||
      datos.hex !== undefined,
    {
      message: 'El color hexadecimal es obligatorio.',
      path: ['codigoHex'],
    }
  );

// Al actualizar, todos los campos son opcionales (actualización parcial).
export const actualizarColorGlaseadoSchema = z.object({
  nombre: nombreField.optional(),
  codigoHex: hexField,
  codigo_hex: hexField,
  hex: hexField,
  estado: booleanoFlexible.optional(),
});
