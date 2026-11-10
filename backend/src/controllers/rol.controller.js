// src/controllers/rol.controller.js
// Manejo de request/response del módulo de roles.
import * as rolService from '../services/rol.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const roles = await rolService.listar(req.validado.query);
  return sendSuccess(res, roles, 'Roles obtenidos exitosamente.');
});

export const opciones = asyncHandler(async (req, res) => {
  const roles = await rolService.listarOpciones();
  return sendSuccess(res, roles, 'Opciones de roles obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const rol = await rolService.obtener(req.validado.params.id);
  return sendSuccess(res, rol, 'Rol obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const rol = await rolService.crear(req.validado.body);
  return sendCreated(res, rol, 'Rol creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const rol = await rolService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, rol, 'Rol actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await rolService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Rol eliminado exitosamente.');
});

export const obtenerPermisos = asyncHandler(async (req, res) => {
  const permisos = await rolService.obtenerPermisos(req.validado.params.id);
  return sendSuccess(res, permisos, 'Permisos del rol obtenidos exitosamente.');
});

export const asignarPermisos = asyncHandler(async (req, res) => {
  const permisos = await rolService.asignarPermisos(req.validado.params.id, req.validado.body);
  return sendSuccess(res, permisos, 'Permisos del rol actualizados exitosamente.');
});
