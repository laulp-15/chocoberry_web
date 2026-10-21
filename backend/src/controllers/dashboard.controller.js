// src/controllers/dashboard.controller.js
// Manejo de request/response del Dashboard (solo Administrador).
import * as dashboardService from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const resumen = asyncHandler(async (req, res) => {
  const datos = await dashboardService.obtenerResumen(req.validado.query);
  return sendSuccess(res, datos, 'Resumen del dashboard obtenido exitosamente.');
});
