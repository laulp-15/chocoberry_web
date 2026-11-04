// src/services/catalogo.service.js
// Reglas de negocio del catálogo público. Combina el ranking real del Dashboard
// con los productos activos completos que consume la tienda.
import * as dashboardModel from '../models/dashboard.model.js';
import * as productoService from './producto.service.js';
import { ESTADOS_VENTA } from './venta.service.js';

const LIMITE_MAS_VENDIDOS = 4;

/**
 * Productos activos con más unidades vendidas, en el mismo orden del Dashboard.
 * Si no hay ventas reales devuelve una lista vacía.
 */
export async function listarMasVendidos() {
  const ranking = await dashboardModel.topProductos({
    estados: ESTADOS_VENTA,
    limite: LIMITE_MAS_VENDIDOS,
    soloActivos: true,
  });

  if (ranking.length === 0) return [];

  const productos = await productoService.listarPorIds(
    ranking.map((fila) => fila.id),
    { estado: true }
  );
  const porId = new Map(productos.map((producto) => [producto.id, producto]));

  return ranking.map((fila) => porId.get(fila.id)).filter(Boolean);
}
