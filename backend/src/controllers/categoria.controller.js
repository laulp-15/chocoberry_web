// src/controllers/categoria.controller.js
// Manejo de request/response del módulo de categorías.
import * as categoriaService from '../services/categoria.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const categorias = await categoriaService.listar(req.validado.query);
  return sendSuccess(res, categorias, 'Categorías obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.obtener(req.validado.params.id);
  return sendSuccess(res, categoria, 'Categoría obtenida exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.crear(req.validado.body);
  return sendCreated(res, categoria, 'Categoría creada exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.actualizar(req.validado.params.id, req.validado.body);
  return sendSuccess(res, categoria, 'Categoría actualizada exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const categoria = await categoriaService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, categoria, 'Estado de la categoría actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await categoriaService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Categoría eliminada exitosamente.');
});
