// src/middlewares/upload.js
// Subida de archivos con multer. Los archivos se guardan en /backend/uploads y
// se sirven como estáticos desde app.js (GET /uploads/<archivo>).
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { rootDir } from '../config/env.js';
import { BadRequestError } from '../errors/index.js';

// Carpeta destino (coincide con el estático declarado en app.js).
export const uploadsDir = path.join(rootDir, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Tipos permitidos y su extensión. La extensión se deriva del tipo MIME, nunca
// del nombre que envía el cliente (así no se puede "colar" una ruta o un .php).
const TIPOS_PERMITIDOS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const extension = TIPOS_PERMITIDOS[file.mimetype] ?? '';
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unico}${extension}`);
  },
});

function fileFilter(req, file, cb) {
  if (!TIPOS_PERMITIDOS[file.mimetype]) {
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

/** Imagen del producto (campo "imagen"). */
export const subirImagen = subirArchivo('imagen');

/** Comprobante de pago del pedido (campo "comprobante"). */
export const subirComprobante = subirArchivo('comprobante');

/** Evidencia fotográfica de la entrega (campo "evidencia"). */
export const subirEvidencia = subirArchivo('evidencia');

/** Ruta pública ("/uploads/archivo.png") del archivo subido, si vino alguno. */
export function rutaArchivoSubido(req) {
  return req.file ? `/uploads/${req.file.filename}` : undefined;
}

/** Alias histórico para la imagen del producto. */
export function rutaImagenSubida(req) {
  return rutaArchivoSubido(req);
}
