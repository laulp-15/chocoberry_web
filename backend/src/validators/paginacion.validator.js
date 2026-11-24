// src/validators/paginacion.validator.js
// Campos reutilizables para listados paginados de forma opcional.
import { z } from 'zod';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

export const paginaField = z.preprocess(
  vacioAUndefined,
  z.coerce
    .number({ invalid_type_error: 'La página debe ser un número.' })
    .int('La página debe ser un número entero.')
    .min(1, 'La página debe ser mayor o igual a 1.')
    .optional()
);

export const limiteField = z.preprocess(
  vacioAUndefined,
  z.coerce
    .number({ invalid_type_error: 'El límite debe ser un número.' })
    .int('El límite debe ser un número entero.')
    .min(1, 'El límite debe ser mayor o igual a 1.')
    .max(50, 'El límite no puede superar 50 registros.')
    .optional()
);
