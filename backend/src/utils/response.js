// src/utils/response.js
// Respuestas JSON uniformes para toda la API: { success, message, data }.

/** Respuesta exitosa (200 por defecto). */
export function sendSuccess(res, data = null, message = 'Operación exitosa.', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

/** Recurso creado (201). */
export function sendCreated(res, data = null, message = 'Recurso creado exitosamente.') {
  return sendSuccess(res, data, message, 201);
}

/** Operación sin datos que devolver, pero con cuerpo uniforme (200). */
export function sendNoData(res, message = 'Operación realizada exitosamente.') {
  return res.status(200).json({ success: true, message, data: null });
}
