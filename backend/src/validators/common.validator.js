// src/validators/common.validator.js
// Campos reutilizables por todos los validadores, alineados con las reglas
// del frontend (login/utils/validators.js) para que la política sea una sola.
import { z } from 'zod';

// Solo letras (con tildes/ñ) y espacios internos.
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

export const correoField = z
  .string({ required_error: 'El correo electrónico es obligatorio.' })
  .trim()
  .toLowerCase()
  .min(1, 'El correo electrónico es obligatorio.')
  .max(150, 'El correo no puede superar los 150 caracteres.')
  .email('Ingresa un correo válido.');

export const contrasenaField = z
  .string({ required_error: 'La contraseña es obligatoria.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña no puede superar los 72 caracteres.')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula.')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número.')
  .regex(/[^A-Za-z0-9]/, 'La contraseña debe incluir al menos un carácter especial.');

// Para edición: si viene vacía, se conserva la contraseña actual.
export const contrasenaOpcionalField = z.union([contrasenaField, z.literal('')]).optional();

export const nombresField = z
  .string({ required_error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre es demasiado corto.')
  .max(100, 'El nombre no puede superar los 100 caracteres.')
  .regex(SOLO_LETRAS, 'El nombre solo debe contener letras.');

export const apellidosField = z
  .string({ required_error: 'El apellido es obligatorio.' })
  .trim()
  .min(2, 'El apellido es demasiado corto.')
  .max(100, 'El apellido no puede superar los 100 caracteres.')
  .regex(SOLO_LETRAS, 'El apellido solo debe contener letras.');

export const tipoDocumentoField = z.enum(['CC', 'CE', 'TI', 'NIT', 'PA'], {
  errorMap: () => ({ message: 'Selecciona un tipo de documento válido (CC, CE, TI, NIT, PA).' }),
});

export const numeroDocumentoField = z
  .string({ required_error: 'El número de documento es obligatorio.' })
  .trim()
  .regex(/^\d{6,15}$/, 'El documento debe tener entre 6 y 15 dígitos.');

export const telefonoField = z
  .string()
  .trim()
  .max(20, 'El teléfono no puede superar los 20 caracteres.')
  .optional()
  .refine((v) => !v || /^[\d\s-]+$/.test(v), 'El teléfono solo debe contener números.')
  .refine((v) => !v || v.replace(/\D/g, '').length === 10, 'El teléfono debe tener 10 dígitos.');

export const direccionField = z.string().trim().max(200, 'La dirección no puede superar los 200 caracteres.').optional();

export const barrioField = z.string().trim().max(100, 'El barrio no puede superar los 100 caracteres.').optional();

// Acepta true/false, "true"/"false", 1/0, "activo"/"inactivo".
export const booleanoFlexible = z.preprocess((valor) => {
  if (typeof valor === 'string') {
    const v = valor.trim().toLowerCase();
    if (['true', '1', 'activo', 'si', 'sí'].includes(v)) return true;
    if (['false', '0', 'inactivo', 'no'].includes(v)) return false;
  }
  return valor;
}, z.boolean({ invalid_type_error: 'El estado debe ser true o false.' }));
