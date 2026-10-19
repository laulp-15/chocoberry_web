// src/services/producto.service.js
// Reglas de negocio del módulo de productos. Solo esta capa habla con los modelos.
import { BadRequestError, ConflictError, NotFoundError } from '../errors/index.js';
import * as categoriaModel from '../models/categoria.model.js';
import * as productoModel from '../models/producto.model.js';
import { serializarProducto } from '../utils/serializers.js';

const limpiarVacio = (valor) => (valor === '' ? null : valor);

/**
 * Resuelve la categoría del producto. Acepta el id (`idCategoria` / `id_categoria`)
 * o el nombre (`categoria`) y devuelve siempre el id.
 */
async function resolverCategoria(datos) {
  const valor = datos.idCategoria ?? datos.id_categoria ?? datos.categoria;

  if (valor === undefined || valor === null || valor === '') {
    throw new BadRequestError('La categoría es obligatoria.');
  }

  const esId = typeof valor === 'number' || /^\d+$/.test(String(valor).trim());
  const categoria = esId
    ? await categoriaModel.buscarPorId(Number(valor))
    : await categoriaModel.buscarPorNombre(valor);

  if (!categoria) throw new BadRequestError(`La categoría "${valor}" no existe.`);
  return categoria.id;
}

export async function listar(filtros = {}) {
  const filas = await productoModel.listar({
    nombre: filtros.nombre,
    idCategoria: filtros.idCategoria ?? filtros.id_categoria,
    categoria: filtros.categoria,
    estado: filtros.estado,
  });
  return filas.map(serializarProducto);
}

export async function obtener(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto) throw new NotFoundError('Producto no encontrado.');
  return serializarProducto(producto);
}

/** Igual que `obtener`, pero solo devuelve productos activos (catálogo público). */
export async function obtenerActivo(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto || !producto.estado) throw new NotFoundError('Producto no encontrado.');
  return serializarProducto(producto);
}

export async function crear(datos) {
  // La tabla no tiene UNIQUE sobre `nombre`, así que la unicidad se controla aquí.
  if (await productoModel.existeNombre(datos.nombre)) {
    throw new ConflictError(`Ya existe un producto con el nombre "${datos.nombre}".`);
  }

  const id_categoria = await resolverCategoria(datos);

  const id = await productoModel.crear({
    nombre: datos.nombre,
    descripcion: limpiarVacio(datos.descripcion),
    imagen: limpiarVacio(datos.imagen),
    estado: datos.estado ?? true,
    id_categoria,
  });

  return serializarProducto(await productoModel.buscarPorId(id));
}

export async function actualizar(id, datos) {
  const actual = await productoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Producto no encontrado.');

  if (datos.nombre !== undefined && (await productoModel.existeNombre(datos.nombre, id))) {
    throw new ConflictError(`Ya existe otro producto con el nombre "${datos.nombre}".`);
  }

  const campos = {};
  if (datos.nombre !== undefined) campos.nombre = datos.nombre;
  if (datos.descripcion !== undefined) campos.descripcion = limpiarVacio(datos.descripcion);
  if (datos.imagen !== undefined) campos.imagen = limpiarVacio(datos.imagen);
  if (datos.estado !== undefined) campos.estado = datos.estado ? 1 : 0;
  if (datos.idCategoria !== undefined || datos.id_categoria !== undefined || datos.categoria !== undefined) {
    campos.id_categoria = await resolverCategoria(datos);
  }

  return serializarProducto(await productoModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await productoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Producto no encontrado.');

  return serializarProducto(await productoModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await productoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Producto no encontrado.');

  // Regla de negocio: no se elimina un producto que ya haga parte de un pedido.
  const pedidos = await productoModel.contarEnPedidos(id);
  if (pedidos > 0) {
    throw new ConflictError(
      `No se puede eliminar el producto: aparece en ${pedidos} línea(s) de pedido. Desactívalo en su lugar.`
    );
  }

  await productoModel.eliminar(id);
}
