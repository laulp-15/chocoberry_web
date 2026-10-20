// src/services/municipio.service.js
// Reglas de negocio de los municipios: CRUD del panel, lectura pública y
// resolución del municipio activo al crear/editar un pedido.
import { BadRequestError, ConflictError, NotFoundError } from '../errors/index.js';
import * as municipioModel from '../models/municipio.model.js';
import { serializarMunicipio } from '../utils/serializers.js';

/** El panel envía `costoEnvio`; la API acepta también los nombres del recurso. */
function resolverPrecio(datos) {
  return datos.precioDomicilio ?? datos.precio_domicilio ?? datos.costoEnvio;
}

export async function listar(filtros = {}) {
  const filas = await municipioModel.listar({
    nombre: filtros.nombre,
    estado: filtros.estado,
  });
  return filas.map(serializarMunicipio);
}

export async function obtener(id) {
  const municipio = await municipioModel.buscarPorId(id);
  if (!municipio) throw new NotFoundError('Municipio no encontrado.');
  return serializarMunicipio(municipio);
}

/**
 * Devuelve la fila cruda de un municipio activo. Se usa para congelar el
 * precio del domicilio en el pedido (`pedido.precio_domicilio` es histórico).
 */
export async function resolverActivo(id) {
  const municipio = await municipioModel.buscarPorId(id);
  if (!municipio || !municipio.estado) {
    throw new BadRequestError('El municipio seleccionado no existe o está inactivo.');
  }
  return municipio;
}

export async function crear(datos) {
  // La tabla no tiene UNIQUE sobre `nombre`, así que se controla aquí.
  if (await municipioModel.existeNombre(datos.nombre)) {
    throw new ConflictError(`Ya existe un municipio con el nombre "${datos.nombre}".`);
  }

  const id = await municipioModel.crear({
    nombre: datos.nombre,
    precio_domicilio: resolverPrecio(datos),
    estado: datos.estado ?? true,
  });

  return serializarMunicipio(await municipioModel.buscarPorId(id));
}

export async function actualizar(id, datos) {
  const actual = await municipioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Municipio no encontrado.');

  if (datos.nombre !== undefined && (await municipioModel.existeNombre(datos.nombre, id))) {
    throw new ConflictError(`Ya existe otro municipio con el nombre "${datos.nombre}".`);
  }

  const campos = {};
  if (datos.nombre !== undefined) campos.nombre = datos.nombre;

  const precio = resolverPrecio(datos);
  if (precio !== undefined) campos.precio_domicilio = precio;
  if (datos.estado !== undefined) campos.estado = datos.estado ? 1 : 0;

  return serializarMunicipio(await municipioModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await municipioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Municipio no encontrado.');

  return serializarMunicipio(await municipioModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await municipioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Municipio no encontrado.');

  // Regla de negocio: no se elimina un municipio que ya tenga pedidos.
  const pedidos = await municipioModel.contarPedidos(id);
  if (pedidos > 0) {
    throw new ConflictError(
      `No se puede eliminar el municipio: tiene ${pedidos} pedido(s) asociado(s). Desactívalo en su lugar.`
    );
  }

  await municipioModel.eliminar(id);
}
