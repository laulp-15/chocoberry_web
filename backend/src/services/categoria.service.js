// src/services/categoria.service.js
// Reglas de negocio del módulo de categorías. Solo esta capa habla con los modelos.
import { ConflictError, NotFoundError } from '../errors/index.js';
import * as categoriaModel from '../models/categoria.model.js';
import { serializarCategoria } from '../utils/serializers.js';

export async function listar(filtros = {}) {
  const filas = await categoriaModel.listar({
    nombre: filtros.nombre,
    estado: filtros.estado,
  });
  return filas.map(serializarCategoria);
}

export async function obtener(id) {
  const categoria = await categoriaModel.buscarPorId(id);
  if (!categoria) throw new NotFoundError('Categoría no encontrada.');
  return serializarCategoria(categoria);
}

export async function crear(datos) {
  // La tabla no tiene UNIQUE sobre `nombre`, así que la unicidad se controla aquí.
  if (await categoriaModel.existeNombre(datos.nombre)) {
    throw new ConflictError(`Ya existe una categoría con el nombre "${datos.nombre}".`);
  }

  const id = await categoriaModel.crear({
    nombre: datos.nombre,
    estado: datos.estado ?? true,
  });

  return serializarCategoria(await categoriaModel.buscarPorId(id));
}

export async function actualizar(id, datos) {
  const actual = await categoriaModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Categoría no encontrada.');

  if (datos.nombre !== undefined && (await categoriaModel.existeNombre(datos.nombre, id))) {
    throw new ConflictError(`Ya existe otra categoría con el nombre "${datos.nombre}".`);
  }

  const campos = {};
  if (datos.nombre !== undefined) campos.nombre = datos.nombre;
  if (datos.estado !== undefined) campos.estado = datos.estado ? 1 : 0;

  return serializarCategoria(await categoriaModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await categoriaModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Categoría no encontrada.');

  return serializarCategoria(await categoriaModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await categoriaModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Categoría no encontrada.');

  // Regla de negocio: no se elimina una categoría que todavía tenga productos.
  const productos = await categoriaModel.contarProductos(id);
  if (productos > 0) {
    throw new ConflictError(
      `No se puede eliminar la categoría: tiene ${productos} producto(s) asociado(s). Reasígnalos o desactívala.`
    );
  }

  await categoriaModel.eliminar(id);
}
