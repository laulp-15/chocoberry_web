// src/models/pedido.model.js
// Acceso a la tabla `pedido` (cabecera) y creación transaccional con sus
// líneas (productoPedido). Los nombres de columnas siguen EXACTAMENTE la
// capitalización del script SQL.
import { query, withTransaction } from '../config/db.js';
import * as comprobantePagoModel from './comprobantePago.model.js';
import * as productoPedidoModel from './productoPedido.model.js';

// Columnas de cabecera que se pueden actualizar (lista blanca).
const CAMPOS_ACTUALIZABLES = [
  'mensaje_tarjeta',
  'fecha_entrega',
  'direccion',
  'barrio',
  'precio_domicilio',
  'nombre_receptor',
  'telefono_receptor',
  'instrucciones_entrega',
  'id_municipio',
];

// Columnas que gestiona el repartidor (evidencia de entrega).
const CAMPOS_ENTREGA = ['observaciones_entrega', 'evidencia_entrega'];

const SELECT_BASE = `SELECT p.*, e.nombre AS estado, m.nombre AS municipio,
                            u.nombres, u.apellidos, u.correo, u.telefono,
                            u.tipo_documento, u.numero_documento
                       FROM pedido p
                       JOIN estadosPedido e ON e.id = p.id_estado
                       JOIN municipio m ON m.id = p.id_municipio
                       JOIN usuario u ON u.id = p.id_usuario`;

/** Lista pedidos con filtros opcionales (todos aplicados con parámetros). */
export async function listar({
  estado,
  estados,
  idEstado,
  idMunicipio,
  idUsuario,
  cliente,
  fechaDesde,
  fechaHasta,
} = {}) {
  const where = [];
  const params = [];

  if (estado) {
    where.push('LOWER(e.nombre) = LOWER(?)');
    params.push(estado);
  }

  // Permite consultar un subconjunto de estados (ej. la vista de Ventas).
  if (Array.isArray(estados) && estados.length > 0) {
    const marcadores = estados.map(() => '?').join(', ');
    where.push(`e.nombre IN (${marcadores})`);
    params.push(...estados);
  }

  if (idEstado) {
    where.push('p.id_estado = ?');
    params.push(idEstado);
  }

  if (idMunicipio) {
    where.push('p.id_municipio = ?');
    params.push(idMunicipio);
  }

  if (idUsuario) {
    where.push('p.id_usuario = ?');
    params.push(idUsuario);
  }

  if (cliente) {
    const like = `%${cliente}%`;
    where.push(
      `(u.nombres LIKE ? OR u.apellidos LIKE ?
        OR CONCAT(u.nombres, ' ', u.apellidos) LIKE ?
        OR u.numero_documento LIKE ? OR u.correo LIKE ?)`
    );
    params.push(like, like, like, like, like);
  }

  if (fechaDesde) {
    where.push('p.fecha >= ?');
    params.push(`${fechaDesde} 00:00:00`);
  }

  if (fechaHasta) {
    where.push('p.fecha <= ?');
    params.push(`${fechaHasta} 23:59:59`);
  }

  // Orden de llegada: fecha de creación (no fecha_entrega). El id desempata
  // los pedidos creados dentro del mismo segundo.
  const sql = `${SELECT_BASE}${where.length ? ` WHERE ${where.join(' AND ')}` : ''}
               ORDER BY p.fecha DESC, p.id DESC`;
  return query(sql, params);
}

export async function buscarPorId(id) {
  const rows = await query(`${SELECT_BASE} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] ?? null;
}

/**
 * Inserta la cabecera, sus líneas y el comprobante inicial en una sola
 * transacción. Devuelve el id del pedido creado.
 */
export async function crearConLineas({ pedido, lineas, comprobante }) {
  return withTransaction(async (conexion) => {
    const [resultado] = await conexion.execute(
      `INSERT INTO pedido
         (mensaje_tarjeta, fecha_entrega, direccion, barrio, precio_domicilio,
          nombre_receptor, telefono_receptor, instrucciones_entrega,
          id_usuario, id_estado, id_municipio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido.mensaje_tarjeta ?? null,
        pedido.fecha_entrega,
        pedido.direccion,
        pedido.barrio,
        pedido.precio_domicilio,
        pedido.nombre_receptor,
        pedido.telefono_receptor,
        pedido.instrucciones_entrega ?? null,
        pedido.id_usuario,
        pedido.id_estado,
        pedido.id_municipio,
      ]
    );

    const idPedido = resultado.insertId;
    await productoPedidoModel.insertarLineas(conexion, idPedido, lineas);
    await comprobantePagoModel.crear(conexion, {
      url: comprobante.url,
      idPedido,
      idEstado: comprobante.id_estado,
    });
    return idPedido;
  });
}

/** Construye el SET dinámico de la cabecera con la lista blanca de columnas. */
function construirAsignaciones(campos) {
  const asignaciones = [];
  const valores = [];

  for (const columna of CAMPOS_ACTUALIZABLES) {
    if (campos[columna] !== undefined) {
      asignaciones.push(`${columna} = ?`);
      valores.push(campos[columna]);
    }
  }

  return { asignaciones, valores };
}

/** Actualiza solo las columnas de cabecera presentes en `campos`. */
export async function actualizar(id, campos) {
  const { asignaciones, valores } = construirAsignaciones(campos);

  if (asignaciones.length === 0) return buscarPorId(id);

  valores.push(id);
  await query(`UPDATE pedido SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/**
 * Actualiza la cabecera y reemplaza todas las líneas en una sola transacción.
 * Las líneas recibidas ya vienen validadas y con sus precios resueltos.
 */
export async function actualizarConLineas(id, campos, lineas) {
  return withTransaction(async (conexion) => {
    const { asignaciones, valores } = construirAsignaciones(campos);

    if (asignaciones.length > 0) {
      valores.push(id);
      await conexion.execute(
        `UPDATE pedido SET ${asignaciones.join(', ')} WHERE id = ?`,
        valores
      );
    }

    await productoPedidoModel.eliminarPorPedido(conexion, id);
    await productoPedidoModel.insertarLineas(conexion, id, lineas);

    return id;
  });
}

/** Actualiza la evidencia/observaciones de entrega. */
export async function actualizarEntrega(id, campos) {
  const asignaciones = [];
  const valores = [];

  for (const columna of CAMPOS_ENTREGA) {
    if (campos[columna] !== undefined) {
      asignaciones.push(`${columna} = ?`);
      valores.push(campos[columna]);
    }
  }

  if (asignaciones.length === 0) return buscarPorId(id);

  valores.push(id);
  await query(`UPDATE pedido SET ${asignaciones.join(', ')} WHERE id = ?`, valores);
  return buscarPorId(id);
}

/** Cambia el estado sin tocar el motivo de rechazo. */
export async function cambiarEstado(
  id,
  idEstado,
  { marcarCancelacion = false, observacionesEntrega = null } = {}
) {
  if (marcarCancelacion) {
    await query(
      'UPDATE pedido SET id_estado = ?, fecha_cancelacion = NOW(), observaciones_entrega = ? WHERE id = ?',
      [idEstado, observacionesEntrega, id]
    );
  } else {
    await query('UPDATE pedido SET id_estado = ? WHERE id = ?', [idEstado, id]);
  }
  return buscarPorId(id);
}

/** Actualiza la fecha de entrega y devuelve el pedido a Despachado. */
export async function reprogramarEntrega(id, fechaEntrega, idEstado) {
  await query(
    'UPDATE pedido SET fecha_entrega = ?, id_estado = ?, observaciones_entrega = NULL WHERE id = ?',
    [fechaEntrega, idEstado, id]
  );
  return buscarPorId(id);
}

/** Pasa el pedido a Rechazado y guarda el motivo. */
export async function rechazar(id, idEstado, motivo) {
  await query('UPDATE pedido SET id_estado = ?, motivo_rechazo = ? WHERE id = ?', [
    idEstado,
    motivo,
    id,
  ]);
  return buscarPorId(id);
}

/** Elimina la cabecera; las líneas se borran en cascada (FK). */
export async function eliminar(id) {
  await query('DELETE FROM pedido WHERE id = ?', [id]);
}
