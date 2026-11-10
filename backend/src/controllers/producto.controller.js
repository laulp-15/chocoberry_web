// src/controllers/producto.controller.js
// Manejo de request/response del módulo de productos.
// Las imágenes pueden llegar como archivos (multipart, campo "imagenes") o como
// rutas/URLs de texto en el cuerpo (`imagenesUrl` y el antiguo `imagen`).
import * as productoService from '../services/producto.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

/**
 * Combina el cuerpo validado con las imágenes subidas. El antiguo campo
 * `imagen` se trata como una ruta más para no romper clientes anteriores.
 */
function datosConImagenes(req) {
  const body = req.validado.body;
  const imagenesArchivos = req.files ?? [];
  const imagenesUrl = [...(body.imagenesUrl ?? [])];

  if (body.imagen) imagenesUrl.push(body.imagen);

  return { ...body, imagenesArchivos, imagenesUrl };
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
  const producto = await productoService.crear(datosConImagenes(req));
  return sendCreated(res, producto, 'Producto creado exitosamente.');
});

export const actualizar = asyncHandler(async (req, res) => {
  const producto = await productoService.actualizar(
    req.validado.params.id,
    datosConImagenes(req)
  );
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
