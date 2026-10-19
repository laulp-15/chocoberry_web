// src/controllers/permiso.controller.js
// Manejo de request/response del módulo de permisos.
import * as permisoService from '../services/permiso.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const permisos = await permisoService.listar(req.validado.query);
  return sendSuccess(res, permisos, 'Permisos obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const permiso = await permisoService.obtener(req.validado.params.id);
  return sendSuccess(res, permiso, 'Permiso obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const permiso = await permisoService.crear(req.validado.body);
  return sendCreated(res, permiso, 'Permiso creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const permiso = await permisoService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, permiso, 'Permiso actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await permisoService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Permiso eliminado exitosamente.');
});
