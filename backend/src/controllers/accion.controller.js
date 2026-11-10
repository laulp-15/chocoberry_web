// src/controllers/accion.controller.js
// Manejo de request/response del catálogo de acciones.
import * as accionService from '../services/accion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const acciones = await accionService.listar(req.validado.query);
  return sendSuccess(res, acciones, 'Acciones obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const accion = await accionService.obtener(req.validado.params.id);
  return sendSuccess(res, accion, 'Acción obtenida exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const accion = await accionService.crear(req.validado.body);
  return sendCreated(res, accion, 'Acción creada exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const accion = await accionService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, accion, 'Acción actualizada exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await accionService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Acción eliminada exitosamente.');
});
