// src/controllers/dashboard.controller.js
// Manejo de request/response del Dashboard (solo Administrador).
import * as dashboardService from '../services/dashboard.service.js';
import * as exportacionService from '../services/exportacion.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendArchivo, sendSuccess } from '../utils/response.js';

export const resumen = asyncHandler(async (req, res) => {
  const datos = await dashboardService.obtenerResumen(req.validado.query);
  return sendSuccess(res, datos, 'Resumen del dashboard obtenido exitosamente.');
});

export const exportarPdf = asyncHandler(async (req, res) => {
  const archivo = await exportacionService.generarReporteDashboard({
    formato: 'pdf',
    filtros: req.validado.query,
  });
  return sendArchivo(res, archivo);
});

export const exportarExcel = asyncHandler(async (req, res) => {
  const archivo = await exportacionService.generarReporteDashboard({
    formato: 'excel',
    filtros: req.validado.query,
  });
  return sendArchivo(res, archivo);
});
