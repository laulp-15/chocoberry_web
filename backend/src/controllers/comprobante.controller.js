// src/controllers/comprobante.controller.js
// Manejo de request/response de los comprobantes de pago. La subida llega como
// archivo multipart en el campo "comprobante".
import * as comprobanteService from '../services/comprobante.service.js';
import * as pedidoService from '../services/pedido.service.js';
import { rutaArchivoSubido } from '../middlewares/upload.js';
import { eliminarArchivoSubido } from '../utils/archivos.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const agregar = asyncHandler(async (req, res) => {
  const ruta = rutaArchivoSubido(req);
  let idPedido;

  try {
    idPedido = await comprobanteService.agregar(
      req.validado.params.id,
      ruta,
      req.usuario
    );
  } catch (error) {
    // Si el service rechaza la solicitud, no dejamos el archivo huérfano.
    await eliminarArchivoSubido(ruta);
    throw error;
  }

  const pedido = await pedidoService.obtener(idPedido, req.usuario);
  return sendCreated(res, pedido, 'Comprobante de pago agregado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  const idPedido = await comprobanteService.eliminar(
    req.validado.params.id,
    req.usuario
  );
  const pedido = await pedidoService.obtener(idPedido, req.usuario);
  return sendSuccess(res, pedido, 'Comprobante de pago eliminado exitosamente.');
});

export const aprobar = asyncHandler(async (req, res) => {
  const resultado = await comprobanteService.aprobar(
    req.validado.params.id,
    req.validado.body.monto
  );
  const pedido = await pedidoService.obtener(resultado.idPedido, req.usuario);

  return sendSuccess(
    res,
    { pedido, advertencia: resultado.advertencia },
    'Comprobante de pago aprobado exitosamente.'
  );
});

export const rechazar = asyncHandler(async (req, res) => {
  const resultado = await comprobanteService.rechazar(
    req.validado.params.id,
    req.validado.body.motivo,
    req.validado.body.monto
  );
  const pedido = await pedidoService.obtener(resultado.idPedido, req.usuario);
  return sendSuccess(res, pedido, 'Comprobante de pago rechazado exitosamente.');
});
