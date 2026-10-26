// src/errors/index.js
// Errores de negocio tipados, con su código HTTP correspondiente.
import AppError from './AppError.js';

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida.', details = null) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado.', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos para realizar esta acción.', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado.', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'La operación entra en conflicto con el estado actual.', details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

/** El número de documento ya está registrado por otro usuario. */
export class DocumentTakenError extends AppError {
  constructor(message = 'Ya existe un usuario registrado con ese número de documento.') {
    super(message, 409, 'DOCUMENT_TAKEN');
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'No se pudo procesar la solicitud.', details = null) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

export { AppError };
export default AppError;
