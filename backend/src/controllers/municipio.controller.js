// src/controllers/municipio.controller.js
// CRUD de municipios del panel. Las rutas exigen el permiso del módulo
// "Productos" (no existe un módulo "Municipios" en la BD).
import * as municipioService from '../services/municipio.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

/**
 * El panel es de administración, pero el Cliente hereda "Productos · Ver".
 * Para no exponerle registros inactivos se fuerza estado = true a los no admin.
 */
function filtrosVisibles(req) {
  const esAdmin = String(req.usuario?.nombre_rol ?? '').toLowerCase() === 'administrador';
  return esAdmin ? req.validado.query : { ...req.validado.query, estado: true };
}

export const listar = asyncHandler(async (req, res) => {
  const municipios = await municipioService.listar(filtrosVisibles(req));
  return sendSuccess(res, municipios, 'Municipios obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const municipio = await municipioService.obtener(req.validado.params.id);
  return sendSuccess(res, municipio, 'Municipio obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const municipio = await municipioService.crear(req.validado.body);
  return sendCreated(res, municipio, 'Municipio creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const municipio = await municipioService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, municipio, 'Municipio actualizado exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const municipio = await municipioService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, municipio, 'Estado del municipio actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await municipioService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Municipio eliminado exitosamente.');
});
