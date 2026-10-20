// src/validators/municipio.validator.js
// Esquemas de validación del módulo de municipios (destinos y domicilio).
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

// La cadena vacía (campo de formulario sin diligenciar) se trata como "no enviado".
const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const nombreField = z
  .string({ required_error: 'El nombre del municipio es obligatorio.' })
  .trim()
  .min(2, 'El nombre del municipio debe tener al menos 2 caracteres.')
  .max(100, 'El nombre del municipio no puede superar los 100 caracteres.');

// El panel envía `costoEnvio`; la API también acepta los nombres del recurso.
const precioField = z.preprocess(
  vacioAUndefined,
  z.coerce
    .number({ invalid_type_error: 'El costo de envío debe ser un número.' })
    .nonnegative('El costo de envío no puede ser negativo.')
    .max(99999999.99, 'El costo de envío es demasiado alto.')
    .optional()
);

export const filtrosMunicipioSchema = z.object({
  nombre: z.string().trim().optional(),
  estado: booleanoFlexible.optional(),
});

export const crearMunicipioSchema = z
  .object({
    nombre: nombreField,
    precioDomicilio: precioField,
    precio_domicilio: precioField,
    costoEnvio: precioField,
    estado: booleanoFlexible.optional(),
  })
  .refine(
    (datos) =>
      datos.precioDomicilio !== undefined ||
      datos.precio_domicilio !== undefined ||
      datos.costoEnvio !== undefined,
    {
      message: 'El costo de envío es obligatorio.',
      path: ['precioDomicilio'],
    }
  );

// Al actualizar, todos los campos son opcionales (actualización parcial).
export const actualizarMunicipioSchema = z.object({
  nombre: nombreField.optional(),
  precioDomicilio: precioField,
  precio_domicilio: precioField,
  costoEnvio: precioField,
  estado: booleanoFlexible.optional(),
});
