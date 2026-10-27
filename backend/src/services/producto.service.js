// src/services/producto.service.js
// Reglas de negocio del módulo de productos. Solo esta capa habla con los modelos.
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../errors/index.js';
import * as categoriaModel from '../models/categoria.model.js';
import * as imagenProductoModel from '../models/imagenProducto.model.js';
import * as productoModel from '../models/producto.model.js';
import { eliminarArchivoSubido } from '../utils/archivos.js';
import { serializarProducto } from '../utils/serializers.js';

const limpiarVacio = (valor) => (valor === '' ? null : valor);

// Límite de imágenes por producto (coincide con el CHECK de la tabla).
const MAX_IMAGENES = 4;

/** Agrupa las filas de `imagenProducto` por producto. */
function agruparImagenes(filas = []) {
  const porProducto = new Map();

  for (const fila of filas) {
    if (!porProducto.has(fila.id_producto)) porProducto.set(fila.id_producto, []);
    porProducto.get(fila.id_producto).push(fila);
  }

  return porProducto;
}

/**
 * Resuelve la lista final de URLs de imágenes a partir de:
 * - `actuales`: imágenes que ya tiene el producto (edición).
 * - `subidas`: archivos nuevos, en el orden en que llegaron.
 * - `urls`: rutas enviadas como texto/JSON.
 * - `orden`: orden final. Cada elemento es una URL existente o `nueva:N`
 *   (el archivo N de `subidas`). Si no se envía, se conservan las actuales y
 *   se agregan las nuevas al final.
 */
function resolverImagenes({ actuales = [], subidas = [], urls = [], orden } = {}) {
  const existentes = new Set(actuales.map((imagen) => imagen.url));
  const disponibles = new Set([...existentes, ...subidas, ...urls]);

  let resultado;

  if (orden === undefined) {
    resultado = [...actuales.map((imagen) => imagen.url), ...subidas, ...urls];
  } else {
    resultado = [];

    for (const token of orden) {
      const valor = String(token ?? '').trim();
      if (!valor) continue;

      const nueva = /^nueva:(\d+)$/.exec(valor);
      if (nueva) {
        const indice = Number(nueva[1]);
        const url = subidas[indice];
        if (!url) {
          throw new UnprocessableEntityError('Una de las imágenes nuevas no es válida.');
        }
        resultado.push(url);
        continue;
      }

      if (!disponibles.has(valor)) {
        throw new UnprocessableEntityError('Una de las imágenes indicadas no es válida.');
      }
      resultado.push(valor);
    }
  }

  if (new Set(resultado).size !== resultado.length) {
    throw new UnprocessableEntityError('No repitas la misma imagen en el producto.');
  }

  if (resultado.length === 0) {
    throw new UnprocessableEntityError('Debes subir al menos una imagen.');
  }

  if (resultado.length > MAX_IMAGENES) {
    throw new UnprocessableEntityError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
  }

  return resultado;
}

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

  const imagenes = await imagenProductoModel.listarPorProductos(filas.map((fila) => fila.id));
  const porProducto = agruparImagenes(imagenes);

  return filas.map((fila) => serializarProducto(fila, porProducto.get(fila.id) ?? []));
}

export async function obtener(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto) throw new NotFoundError('Producto no encontrado.');

  const imagenes = await imagenProductoModel.listarPorProducto(id);
  return serializarProducto(producto, imagenes);
}

/** Igual que `obtener`, pero solo devuelve productos activos (catálogo público). */
export async function obtenerActivo(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto || !producto.estado) throw new NotFoundError('Producto no encontrado.');

  const imagenes = await imagenProductoModel.listarPorProducto(id);
  return serializarProducto(producto, imagenes);
}

export async function crear(datos) {
  // La tabla no tiene UNIQUE sobre `nombre`, así que la unicidad se controla aquí.
  if (await productoModel.existeNombre(datos.nombre)) {
    throw new ConflictError(`Ya existe un producto con el nombre "${datos.nombre}".`);
  }

  const id_categoria = await resolverCategoria(datos);

  const imagenes = resolverImagenes({
    subidas: datos.imagenesSubidas ?? [],
    urls: datos.imagenesUrl ?? [],
    orden: datos.ordenImagenes,
  });

  const id = await productoModel.crearConImagenes(
    {
      nombre: datos.nombre,
      descripcion: limpiarVacio(datos.descripcion),
      estado: datos.estado ?? true,
      id_categoria,
    },
    imagenes.map((url) => ({ url }))
  );

  return obtener(id);
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
  if (datos.idCategoria !== undefined || datos.id_categoria !== undefined || datos.categoria !== undefined) {
    campos.id_categoria = await resolverCategoria(datos);
  }

  const actuales = await imagenProductoModel.listarPorProducto(id);
  const hayCambiosImagenes =
    datos.ordenImagenes !== undefined ||
    (datos.imagenesSubidas?.length ?? 0) > 0 ||
    (datos.imagenesUrl?.length ?? 0) > 0;

  let imagenes;
  if (hayCambiosImagenes) {
    imagenes = resolverImagenes({
      actuales,
      subidas: datos.imagenesSubidas ?? [],
      urls: datos.imagenesUrl ?? [],
      orden: datos.ordenImagenes,
    });
  }

  const imagenesFinales = imagenes ?? actuales.map((imagen) => imagen.url);

  if (imagenesFinales.length === 0) {
    throw new UnprocessableEntityError('Debes subir al menos una imagen.');
  }

  if (imagenesFinales.length > MAX_IMAGENES) {
    throw new UnprocessableEntityError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
  }

  await productoModel.actualizarConImagenes(
    id,
    campos,
    imagenes ? imagenes.map((url) => ({ url })) : undefined
  );

  // Borra del disco las imágenes que ya no pertenecen al producto.
  if (imagenes) {
    const conservadas = new Set(imagenes);
    const eliminadas = actuales
      .map((imagen) => imagen.url)
      .filter((url) => !conservadas.has(url));

    for (const url of eliminadas) await eliminarArchivoSubido(url);
  }

  return obtener(id);
}

export async function cambiarEstado(id, estado) {
  const actual = await productoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Producto no encontrado.');

  const actualizado = await productoModel.cambiarEstado(id, estado);
  const imagenes = await imagenProductoModel.listarPorProducto(id);
  return serializarProducto(actualizado, imagenes);
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

  const imagenes = await imagenProductoModel.listarPorProducto(id);
  await productoModel.eliminar(id);

  // La tabla hija se limpia con ON DELETE CASCADE; aquí se borran los archivos.
  for (const imagen of imagenes) await eliminarArchivoSubido(imagen.url);
}
