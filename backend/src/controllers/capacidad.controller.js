// src/controllers/capacidad.controller.js
// Manejo de request/response del módulo de capacidad diaria.
import * as capacidadService from '../services/capacidad.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listarMes = asyncHandler(async (req, res) => {
  const capacidad = await capacidadService.listarMes(req.validado.query.mes);
  return sendSuccess(res, capacidad, 'Capacidad del mes obtenida exitosamente.');
});

export const obtenerDia = asyncHandler(async (req, res) => {
  const dia = await capacidadService.obtenerDia(req.validado.params.fecha);
  return sendSuccess(res, dia, 'Capacidad del día obtenida exitosamente.');
});

export const obtenerEstandar = asyncHandler(async (req, res) => {
  const tope = await capacidadService.obtenerTopeEstandar();
  return sendSuccess(res, tope, 'Tope estándar obtenido exitosamente.');
});

export const actualizarEstandar = asyncHandler(async (req, res) => {
  const tope = await capacidadService.actualizarTopeEstandar(
    req.validado.body.maxFresas
  );
  return sendSuccess(res, tope, 'Tope estándar actualizado exitosamente.');
});

export const actualizarDia = asyncHandler(async (req, res) => {
  const dia = await capacidadService.establecerTopeDia(
    req.validado.params.fecha,
    req.validado.body.maxFresas
  );
  return sendSuccess(res, dia, 'Tope del día actualizado exitosamente.');
});

export const bloquearDia = asyncHandler(async (req, res) => {
  const dia = await capacidadService.bloquearDia(req.validado.params.fecha);
  return sendSuccess(res, dia, 'Día bloqueado exitosamente.');
});

export const restablecerDia = asyncHandler(async (req, res) => {
  const dia = await capacidadService.restablecerDia(req.validado.params.fecha);
  return sendSuccess(res, dia, 'Día restablecido al tope estándar exitosamente.');
});
