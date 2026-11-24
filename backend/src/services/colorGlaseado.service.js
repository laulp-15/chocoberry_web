// src/services/colorGlaseado.service.js
// Reglas de negocio de los glaseados: CRUD del panel, lectura pública y
// resolución del color activo al crear un pedido.
import { BadRequestError, ConflictError, NotFoundError } from '../errors/index.js';
import * as colorGlaseadoModel from '../models/colorGlaseado.model.js';
import { construirMeta, leerPaginacion } from '../utils/paginacion.js';
import { serializarColorGlaseado } from '../utils/serializers.js';

/** El panel envía `hex`; la API acepta también los nombres del recurso. */
function resolverCodigoHex(datos) {
  return datos.codigoHex ?? datos.codigo_hex ?? datos.hex;
}

export async function listar(filtros = {}) {
  const paginacion = leerPaginacion(filtros);
  const filtrosBase = {
    nombre: filtros.nombre,
    estado: filtros.estado,
  };

  let filas;
  let total = null;

  if (paginacion.paginado) {
    [filas, total] = await Promise.all([
      colorGlaseadoModel.listar({
        ...filtrosBase,
        page: paginacion.page,
        limit: paginacion.limit,
      }),
      colorGlaseadoModel.contar(filtrosBase),
    ]);
  } else {
    filas = await colorGlaseadoModel.listar(filtrosBase);
  }

  const data = filas.map(serializarColorGlaseado);

  if (!paginacion.paginado) return data;

  return {
    data,
    meta: construirMeta({
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    }),
  };
}

export async function obtener(id) {
  const color = await colorGlaseadoModel.buscarPorId(id);
  if (!color) throw new NotFoundError('Color de glaseado no encontrado.');
  return serializarColorGlaseado(color);
}

/** Devuelve la fila cruda de un color activo (para las líneas del pedido). */
export async function resolverActivo(id) {
  const color = await colorGlaseadoModel.buscarPorId(id);
  if (!color || !color.estado) {
    throw new BadRequestError('El color de glaseado seleccionado no existe o está inactivo.');
  }
  return color;
}

export async function crear(datos) {
  // La tabla tiene UNIQUE, pero se valida aquí para dar un mensaje claro.
  if (await colorGlaseadoModel.existeNombre(datos.nombre)) {
    throw new ConflictError(`Ya existe un glaseado con el nombre "${datos.nombre}".`);
  }

  const id = await colorGlaseadoModel.crear({
    nombre: datos.nombre,
    codigo_hex: resolverCodigoHex(datos),
    estado: datos.estado ?? true,
  });

  return serializarColorGlaseado(await colorGlaseadoModel.buscarPorId(id));
}

export async function actualizar(id, datos) {
  const actual = await colorGlaseadoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Color de glaseado no encontrado.');

  if (datos.nombre !== undefined && (await colorGlaseadoModel.existeNombre(datos.nombre, id))) {
    throw new ConflictError(`Ya existe otro glaseado con el nombre "${datos.nombre}".`);
  }

  const campos = {};
  if (datos.nombre !== undefined) campos.nombre = datos.nombre;

  const codigoHex = resolverCodigoHex(datos);
  if (codigoHex !== undefined) campos.codigo_hex = codigoHex;

  return serializarColorGlaseado(await colorGlaseadoModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await colorGlaseadoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Color de glaseado no encontrado.');

  return serializarColorGlaseado(await colorGlaseadoModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await colorGlaseadoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Color de glaseado no encontrado.');

  // Regla de negocio: no se elimina un color que ya use una línea de pedido.
  const lineas = await colorGlaseadoModel.contarEnPedidos(id);
  if (lineas > 0) {
    throw new ConflictError(
      `No se puede eliminar el glaseado: aparece en ${lineas} línea(s) de pedido. Desactívalo en su lugar.`
    );
  }

  await colorGlaseadoModel.eliminar(id);
}
