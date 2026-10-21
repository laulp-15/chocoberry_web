// src/services/resena.service.js
// Reglas de negocio de las reseñas:
// - Son generales (sin producto ni pedido asociado).
// - El usuario, la fecha y el estado los define el servidor/BD.
// - La vista pública solo muestra reseñas activas.
import { NotFoundError } from '../errors/index.js';
import * as resenaModel from '../models/resena.model.js';
import { serializarResena } from '../utils/serializers.js';

/** Listado público: siempre filtra por estado activo. */
export async function listarPublicas(filtros = {}) {
  const filas = await resenaModel.listar({
    estado: true,
    calificacion: filtros.calificacion,
  });
  return filas.map(serializarResena);
}

/** Listado del panel: incluye activas e inactivas. */
export async function listar(filtros = {}) {
  const filas = await resenaModel.listar({
    estado: filtros.estado,
    calificacion: filtros.calificacion,
    cliente: filtros.cliente,
  });
  return filas.map(serializarResena);
}

export async function obtener(id) {
  const resena = await resenaModel.buscarPorId(id);
  if (!resena) throw new NotFoundError('Reseña no encontrada.');
  return serializarResena(resena);
}

/**
 * Crea una reseña a nombre del usuario autenticado. No se aceptan nombre,
 * fecha ni estado desde el cliente: esos valores los controla el servidor.
 */
export async function crear(datos, usuario) {
  const id = await resenaModel.crear({
    calificacion: datos.calificacion,
    comentario: datos.comentario,
    id_usuario: usuario.id,
  });

  return serializarResena(await resenaModel.buscarPorId(id));
}

export async function cambiarEstado(id, estado) {
  const actual = await resenaModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Reseña no encontrada.');

  return serializarResena(await resenaModel.cambiarEstado(id, estado));
}
