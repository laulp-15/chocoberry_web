// src/validators/venta.validator.js
// Ventas reutiliza los filtros de pedidos. Se excluye idEstado porque Ventas
// trabaja con nombres de estado y solo acepta los estados de venta.
import { z } from 'zod';
import {
  fechaHoyColombia,
  parseFecha,
  sumarMesesConservandoDia,
} from '../utils/dates.js';
import { filtrosPedidoSchema } from './pedido.validator.js';

export const filtrosVentaSchema = filtrosPedidoSchema.omit({ idEstado: true });

const fechaReporteField = (etiqueta) =>
  z
    .string({ required_error: `La fecha "${etiqueta}" es obligatoria.` })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `La fecha "${etiqueta}" debe tener el formato YYYY-MM-DD.`)
    .refine((valor) => parseFecha(valor) !== null, `La fecha "${etiqueta}" no es válida.`);

export const reporteVentaSchema = z
  .object({
    desde: fechaReporteField('Desde'),
    hasta: fechaReporteField('Hasta'),
  })
  .superRefine(({ desde, hasta }, ctx) => {
    const fechaDesde = parseFecha(desde);
    const fechaHasta = parseFecha(hasta);

    if (fechaDesde > fechaHasta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['desde'],
        message: 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".',
      });
      return;
    }

    const hoy = parseFecha(fechaHoyColombia());
    if (fechaDesde > hoy || fechaHasta > hoy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasta'],
        message: 'No se permiten fechas futuras.',
      });
      return;
    }

    if (fechaHasta > sumarMesesConservandoDia(fechaDesde, 12)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hasta'],
        message: 'El rango máximo permitido es de 12 meses.',
      });
    }
  });
