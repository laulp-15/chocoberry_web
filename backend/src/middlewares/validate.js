// src/middlewares/validate.js
// Valida y sanea datos con un esquema de Zod. El resultado se deja en
// req.validado[source] para no chocar con los getters propios de Express.
import { eliminarArchivoSubido } from '../utils/archivos.js';
import { rutaDeArchivo } from './upload.js';

function archivosDeRequest(req) {
  const archivos = [];

  if (Array.isArray(req.files)) {
    archivos.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    for (const lista of Object.values(req.files)) {
      if (Array.isArray(lista)) archivos.push(...lista);
    }
  }

  if (req.file) archivos.push(req.file);
  return archivos;
}

async function limpiarSubidas(req) {
  const archivos = archivosDeRequest(req);
  await Promise.all(archivos.map((archivo) => eliminarArchivoSubido(rutaDeArchivo(archivo))));
}

/**
 * @param {import('zod').ZodType} schema Esquema de Zod.
 * @param {'body'|'query'|'params'} source Parte de la petición a validar.
 */
export function validar(schema, source = 'body') {
  return async (req, res, next) => {
    const resultado = schema.safeParse(req[source]);

    if (!resultado.success) {
      // Si multer ya guardó archivos, no los dejamos huérfanos al rechazar la petición.
      await limpiarSubidas(req);
      // El errorHandler central traduce ZodError a 422 con el detalle.
      return next(resultado.error);
    }

    req.validado = { ...(req.validado || {}), [source]: resultado.data };
    return next();
  };
}

export default validar;
