// src/utils/cloudinaryStorage.js
// Única puerta de entrada a Cloudinary. Los controllers y models no hablan con
// el SDK: los services suben y borran imágenes a través de este módulo.
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';
import { AppError, BadRequestError, UnprocessableEntityError } from '../errors/index.js';

const CARPETAS = {
  producto: 'chocoberry/productos',
  comprobante: 'chocoberry/comprobantes',
  evidencia: 'chocoberry/evidencias',
};

const TIPOS_PRIVADOS = new Set(['comprobante', 'evidencia']);
const TIPOS = new Set(Object.keys(CARPETAS));
const MAX_BYTES = 5 * 1024 * 1024;

const FIRMAS = {
  png: Buffer.from('89504e470d0a1a0a', 'hex'),
  jpg: Buffer.from('ffd8ff', 'hex'),
  webpRiff: Buffer.from('52494646', 'hex'),
  webpFormato: Buffer.from('57454250', 'hex'),
};

const ES_TEST = env.nodeEnv === 'test';
let contadorPrueba = 0;

if (!ES_TEST) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

/** Detecta el formato real por la firma del archivo, no por su extensión. */
function detectarFormato(buffer) {
  if (!buffer || buffer.length < 8) return null;

  if (buffer.subarray(0, 8).equals(FIRMAS.png)) return 'png';
  if (buffer.subarray(0, 3).equals(FIRMAS.jpg)) return 'jpg';

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(FIRMAS.webpRiff) &&
    buffer.subarray(8, 12).equals(FIRMAS.webpFormato)
  ) {
    return 'webp';
  }

  return null;
}

function validarTipo(tipo) {
  if (!TIPOS.has(tipo)) {
    throw new AppError(`Tipo de imagen no soportado: "${tipo}".`, 500);
  }
}

function validarBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new UnprocessableEntityError('La imagen está vacía o no es válida.');
  }

  if (buffer.length > MAX_BYTES) {
    throw new BadRequestError('La imagen no puede superar los 5 MB.');
  }

  const formato = detectarFormato(buffer);
  if (!formato) {
    throw new BadRequestError('Formato de imagen no permitido. Usa PNG, JPG o WEBP.');
  }

  return formato;
}

function opcionesSubida(tipo, formato) {
  const privado = TIPOS_PRIVADOS.has(tipo);

  return {
    folder: CARPETAS[tipo],
    resource_type: 'image',
    type: privado ? 'authenticated' : 'upload',
    format: formato,
    overwrite: false,
    unique_filename: true,
    use_filename: false,
  };
}

function subirBufferCloudinary(buffer, opciones) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opciones, (error, resultado) => {
      if (error) return reject(error);
      return resolve(resultado);
    });
    stream.end(buffer);
  });
}

function subidaFalsa(tipo) {
  contadorPrueba += 1;
  const publicId = `${CARPETAS[tipo]}/prueba-${Date.now()}-${contadorPrueba}`;
  const segmento = TIPOS_PRIVADOS.has(tipo) ? 'authenticated' : 'upload';

  return {
    url: `https://res.cloudinary.com/test/image/${segmento}/v1/${publicId}.png`,
    public_id: publicId,
  };
}

/**
 * Sube un buffer ya validado. Se exporta para que el script de migración pueda
 * reutilizar exactamente la misma lógica que las subidas normales.
 */
export async function subirBuffer(buffer, tipo) {
  validarTipo(tipo);
  const formato = validarBuffer(buffer);

  if (ES_TEST) return subidaFalsa(tipo);

  try {
    const resultado = await subirBufferCloudinary(buffer, opcionesSubida(tipo, formato));
    return {
      url: resultado.secure_url,
      public_id: resultado.public_id,
    };
  } catch (error) {
    console.error(`[cloudinary] No se pudo subir la imagen (${tipo}):`, error.message);
    throw new AppError('No se pudo subir la imagen a Cloudinary.', 502);
  }
}

/** Sube el archivo de multer (memoryStorage) validando su contenido real. */
export async function subirImagen(file, tipo) {
  if (!file?.buffer) {
    throw new UnprocessableEntityError('La imagen es obligatoria.');
  }
  return subirBuffer(file.buffer, tipo);
}

/** Borra una imagen. Un public_id NULL representa una imagen antigua. */
export async function borrarImagen(publicId, tipo) {
  if (!publicId) return;
  validarTipo(tipo);
  if (ES_TEST) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      type: TIPOS_PRIVADOS.has(tipo) ? 'authenticated' : 'upload',
      invalidate: true,
    });
  } catch (error) {
    // Un fallo de borrado no debe tumbar la operación principal.
    console.error(`[cloudinary] No se pudo borrar la imagen ${publicId}:`, error.message);
  }
}

/** URL firmada y temporal para comprobantes y evidencias autenticadas. */
export function urlFirmada(publicId, tipo) {
  if (!publicId) return null;
  validarTipo(tipo);
  if (!TIPOS_PRIVADOS.has(tipo)) return null;

  if (ES_TEST) {
    return `https://res.cloudinary.com/test/image/authenticated/s--test--/v1/${publicId}.png`;
  }

  return cloudinary.url(publicId, {
    resource_type: 'image',
    type: 'authenticated',
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + env.cloudinary.signedUrlTtlSeconds,
  });
}

/**
 * Resuelve la URL que se devuelve al cliente. Las imágenes antiguas sin
 * public_id se devuelven tal cual; las privadas se firman en cada respuesta.
 */
export function resolverUrlImagen(url, publicId, tipo) {
  if (!url) return null;
  if (!publicId || tipo === 'producto') return url;
  return urlFirmada(publicId, tipo) ?? url;
}

export async function subirImagenProducto(file) {
  return subirImagen(file, 'producto');
}

export async function subirImagenComprobante(file) {
  return subirImagen(file, 'comprobante');
}

export async function subirImagenEvidencia(file) {
  return subirImagen(file, 'evidencia');
}

export async function borrarImagenProducto(publicId) {
  return borrarImagen(publicId, 'producto');
}

export async function borrarImagenComprobante(publicId) {
  return borrarImagen(publicId, 'comprobante');
}

export async function borrarImagenEvidencia(publicId) {
  return borrarImagen(publicId, 'evidencia');
}

export { CARPETAS, MAX_BYTES };
