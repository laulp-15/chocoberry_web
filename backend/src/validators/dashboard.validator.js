// src/validators/dashboard.validator.js
// Parámetros opcionales para navegar las gráficas del Dashboard.
import { z } from 'zod';
import { parseFecha, parseMes } from '../utils/dates.js';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const semanaField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La semana debe tener el formato YYYY-MM-DD.')
  .refine((valor) => parseFecha(valor) !== null, 'La fecha de referencia no es válida.');

const mesField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, 'El mes debe tener el formato YYYY-MM.')
  .refine((valor) => parseMes(valor) !== null, 'El mes de referencia no es válido.');

export const filtrosDashboardSchema = z.object({
  semana: z.preprocess(vacioAUndefined, semanaField.optional()),
  mes: z.preprocess(vacioAUndefined, mesField.optional()),
});
