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

export const rechazarComprobanteSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo de rechazo es obligatorio.' })
    .trim()
    .min(5, 'El motivo de rechazo debe tener al menos 5 caracteres.')
    .max(255, 'El motivo de rechazo no puede superar los 255 caracteres.'),
  monto: z.coerce
    .number({
      required_error: 'El valor entregado es obligatorio.',
      invalid_type_error: 'El valor entregado debe ser un número.',
    })
    .min(0, 'El valor entregado no puede ser negativo.')
    .max(99999999.99, 'El valor entregado es demasiado alto.'),
});
