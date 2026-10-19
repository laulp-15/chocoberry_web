// src/controllers/producto.controller.js
// Manejo de request/response del módulo de productos.
// La imagen puede llegar como archivo (multipart, campo "imagen") o como texto.
import * as productoService from '../services/producto.service.js';
import { rutaImagenSubida } from '../middlewares/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

/**
 * Combina el cuerpo validado con la imagen subida (si vino un archivo).
 * Cuando hay archivo, su ruta gana sobre cualquier texto enviado en `imagen`.
 */
function datosConImagen(req) {
  const imagen = rutaImagenSubida(req);
  return imagen === undefined ? req.validado.body : { ...req.validado.body, imagen };
}

export const listar = asyncHandler(async (req, res) => {
  const productos = await productoService.listar(req.validado.query);
  return sendSuccess(res, productos, 'Productos obtenidos exitosamente.');
});

export const obtener = asyncHandler(async (req, res) => {
  const producto = await productoService.obtener(req.validado.params.id);
  return sendSuccess(res, producto, 'Producto obtenido exitosamente.');
});

export const crear = asyncHandler(async (req, res) => {
  const producto = await productoService.crear(datosConImagen(req));
  return sendCreated(res, producto, 'Producto creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const producto = await productoService.actualizar(req.validado.params.id, datosConImagen(req));
  return sendSuccess(res, producto, 'Producto actualizado exitosamente.');
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const producto = await productoService.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado
  );
  return sendSuccess(res, producto, 'Estado del producto actualizado exitosamente.');
});

export const eliminar = asyncHandler(async (req, res) => {
  await productoService.eliminar(req.validado.params.id);
  return sendSuccess(res, null, 'Producto eliminado exitosamente.');
});
