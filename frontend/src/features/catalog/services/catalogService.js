// src/features/catalog/services/catalogService.js
//
// Catálogo público de la tienda (no requiere sesión): productos y categorías
// activas, presentaciones con sus precios, municipios con su costo de envío y
// glaseados activos.
// Solo esta capa conoce las rutas de /api/catalogo.

import { api } from '../../../shared/api/client';
import {
  mapCategorias,
  mapGlaseados,
  mapMunicipios,
  mapPresentaciones,
  mapProducto,
  mapProductos,
} from './catalogMappers';

/** GET /catalogo/productos */
export async function listarProductos() {
  const productos = await api.get('/catalogo/productos', { auth: false });
  return mapProductos(productos);
}

/** GET /catalogo/productos/:id (404 si no existe o está inactivo). */
export async function obtenerProducto(id) {
  const producto = await api.get(`/catalogo/productos/${id}`, { auth: false });
  return mapProducto(producto);
}

/** GET /catalogo/categorias */
export async function listarCategorias() {
  const categorias = await api.get('/catalogo/categorias', { auth: false });
  return mapCategorias(categorias);
}

/** GET /catalogo/presentaciones */
export async function listarPresentaciones() {
  const presentaciones = await api.get('/catalogo/presentaciones', {
    auth: false,
  });
  return mapPresentaciones(presentaciones);
}

/** GET /catalogo/municipios (activos, con su costo de domicilio). */
export async function listarMunicipios() {
  const municipios = await api.get('/catalogo/municipios', { auth: false });
  return mapMunicipios(municipios);
}

/** GET /catalogo/glaseados (colores activos). */
export async function listarGlaseados() {
  const glaseados = await api.get('/catalogo/glaseados', { auth: false });
  return mapGlaseados(glaseados);
}
