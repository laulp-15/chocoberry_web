// src/services/presentacion.service.js
// Reglas de negocio de las presentaciones. Solo esta capa habla con los modelos.
import { ConflictError, NotFoundError } from '../errors/index.js';
import * as presentacionModel from '../models/presentacion.model.js';
import { serializarPresentacion } from '../utils/serializers.js';

export async function listar(filtros = {}) {
  const filas = await presentacionModel.listar({
    cantidadFresas: filtros.cantidadFresas ?? filtros.cantidad_fresas,
    estado: filtros.estado,
  });
  return filas.map(serializarPresentacion);
}

export async function obtener(id) {
  const presentacion = await presentacionModel.buscarPorId(id);
  if (!presentacion) throw new NotFoundError('Presentación no encontrada.');
  return serializarPresentacion(presentacion);
}

export async function crear(datos) {
  // La tabla no tiene UNIQUE sobre `cantidad_fresas`, así que se controla aquí:
  // dos presentaciones con la misma cantidad de fresas no tienen sentido.
  const existente = await presentacionModel.buscarPorCantidad(datos.cantidadFresas);
  if (existente) {
    throw new ConflictError(`Ya existe una presentación de ${datos.cantidadFresas} fresa(s).`);
  }

  const id = await presentacionModel.crear({
    cantidad_fresas: datos.cantidadFresas,
    precio: datos.precio,
    estado: datos.estado ?? true,
  });

  return serializarPresentacion(await presentacionModel.buscarPorId(id));
}

export async function actualizar(id, datos) {
  const actual = await presentacionModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Presentación no encontrada.');

  if (datos.cantidadFresas !== undefined && datos.cantidadFresas !== actual.cantidad_fresas) {
    const existente = await presentacionModel.buscarPorCantidad(datos.cantidadFresas);
    if (existente && existente.id !== actual.id) {
      throw new ConflictError(`Ya existe una presentación de ${datos.cantidadFresas} fresa(s).`);
    }
  }

  const campos = {};
  if (datos.cantidadFresas !== undefined) campos.cantidad_fresas = datos.cantidadFresas;
  if (datos.precio !== undefined) campos.precio = datos.precio;

  return serializarPresentacion(await presentacionModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await presentacionModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Presentación no encontrada.');

  return serializarPresentacion(await presentacionModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await presentacionModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Presentación no encontrada.');

  // Regla de negocio: no se elimina una presentación que ya haga parte de un pedido.
  const pedidos = await presentacionModel.contarEnPedidos(id);
  if (pedidos > 0) {
    throw new ConflictError(
      `No se puede eliminar la presentación: aparece en ${pedidos} línea(s) de pedido. Desactívala en su lugar.`
    );
  }

  await presentacionModel.eliminar(id);
}
