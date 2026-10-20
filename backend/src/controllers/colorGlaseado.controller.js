// src/controllers/colorGlaseado.controller.js
// CRUD de glaseados del panel. Las rutas exigen el permiso del módulo
// "Productos" (no existe un módulo "Glaseados" en la BD).
import * as colorGlaseadoService from '../services/colorGlaseado.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

/** Igual que en municipios: los no admin solo ven los colores activos. */
function filtrosVisibles(req) {
  const esAdmin = String(req.usuario?.nombre_rol ?? '').toLowerCase() === 'administrador';
  return esAdmin ? req.validado.query : { ...req.validado.query, estado: true };
}

export const listar = asyncHandler(async (req, res) => {
  const colores = await colorGlaseadoService.listar(filtrosVisibles(req));
  return sendSuccess(res, colores, 'Colores de glaseado obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const color = await colorGlaseadoService.obtener(req.validado.params.id);
  return sendSuccess(res, color, 'Color de glaseado obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const color = await colorGlaseadoService.crear(req.validado.body);
  return sendCreated(res, color, 'Color de glaseado creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const color = await colorGlaseadoService.actualizar(
    req.validado.params.id,
    req.validado.body
  );
  return sendSuccess(res, color, 'Color de glaseado actualizado exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const color = await colorGlaseadoService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, color, 'Estado del glaseado actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await colorGlaseadoService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Glaseado eliminado exitosamente.');
});
