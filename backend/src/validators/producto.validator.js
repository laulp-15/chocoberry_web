// src/validators/producto.validator.js
// Esquemas de validación del módulo de productos.
import { z } from 'zod';
import { booleanoFlexible } from './common.validator.js';

const nombreField = z
  .string({ required_error: 'El nombre del producto es obligatorio.' })
  .trim()
  .min(2, 'El nombre del producto debe tener al menos 2 caracteres.')
  .max(100, 'El nombre del producto no puede superar los 100 caracteres.');

const descripcionField = z
  .string()
  .trim()
  .max(255, 'La descripción no puede superar los 255 caracteres.')
  .optional();

// Ruta o URL de la imagen. Los archivos subidos (multipart) se resuelven en el
// controlador, así que aquí solo se valida el caso de rutas enviadas como texto.
const imagenField = z
  .string()
  .trim()
  .max(255, 'La ruta de la imagen no puede superar los 255 caracteres.')
  .optional();

// Máximo de imágenes por producto (coincide con el CHECK de la tabla).
const MAX_IMAGENES = 4;

/**
 * Lista de rutas que puede llegar como arreglo (JSON) o como texto JSON
 * (multipart). Se usa para `imagenesUrl` y `ordenImagenes`.
 */
const rutasField = z.preprocess(
  (valor) => {
    if (typeof valor !== 'string') return valor;
    const texto = valor.trim();
    if (!texto) return undefined;
    try {
      return JSON.parse(texto);
    } catch {
      return valor;
    }
  },
  z
    .array(
      z
        .string()
        .trim()
        .min(1, 'La ruta de la imagen no puede estar vacía.')
        .max(255, 'La ruta de la imagen no puede superar los 255 caracteres.')
    )
    .max(MAX_IMAGENES, `Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`)
    .optional()
);

// Acepta el id de la categoría como número o como texto numérico (multipart),
// y trata la cadena vacía como "no enviado".
const idCategoriaField = z.preprocess(
  (valor) => (valor === '' || valor === null ? undefined : valor),
  z.coerce
    .number({ invalid_type_error: 'La categoría debe ser un id numérico.' })
    .int('La categoría debe ser un id entero.')
    .positive('La categoría no es válida.')
    .optional()
);

export const filtrosProductoSchema = z.object({
  nombre: z.string().trim().optional(),
  idCategoria: idCategoriaField,
  id_categoria: idCategoriaField,
  categoria: z.string().trim().optional(),
  estado: booleanoFlexible.optional(),
});

export const crearProductoSchema = z
  .object({
    nombre: nombreField,
    descripcion: descripcionField,
    imagen: imagenField,
    imagenesUrl: rutasField,
    ordenImagenes: rutasField,
    estado: booleanoFlexible.optional(),
    idCategoria: idCategoriaField,
    id_categoria: idCategoriaField,
    categoria: z.string().trim().optional(),
  })
  .refine((datos) => datos.idCategoria !== undefined || datos.id_categoria !== undefined || !!datos.categoria, {
    message: 'La categoría es obligatoria.',
    path: ['idCategoria'],
  });

// Al actualizar, todos los campos son opcionales (actualización parcial).
// El estado se cambia únicamente con PATCH /productos/:id/estado.
export const actualizarProductoSchema = z.object({
  nombre: nombreField.optional(),
  descripcion: descripcionField,
  imagen: imagenField,
  imagenesUrl: rutasField,
  ordenImagenes: rutasField,
  idCategoria: idCategoriaField,
  id_categoria: idCategoriaField,
  categoria: z.string().trim().optional(),
});
