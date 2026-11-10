// src/middlewares/errorHandler.js
// Manejador central de errores. Debe registrarse AL FINAL, después de todas
// las rutas. Traduce cualquier error a la forma uniforme { success, message, data }.
import { ZodError } from 'zod';
import AppError from '../errors/AppError.js';
import env from '../config/env.js';

/** Traduce los errores más comunes de MySQL a respuestas HTTP claras. */
function mapMysqlError(err) {
  switch (err.code) {
    case 'ER_DUP_ENTRY': {
      const detalle = String(err.sqlMessage ?? err.message ?? '');

      // Respaldo ante una carrera: la restricción única de documento es la
      // última barrera, aunque el service ya valida antes de insertar.
      if (detalle.includes('uq_usuario_numero_documento')) {
        return {
          statusCode: 409,
          message: 'Ya existe un usuario registrado con ese número de documento.',
          code: 'DOCUMENT_TAKEN',
        };
      }

      if (detalle.includes('correo')) {
        return {
          statusCode: 409,
          message: 'Ya existe un usuario registrado con ese correo.',
          code: 'EMAIL_TAKEN',
        };
      }

      return { statusCode: 409, message: 'Ya existe un registro con esos datos.', code: 'DUPLICATE_ENTRY' };
    }
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return {
        statusCode: 409,
        message: 'No se puede eliminar: el registro está asociado a otros datos.',
        code: 'FOREIGN_KEY_REFERENCED',
      };
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return {
        statusCode: 400,
        message: 'Se referencia un registro que no existe.',
        code: 'FOREIGN_KEY_NOT_FOUND',
      };
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Errores de validación de Zod → 422 con la lista de campos inválidos.
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Datos inválidos.',
      data: null,
      errors: err.issues.map((issue) => ({
        campo: issue.path.join('.') || '(raíz)',
        mensaje: issue.message,
      })),
    });
  }

  // Errores de subida de archivos (multer).
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `Error al subir el archivo: ${err.message}`,
      data: null,
    });
  }

  // Cuerpo JSON malformado.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'El cuerpo de la solicitud no es un JSON válido.',
      data: null,
    });
  }

  // Errores propios de MySQL.
  const mysql = mapMysqlError(err);
  if (mysql) {
    return res.status(mysql.statusCode).json({
      success: false,
      message: mysql.message,
      data: null,
      code: mysql.code,
    });
  }

  // Errores de negocio esperados (AppError y subclases).
  if (err instanceof AppError || err.isOperational) {
    const body = {
      success: false,
      message: err.message,
      data: null,
      code: err.code,
    };
    if (err.details) body.errors = err.details;
    return res.status(err.statusCode || 500).json(body);
  }

  // Error inesperado (no controlado): se registra y se responde 500 genérico.
  if (env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
    data: null,
    ...(env.nodeEnv === 'development' ? { debug: err.message } : {}),
  });
};

export default errorHandler;
