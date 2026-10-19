// src/utils/asyncHandler.js
// Envuelve controladores async para no repetir try/catch en cada uno:
// cualquier error o promesa rechazada se delega al manejador central de errores.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
