// src/middlewares/upload.js
// Subida de archivos con multer en memoria. El buffer se valida por su firma
// real y los services lo envían a Cloudinary; no se escribe nada en disco.
import multer from 'multer';
import { BadRequestError } from '../errors/index.js';

const TIPOS_PERMITIDOS = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
    return cb(new BadRequestError('Formato de imagen no permitido. Usa PNG, JPG o WEBP.'));
  }
  return cb(null, true);
}

/**
 * Middleware de subida de una única imagen en el campo indicado.
 * Si la petición no es multipart (por ejemplo JSON), multer no hace nada y la
 * ruta sigue funcionando con una ruta/URL enviada como texto en el cuerpo.
 */
function subirArchivo(campo) {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_BYTES, files: 1 },
  }).single(campo);
}

function subirArchivos(campo, maximo) {
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_BYTES, files: maximo },
  }).array(campo, maximo);
}

/** Máximo de imágenes por producto (coincide con el CHECK de la tabla). */
export const MAX_IMAGENES_PRODUCTO = 4;

/** Imágenes del producto (campo "imagenes", hasta 4 archivos). */
export const subirImagenes = subirArchivos('imagenes', MAX_IMAGENES_PRODUCTO);

/** Imagen única (compatibilidad con otros módulos que suben una sola foto). */
export const subirImagen = subirArchivo('imagen');

/** Comprobante de pago del pedido (campo "comprobante"). */
export const subirComprobante = subirArchivo('comprobante');

/** Evidencia fotográfica de la entrega (campo "evidencia"). */
export const subirEvidencia = subirArchivo('evidencia');
