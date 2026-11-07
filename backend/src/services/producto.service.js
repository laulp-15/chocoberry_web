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
import {
  borrarImagenProducto,
  subirImagenProducto,
} from '../utils/cloudinaryStorage.js';
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
 * Resuelve la lista final de imágenes a partir de:
 * - `actuales`: imágenes que ya tiene el producto (edición).
 * - `subidas`: imágenes nuevas ya subidas a Cloudinary.
 * - `urls`: rutas enviadas como texto/JSON (sin public_id).
 * - `orden`: orden final. Cada elemento es una URL existente o `nueva:N`
 *   (la imagen N de `subidas`). Si no se envía, se conservan las actuales y
 *   se agregan las nuevas al final.
 */
function resolverImagenes({ actuales = [], subidas = [], urls = [], orden } = {}) {
  const nuevas = subidas.map((imagen) =>
    typeof imagen === 'string' ? { url: imagen, public_id: null } : imagen
  );
  const textos = urls.map((url) => ({ url, public_id: null }));
  const porUrl = new Map();

  for (const imagen of [...actuales, ...nuevas, ...textos]) {
    if (!porUrl.has(imagen.url)) porUrl.set(imagen.url, imagen);
  }

  let resultado;

  if (orden === undefined) {
    resultado = [...actuales, ...nuevas, ...textos];
  } else {
    resultado = [];

    for (const token of orden) {
      const valor = String(token ?? '').trim();
      if (!valor) continue;

      const nueva = /^nueva:(\d+)$/.exec(valor);
      if (nueva) {
        const indice = Number(nueva[1]);
        const imagen = nuevas[indice];
        if (!imagen) {
          throw new UnprocessableEntityError('Una de las imágenes nuevas no es válida.');
        }
        resultado.push(imagen);
        continue;
      }

      const imagen = porUrl.get(valor);
      if (!imagen) {
        throw new UnprocessableEntityError('Una de las imágenes indicadas no es válida.');
      }
      resultado.push(imagen);
    }
  }

  const urlsResultado = resultado.map((imagen) => imagen.url);
  if (new Set(urlsResultado).size !== urlsResultado.length) {
    throw new UnprocessableEntityError('No repitas la misma imagen en el producto.');
  }

  if (resultado.length === 0) {
    throw new UnprocessableEntityError('Debes subir al menos una imagen.');
  }

  if (resultado.length > MAX_IMAGENES) {
    throw new UnprocessableEntityError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
  }

  return resultado.map((imagen) => ({
    url: imagen.url,
    public_id: imagen.public_id ?? null,
  }));
}

async function borrarSubidasNoUsadas(subidas, finales) {
  const usadas = new Set(finales.map((imagen) => imagen.url));
  await Promise.all(
    subidas
      .filter((imagen) => !usadas.has(imagen.url))
      .map((imagen) => borrarImagenProducto(imagen.public_id))
  );
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

export async function listarPorIds(ids = [], filtros = {}) {
  const filas = await productoModel.listarPorIds(ids, { estado: filtros.estado });
  if (filas.length === 0) return [];

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
  const archivos = datos.imagenesArchivos ?? [];
  const subidas = [];
  let guardado = false;

  try {
    for (const archivo of archivos) {
      subidas.push(await subirImagenProducto(archivo));
    }

    const imagenes = resolverImagenes({
      subidas,
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
      imagenes
    );
    guardado = true;

    await borrarSubidasNoUsadas(subidas, imagenes);
    return await obtener(id);
  } catch (error) {
    if (!guardado) {
      await Promise.all(
        subidas.map((imagen) => borrarImagenProducto(imagen.public_id))
      );
    }
    throw error;
  }
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
  const archivos = datos.imagenesArchivos ?? [];
  const hayCambiosImagenes =
    datos.ordenImagenes !== undefined ||
    archivos.length > 0 ||
    (datos.imagenesUrl?.length ?? 0) > 0;

  const subidas = [];
  let guardado = false;

  try {
    for (const archivo of archivos) {
      subidas.push(await subirImagenProducto(archivo));
    }

    let imagenes;
    if (hayCambiosImagenes) {
      imagenes = resolverImagenes({
        actuales,
        subidas,
        urls: datos.imagenesUrl ?? [],
        orden: datos.ordenImagenes,
      });
    }

    const imagenesFinales =
      imagenes ?? actuales.map((imagen) => ({ url: imagen.url, public_id: imagen.public_id }));

    if (imagenesFinales.length === 0) {
      throw new UnprocessableEntityError('Debes subir al menos una imagen.');
    }

    if (imagenesFinales.length > MAX_IMAGENES) {
      throw new UnprocessableEntityError(`Puedes subir hasta ${MAX_IMAGENES} imágenes por producto.`);
    }

    await productoModel.actualizarConImagenes(id, campos, imagenes);
    guardado = true;

    // Borra de Cloudinary las imágenes que ya no pertenecen al producto.
    if (imagenes) {
      const conservadas = new Set(imagenes.map((imagen) => imagen.url));
      const eliminadas = actuales.filter((imagen) => !conservadas.has(imagen.url));

      for (const imagen of eliminadas) {
        await borrarImagenProducto(imagen.public_id);
      }
      await borrarSubidasNoUsadas(subidas, imagenes);
    }

    return await obtener(id);
  } catch (error) {
    if (!guardado) {
      await Promise.all(
        subidas.map((imagen) => borrarImagenProducto(imagen.public_id))
      );
    }
    throw error;
  }
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

  // La tabla hija se limpia con ON DELETE CASCADE; aquí se borran las imágenes
  // de Cloudinary. Las filas antiguas (public_id NULL) se omiten.
  for (const imagen of imagenes) await borrarImagenProducto(imagen.public_id);
}
