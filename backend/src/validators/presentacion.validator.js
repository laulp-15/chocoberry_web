// src/validators/presentacion.validator.js
// Esquemas de validación del módulo de presentaciones (cantidad de fresas y precio).
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

// La cadena vacía (campo de formulario sin diligenciar) se trata como "no enviado".
const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const cantidadFresasField = z.coerce
  .number({
    required_error: 'La cantidad de fresas es obligatoria.',
    invalid_type_error: 'La cantidad de fresas debe ser un número.',
  })
  .int('La cantidad de fresas debe ser un número entero.')
  .positive('La cantidad de fresas debe ser mayor que cero.')
  .max(1000, 'La cantidad de fresas es demasiado alta.');

const precioField = z.coerce
  .number({
    required_error: 'El precio es obligatorio.',
    invalid_type_error: 'El precio debe ser un número.',
  })
  .nonnegative('El precio no puede ser negativo.')
  .max(99999999.99, 'El precio es demasiado alto.');

export const filtrosPresentacionSchema = z.object({
  cantidadFresas: z.preprocess(vacioAUndefined, cantidadFresasField.optional()),
  estado: booleanoFlexible.optional(),
});

export const crearPresentacionSchema = z.object({
  cantidadFresas: cantidadFresasField,
  precio: precioField,
  estado: booleanoFlexible.optional(),
});

// Al actualizar, todos los campos son opcionales (actualización parcial).
export const actualizarPresentacionSchema = z.object({
  cantidadFresas: cantidadFresasField.optional(),
  precio: precioField.optional(),
  estado: booleanoFlexible.optional(),
});
