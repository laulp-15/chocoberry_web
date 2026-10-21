// src/controllers/resena.controller.js
// Manejo de request/response del panel de reseñas. La lectura pública vive en
// catalogo.controller.js y no requiere sesión.
import * as resenaService from '../services/resena.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const resenas = await resenaService.listar(req.validado.query);
  return sendSuccess(res, resenas, 'Reseñas obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const resena = await resenaService.obtener(req.validado.params.id);
  return sendSuccess(res, resena, 'Reseña obtenida exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const resena = await resenaService.crear(req.validado.body, req.usuario);
  return sendCreated(res, resena, 'Reseña creada exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const resena = await resenaService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, resena, 'Estado de la reseña actualizado exitosamente.');
});
