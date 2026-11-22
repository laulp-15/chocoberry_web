// src/validators/comprobante.validator.js
// Validación de las acciones del administrador sobre un comprobante de pago.
import { z } from 'zod';

export const aprobarComprobanteSchema = z.object({
  monto: z.coerce
    .number({
      required_error: 'El monto verificado es obligatorio.',
      invalid_type_error: 'El monto verificado debe ser un número.',
    })
    .positive('El monto verificado debe ser mayor que cero.')
    .max(99999999.99, 'El monto verificado es demasiado alto.'),
});

export const devolverComprobanteSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo de la devolución es obligatorio.' })
    .trim()
    .min(5, 'El motivo de la devolución debe tener al menos 5 caracteres.')
    .max(255, 'El motivo de la devolución no puede superar los 255 caracteres.'),
});
