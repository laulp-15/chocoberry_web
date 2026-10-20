// src/controllers/venta.controller.js
// Manejo de request/response del módulo de ventas (solo lectura).
import * as ventaService from '../services/venta.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const ventas = await ventaService.listar(req.validado.query);
  return sendSuccess(res, ventas, 'Ventas obtenidas exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const venta = await ventaService.obtener(req.validado.params.id, req.usuario);
  return sendSuccess(res, venta, 'Venta obtenida exitosamente.');
});
