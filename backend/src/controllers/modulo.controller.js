// src/controllers/modulo.controller.js
// Manejo de request/response del catálogo de módulos.
import * as moduloService from '../services/modulo.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const modulos = await moduloService.listar(req.validado.query);
  return sendSuccess(res, modulos, 'Módulos obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const modulo = await moduloService.obtener(req.validado.params.id);
  return sendSuccess(res, modulo, 'Módulo obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const modulo = await moduloService.crear(req.validado.body);
  return sendCreated(res, modulo, 'Módulo creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const modulo = await moduloService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, modulo, 'Módulo actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await moduloService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Módulo eliminado exitosamente.');
});
