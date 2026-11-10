// src/middlewares/notFound.js
// Captura cualquier petición que no coincida con ninguna ruta y la convierte
// en un error 404 uniforme (delegado al manejador central de errores).
import { NotFoundError } from '../errors/index.js';

const notFound = (req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

export default notFound;
