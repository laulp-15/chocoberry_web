// src/controllers/catalogo.controller.js
// Lectura PÚBLICA del catálogo para la tienda (sin sesión). Solo datos activos.
import * as categoriaService from '../services/categoria.service.js';
import * as colorGlaseadoService from '../services/colorGlaseado.service.js';
import * as municipioService from '../services/municipio.service.js';
import * as presentacionService from '../services/presentacion.service.js';
import * as productoService from '../services/producto.service.js';
import * as resenaService from '../services/resena.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listarCategorias = asyncHandler(async (req, res) => {
  const categorias = await categoriaService.listar({ estado: true });
  return sendSuccess(res, categorias, 'Categorías del catálogo obtenidas exitosamente.');
});

export const listarPresentaciones = asyncHandler(async (req, res) => {
  const presentaciones = await presentacionService.listar({ estado: true });
  return sendSuccess(res, presentaciones, 'Presentaciones del catálogo obtenidas exitosamente.');
});

export const listarProductos = asyncHandler(async (req, res) => {
  // Se fuerza estado = true: la tienda nunca ve productos inactivos.
  const productos = await productoService.listar({ ...req.validado.query, estado: true });
  return sendSuccess(res, productos, 'Productos del catálogo obtenidos exitosamente.');
});

export const obtenerProducto = asyncHandler(async (req, res) => {
  const producto = await productoService.obtenerActivo(req.validado.params.id);
  return sendSuccess(res, producto, 'Producto del catálogo obtenido exitosamente.');
});

export const listarMunicipios = asyncHandler(async (req, res) => {
  // La tienda solo necesita los municipios activos (y su costo de domicilio).
  const municipios = await municipioService.listar({ estado: true });
  return sendSuccess(res, municipios, 'Municipios del catálogo obtenidos exitosamente.');
});

export const listarGlaseados = asyncHandler(async (req, res) => {
  // La tienda solo necesita los colores activos.
  const glaseados = await colorGlaseadoService.listar({ estado: true });
  return sendSuccess(res, glaseados, 'Glaseados del catálogo obtenidos exitosamente.');
});

export const listarResenas = asyncHandler(async (req, res) => {
  // La vista pública solo muestra reseñas activas.
  const resenas = await resenaService.listarPublicas(req.validado.query);
  return sendSuccess(res, resenas, 'Reseñas del catálogo obtenidas exitosamente.');
});
