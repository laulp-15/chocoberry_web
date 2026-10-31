// src/validators/usuario.validator.js
// Esquemas de validación del módulo de usuarios (panel administrador).
import { z } from 'zod';
import {
  apellidosField,
  barrioField,
  booleanoFlexible,
  contrasenaOpcionalField,
  correoField,
  direccionField,
  idParamSchema,
  nombresField,
  numeroDocumentoField,
  telefonoField,
  tipoDocumentoField,
} from './common.validator.js';

export { idParamSchema };

export const filtrosUsuarioSchema = z.object({
  nombre: z.string().trim().optional(),
  correo: z.string().trim().optional(),
  rol: z.string().trim().optional(),
  id_rol: z.coerce.number().int().positive().optional(),
  estado: booleanoFlexible.optional(),
});

// Resolución del rol: se acepta id numérico (`id_rol`) o nombre/slug (`rol`).
const rolFields = {
  id_rol: z.coerce.number().int().positive().optional(),
  rol: z.string().trim().optional(),
};

export const crearUsuarioSchema = z.object({
  nombres: nombresField,
  apellidos: apellidosField,
  tipoDocumento: tipoDocumentoField,
  numeroDocumento: numeroDocumentoField,
  correo: correoField,
  contrasena: contrasenaOpcionalField,
  telefono: telefonoField,
  direccion: direccionField,
  barrio: barrioField,
  estado: booleanoFlexible.optional(),
  ...rolFields,
});

// El estado se cambia únicamente con PATCH /usuarios/:id/estado.
export const actualizarUsuarioSchema = z.object({
  nombres: nombresField.optional(),
  apellidos: apellidosField.optional(),
  tipoDocumento: tipoDocumentoField.optional(),
  numeroDocumento: numeroDocumentoField.optional(),
  correo: correoField.optional(),
  contrasena: contrasenaOpcionalField,
  telefono: telefonoField,
  direccion: direccionField,
  barrio: barrioField,
  ...rolFields,
});

export const estadoSchema = z.object({
  estado: booleanoFlexible,
});
