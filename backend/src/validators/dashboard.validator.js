// src/validators/dashboard.validator.js
// Parámetro opcional para seleccionar el período mensual del Dashboard.
import { z } from 'zod';
import { parseMes } from '../utils/dates.js';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const mesField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, 'El mes debe tener el formato YYYY-MM.')
  .refine((valor) => parseMes(valor) !== null, 'El mes de referencia no es válido.');

export const filtrosDashboardSchema = z.object({
  mes: z.preprocess(vacioAUndefined, mesField.optional()),
});
