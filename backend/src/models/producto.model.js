// src/models/producto.model.js
// Acceso a la tabla `producto` (con la categoría asociada) y a sus imágenes.
import { query, withTransaction } from '../config/db.js';
import * as imagenProductoModel from './imagenProducto.model.js';

// Columnas que se pueden actualizar (lista blanca para evitar inyección).
const CAMPOS_ACTUALIZABLES = ['nombre', 'descripcion', 'estado', 'id_categoria'];

const SELECT_BASE = `SELECT p.id, p.nombre, p.descripcion, p.estado,
                            p.id_categoria, c.nombre AS categoria
                       FROM producto p
                       JOIN categoria c ON c.id = p.id_categoria`;

/** Lista productos con filtros opcionales: nombre, categoría (id o nombre) y estado. */
export async function listar({ nombre, idCategoria, categoria, estado } = {}) {
  const where = [];
  const params = [];

  if (nombre) {
    where.push('p.nombre LIKE ?');
    params.push(`%${nombre}%`);
  }

  if (idCategoria) {
    where.push('p.id_categoria = ?');
    params.push(idCategoria);
  } else if (categoria) {
    where.push('LOWER(c.nombre) = LOWER(?)');
    params.push(categoria);
  }

  if (estado !== undefined) {
    where.push('p.estado = ?');
    params.push(estado ? 1 : 0);
  }

  const sql = `${SELECT_BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY p.id DESC`;
  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/** ¿Existe un producto con ese nombre? Ignora `excluirId` (al editar). */
export async function existeNombre(nombre, excluirId = null) {
  const sql = excluirId
    ? 'SELECT id FROM producto WHERE LOWER(nombre) = LOWER(?) AND id <> ? LIMIT 1'
    : 'SELECT id FROM producto WHERE LOWER(nombre) = LOWER(?) LIMIT 1';
  const params = excluirId ? [nombre, excluirId] : [nombre];
  return (await query(sql, params)).length > 0;
}

/** Inserta la cabecera del producto usando una conexión de transacción. */
async function insertar(conexion, { nombre, descripcion, estado, id_categoria }) {
  const [resultado] = await conexion.execute(
    `INSERT INTO producto (nombre, descripcion, estado, id_categoria)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion ?? null, estado ? 1 : 0, id_categoria]
  );
  return resultado.insertId;
}

/**
 * Crea el producto y sus imágenes de forma atómica.
 * `imagenes` es un arreglo de `{ url }` en el orden final (1..4).
 */
export async function crearConImagenes(datos, imagenes = []) {
  return withTransaction(async (conexion) => {
    const id = await insertar(conexion, datos);
    await imagenProductoModel.reemplazar(conexion, id, imagenes);
    return id;
  });
}

/**
 * Actualiza solo las columnas presentes en `campos`. Si `imagenes` viene
 * definido, reemplaza la lista completa de imágenes; si es `undefined`, las
 * conserva tal cual.
 */
export async function actualizarConImagenes(id, campos, imagenes) {
  return withTransaction(async (conexion) => {
    const asignaciones = [];
    const valores = [];

    for (const columna of CAMPOS_ACTUALIZABLES) {
      if (campos[columna] !== undefined) {
        asignaciones.push(`${columna} = ?`);
        valores.push(campos[columna]);
      }
    }

    if (asignaciones.length > 0) {
      valores.push(id);
      await conexion.execute(
        `UPDATE producto SET ${asignaciones.join(', ')} WHERE id = ?`,
        valores
      );
    }

    if (imagenes !== undefined) {
      await imagenProductoModel.reemplazar(conexion, id, imagenes);
    }

    return id;
  });
}

/** Cambia el estado (activo/inactivo) de un producto. */
export async function cambiarEstado(id, estado) {
  await query('UPDATE producto SET estado = ? WHERE id = ?', [estado ? 1 : 0, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await query('DELETE FROM producto WHERE id = ?', [id]);
}

/** Cuenta las líneas de pedido del producto (para bloquear su eliminación). */
export async function contarEnPedidos(id) {
  const rows = await query('SELECT COUNT(*) AS total FROM productoPedido WHERE id_producto = ?', [id]);
  return rows[0]?.total ?? 0;
}
