// src/controllers/pedido.controller.js
// Manejo de request/response del módulo de pedidos. El comprobante y la
// evidencia llegan como archivos (multipart) y aquí se resuelve su ruta.
import * as pedidoService from '../services/pedido.service.js';
import { rutaArchivoSubido } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const listar = asyncHandler(async (req, res) => {
  const pedidos = await pedidoService.listar(req.validado.query, req.usuario);
  return sendSuccess(res, pedidos, 'Pedidos obtenidos exitosamente.');
});

export const listarMios = asyncHandler(async (req, res) => {
  const pedidos = await pedidoService.listar(req.validado.query, req.usuario, {
    soloPropios: true,
  });
  return sendSuccess(res, pedidos, 'Tus pedidos fueron obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.obtener(req.validado.params.id, req.usuario);
  return sendSuccess(res, pedido, 'Pedido obtenido exitosamente.');
});

export const obtenerMio = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.obtener(req.validado.params.id, req.usuario, {
    soloPropios: true,
  });
  return sendSuccess(res, pedido, 'Pedido obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.crear(
    req.validado.body,
    req.usuario,
    rutaArchivoSubido(req)
  );
  return sendCreated(res, pedido, 'Pedido creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.actualizar(
    req.validado.params.id,
    req.validado.body,
    req.usuario
  );
  return sendSuccess(res, pedido, 'Pedido actualizado exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, pedido, 'Estado del pedido actualizado exitosamente.');
});

export const rechazar = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.rechazar(req.validado.params.id, req.validado.body.motivo);
  return sendSuccess(res, pedido, 'Pedido rechazado exitosamente.');
});

export const registrarEntrega = asyncHandler(async (req, res) => {
  const pedido = await pedidoService.registrarEntrega(
    req.validado.params.id,
    req.validado.body,
    rutaArchivoSubido(req),
    req.usuario
  );
  return sendSuccess(res, pedido, 'Evidencia de entrega registrada exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await pedidoService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Pedido eliminado exitosamente.');
});
