// src/errors/AppError.js
// Error base de la aplicación. Lleva el código HTTP y un código de negocio
// opcional, para que el manejador central de errores responda de forma uniforme.
export default class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Marca para distinguir errores esperados (de negocio) de bugs inesperados.
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
