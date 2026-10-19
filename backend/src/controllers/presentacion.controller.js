// src/controllers/presentacion.controller.js
// Manejo de request/response del módulo de presentaciones.
import * as presentacionService from '../services/presentacion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const presentaciones = await presentacionService.listar(req.validado.query);
  return sendSuccess(res, presentaciones, 'Presentaciones obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const presentacion = await presentacionService.obtener(req.validado.params.id);
  return sendSuccess(res, presentacion, 'Presentación obtenida exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const presentacion = await presentacionService.crear(req.validado.body);
  return sendCreated(res, presentacion, 'Presentación creada exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const presentacion = await presentacionService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, presentacion, 'Presentación actualizada exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const presentacion = await presentacionService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, presentacion, 'Estado de la presentación actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await presentacionService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Presentación eliminada exitosamente.');
});
