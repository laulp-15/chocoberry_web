// src/validators/auth.validator.js
// Esquemas de validación del módulo de acceso.
import { z } from 'zod';
import {
  apellidosField,
  barrioField,
  contrasenaField,
  correoField,
  direccionField,
  nombresField,
  numeroDocumentoField,
  telefonoField,
  tipoDocumentoField,
} from './common.validator.js';

// Registro de cuenta de cliente (rol Cliente forzado por el service).
export const registroSchema = z.object({
  nombres: nombresField,
  apellidos: apellidosField,
  tipoDocumento: tipoDocumentoField,
  numeroDocumento: numeroDocumentoField,
  correo: correoField,
  contrasena: contrasenaField,
  telefono: telefonoField,
  direccion: direccionField,
  barrio: barrioField,
});

// Login: no se re-exige la política de contraseña (puede ser antigua).
export const loginSchema = z.object({
  correo: correoField,
  contrasena: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.'),
});

export const recuperacionSchema = z.object({
  correo: correoField,
});

export const restablecerSchema = z.object({
  token: z.string().min(1, 'El token es obligatorio.'),
  contrasena: contrasenaField,
});

export const cambioContrasenaSchema = z.object({
  contrasenaActual: z.string().min(1, 'La contraseña actual es obligatoria.'),
  nuevaContrasena: contrasenaField,
});

// Edición del propio perfil (no permite cambiar rol, estado ni contraseña).
export const actualizarPerfilSchema = z.object({
  nombres: nombresField.optional(),
  apellidos: apellidosField.optional(),
  tipoDocumento: tipoDocumentoField.optional(),
  numeroDocumento: numeroDocumentoField.optional(),
  correo: correoField.optional(),
  telefono: telefonoField,
  direccion: direccionField,
  barrio: barrioField,
});
