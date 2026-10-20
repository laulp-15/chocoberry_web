// src/services/pedido.service.js
// Reglas de negocio del módulo de pedidos: cálculo de precios en el servidor,
// transiciones de estado y alcance por rol (cada cliente solo ve lo suyo).
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
} from '../errors/index.js';
import * as colorGlaseadoModel from '../models/colorGlaseado.model.js';
import * as estadoPedidoModel from '../models/estadoPedido.model.js';
import * as pedidoModel from '../models/pedido.model.js';
import * as presentacionModel from '../models/presentacion.model.js';
import * as productoModel from '../models/producto.model.js';
import * as productoPedidoModel from '../models/productoPedido.model.js';
import * as usuarioModel from '../models/usuario.model.js';
import * as municipioService from './municipio.service.js';
import { redondear2 } from '../utils/number.js';
import { serializarPedido } from '../utils/serializers.js';

const ROL_CLIENTE = 'Cliente';
const ROL_REPARTIDOR = 'Repartidor';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_DESPACHADO = 'Despachado';
const ESTADO_ENTREGADO = 'Entregado';

// Transiciones permitidas. Los estados que no aparecen (Entregado, Rechazado,
// Cancelado) son finales: no se puede salir de ellos.
const TRANSICIONES = {
  [ESTADO_PENDIENTE]: ['En preparación', ESTADO_RECHAZADO],
  'En preparación': [ESTADO_DESPACHADO],
  [ESTADO_DESPACHADO]: [ESTADO_ENTREGADO, 'Cancelado'],
  [ESTADO_ENTREGADO]: [],
  [ESTADO_RECHAZADO]: [],
  Cancelado: [],
};

// El front usa slugs ("en_preparacion"); la BD usa nombres con tilde.
const ALIAS_ESTADOS = {
  pendiente: ESTADO_PENDIENTE,
  'en preparacion': 'En preparación',
  despachado: ESTADO_DESPACHADO,
  rechazado: ESTADO_RECHAZADO,
  entregado: ESTADO_ENTREGADO,
  cancelado: 'Cancelado',
};

/** Normaliza un nombre/slug de estado al nombre canónico de la BD. */
function normalizarEstado(valor) {
  const clave = String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  return ALIAS_ESTADOS[clave] ?? null;
}

function esRol(usuario, rol) {
  return String(usuario?.nombre_rol ?? '').trim().toLowerCase() === rol.toLowerCase();
}

function limpiarTexto(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  return texto === '' ? null : texto;
}

/** La fecha de entrega se guarda a las 00:00 (el checkout solo pide el día). */
function normalizarFechaEntrega(fecha) {
  return `${fecha} 00:00:00`;
}

async function resolverEstado(nombre) {
  const canonico = normalizarEstado(nombre);
  if (!canonico) {
    throw new UnprocessableEntityError(`Estado no válido: "${nombre}".`);
  }

  const estado = await estadoPedidoModel.buscarPorNombre(canonico);
  if (!estado) {
    throw new AppError(`El estado "${canonico}" no está configurado en la base de datos.`, 500);
  }
  return estado;
}

/** Carga el pedido y su estado actual, o responde 404/500. */
async function cargarPedidoYEstado(id) {
  const pedido = await pedidoModel.buscarPorId(id);
  if (!pedido) throw new NotFoundError('Pedido no encontrado.');

  const estado = await estadoPedidoModel.buscarPorId(pedido.id_estado);
  if (!estado) {
    throw new AppError('El pedido tiene un estado inexistente en la base de datos.', 500);
  }
  return { pedido, estado };
}

async function obtenerPedidoCompleto(id) {
  const fila = await pedidoModel.buscarPorId(id);
  if (!fila) return null;

  const lineas = await productoPedidoModel.listarPorPedido(id);
  return serializarPedido(fila, lineas);
}

function agruparLineas(filas) {
  const mapa = new Map();
  for (const fila of filas) {
    if (!mapa.has(fila.id_pedido)) mapa.set(fila.id_pedido, []);
    mapa.get(fila.id_pedido).push(fila);
  }
  return mapa;
}

/**
 * Lista pedidos. Un cliente SIEMPRE queda limitado a los propios; `soloPropios`
 * fuerza ese alcance incluso para el personal ("Mis pedidos").
 */
export async function listar(filtros = {}, usuario, { soloPropios = false } = {}) {
  let estado;
  if (filtros.estado) {
    estado = normalizarEstado(filtros.estado);
    if (!estado) {
      throw new UnprocessableEntityError(`Estado no válido para filtrar: "${filtros.estado}".`);
    }
  }

  const limitarAlPropio = soloPropios || esRol(usuario, ROL_CLIENTE);
  const idUsuario = limitarAlPropio ? usuario.id : filtros.idUsuario;

  const filas = await pedidoModel.listar({
    estado,
    idEstado: filtros.idEstado,
    idMunicipio: filtros.idMunicipio,
    idUsuario,
    cliente: filtros.cliente,
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
  });

  if (filas.length === 0) return [];

  const lineas = await productoPedidoModel.listarPorPedidos(filas.map((fila) => fila.id));
  const mapa = agruparLineas(lineas);
  return filas.map((fila) => serializarPedido(fila, mapa.get(fila.id) ?? []));
}

export async function obtener(id, usuario, { soloPropios = false } = {}) {
  const pedido = await obtenerPedidoCompleto(id);
  if (!pedido) throw new NotFoundError('Pedido no encontrado.');

  if ((soloPropios || esRol(usuario, ROL_CLIENTE)) && pedido.cliente.id !== usuario.id) {
    // Se responde 404 (no 403) para no revelar pedidos de otros clientes.
    throw new NotFoundError('Pedido no encontrado.');
  }

  return pedido;
}

/** Un cliente solo puede crear pedidos a su nombre; el admin puede elegir. */
async function resolverUsuarioPedido(idUsuario, usuario) {
  if (esRol(usuario, ROL_CLIENTE) || !idUsuario) return usuario.id;

  const cliente = await usuarioModel.buscarPorId(idUsuario);
  if (!cliente || !cliente.estado) {
    throw new BadRequestError('El usuario indicado no existe o está inactivo.');
  }
  return cliente.id;
}

/** Valida cada línea y calcula los precios históricos con datos de la BD. */
async function prepararLineas(lineas) {
  const preparadas = [];

  for (const [indice, linea] of lineas.entries()) {
    const numero = indice + 1;

    const producto = await productoModel.buscarPorId(linea.idProducto);
    if (!producto || !producto.estado) {
      throw new BadRequestError(`Línea ${numero}: el producto no existe o está inactivo.`);
    }

    const presentacion = await presentacionModel.buscarPorId(linea.idPresentacion);
    if (!presentacion || !presentacion.estado) {
      throw new BadRequestError(`Línea ${numero}: la presentación no existe o está inactiva.`);
    }

    const color = await colorGlaseadoModel.buscarPorId(linea.idColorGlaseado);
    if (!color || !color.estado) {
      throw new BadRequestError(`Línea ${numero}: el color de glaseado no existe o está inactivo.`);
    }

    const mensaje = limpiarTexto(linea.mensajePersonalizado);
    const fresas = Number(presentacion.cantidad_fresas);
    const caracteres = mensaje ? Array.from(mensaje).length : 0;

    // Regla de las letras de chocolate: una letra por fresa de la caja.
    if (mensaje && caracteres > fresas) {
      throw new UnprocessableEntityError(
        `Línea ${numero}: el mensaje personalizado tiene ${caracteres} caracteres y la presentación solo admite ${fresas} (una letra de chocolate por fresa).`,
        [
          {
            campo: `lineas.${indice}.mensajePersonalizado`,
            mensaje: `Máximo ${fresas} caracteres para esta presentación.`,
          },
        ]
      );
    }

    const precioUnitario = redondear2(presentacion.precio);
    const cantidad = linea.cantidadProductos;

    preparadas.push({
      id_producto: producto.id,
      id_presentacion: presentacion.id,
      cantidad_productos: cantidad,
      precio_unitario: precioUnitario,
      subtotal: redondear2(precioUnitario * cantidad),
      mensaje_personalizado: mensaje,
      id_color_glaseado: color.id,
      personalizacion_adicional: limpiarTexto(linea.personalizacionAdicional),
    });
  }

  return preparadas;
}

export async function crear(datos, usuario, comprobante) {
  if (!comprobante) {
    throw new UnprocessableEntityError('El comprobante de pago es obligatorio.');
  }

  const idUsuario = await resolverUsuarioPedido(datos.idUsuario, usuario);
  const municipio = await municipioService.resolverActivo(datos.idMunicipio);
  const estado = await resolverEstado(ESTADO_PENDIENTE);
  const lineas = await prepararLineas(datos.lineas);

  const id = await pedidoModel.crearConLineas({
    pedido: {
      mensaje_tarjeta: limpiarTexto(datos.mensajeTarjeta),
      fecha_entrega: normalizarFechaEntrega(datos.fechaEntrega),
      direccion: datos.direccion,
      barrio: datos.barrio,
      // Snapshot: si el municipio cambia de precio, el pedido conserva el suyo.
      precio_domicilio: redondear2(municipio.precio_domicilio),
      nombre_receptor: datos.nombreReceptor,
      telefono_receptor: datos.telefonoReceptor,
      comprobante_pago: comprobante,
      instrucciones_entrega: limpiarTexto(datos.instruccionesEntrega),
      id_usuario: idUsuario,
      id_estado: estado.id,
      id_municipio: municipio.id,
    },
    lineas,
  });

  return obtenerPedidoCompleto(id);
}

/** Edita solo la cabecera (las líneas no se modifican). */
export async function actualizar(id, datos, usuario) {
  if (esRol(usuario, ROL_REPARTIDOR)) {
    throw new ForbiddenError('El repartidor solo puede registrar la evidencia de entrega.');
  }

  const actual = await pedidoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Pedido no encontrado.');

  const campos = {};

  if (datos.mensajeTarjeta !== undefined) campos.mensaje_tarjeta = limpiarTexto(datos.mensajeTarjeta);
  if (datos.fechaEntrega !== undefined) campos.fecha_entrega = normalizarFechaEntrega(datos.fechaEntrega);
  if (datos.direccion !== undefined) campos.direccion = datos.direccion;
  if (datos.barrio !== undefined) campos.barrio = datos.barrio;
  if (datos.nombreReceptor !== undefined) campos.nombre_receptor = datos.nombreReceptor;
  if (datos.telefonoReceptor !== undefined) campos.telefono_receptor = datos.telefonoReceptor;
  if (datos.instruccionesEntrega !== undefined) {
    campos.instrucciones_entrega = limpiarTexto(datos.instruccionesEntrega);
  }

  if (datos.idMunicipio !== undefined) {
    const municipio = await municipioService.resolverActivo(datos.idMunicipio);
    campos.id_municipio = municipio.id;
    campos.precio_domicilio = redondear2(municipio.precio_domicilio);
  }

  await pedidoModel.actualizar(id, campos);
  return obtenerPedidoCompleto(id);
}

export async function cambiarEstado(id, nombreEstado) {
  const { estado: estadoActual } = await cargarPedidoYEstado(id);

  const destino = normalizarEstado(nombreEstado);
  if (!destino) {
    throw new UnprocessableEntityError(`Estado no válido: "${nombreEstado}".`);
  }

  if (destino === ESTADO_RECHAZADO) {
    throw new UnprocessableEntityError(
      'Para rechazar un pedido usa el endpoint de rechazo e indica el motivo.'
    );
  }

  const permitidos = TRANSICIONES[estadoActual.nombre] ?? [];
  if (!permitidos.includes(destino)) {
    const detalle = permitidos.length
      ? `Desde "${estadoActual.nombre}" solo se puede pasar a: ${permitidos.join(', ')}.`
      : `"${estadoActual.nombre}" es un estado final.`;
    throw new ConflictError(
      `No se puede cambiar el estado de "${estadoActual.nombre}" a "${destino}". ${detalle}`
    );
  }

  const estado = await resolverEstado(destino);
  await pedidoModel.cambiarEstado(id, estado.id);
  return obtenerPedidoCompleto(id);
}

export async function rechazar(id, motivo) {
  const { estado } = await cargarPedidoYEstado(id);

  if (estado.nombre !== ESTADO_PENDIENTE) {
    throw new ConflictError(
      `Solo se puede rechazar un pedido en estado "${ESTADO_PENDIENTE}".`
    );
  }

  const estadoRechazado = await resolverEstado(ESTADO_RECHAZADO);
  await pedidoModel.rechazar(id, estadoRechazado.id, motivo.trim());
  return obtenerPedidoCompleto(id);
}

/** El repartidor registra la evidencia sin cambiar el estado del pedido. */
export async function registrarEntrega(id, datos, evidencia, usuario) {
  if (!esRol(usuario, ROL_REPARTIDOR)) {
    throw new ForbiddenError('Solo el repartidor puede registrar la evidencia de entrega.');
  }

  const { pedido, estado } = await cargarPedidoYEstado(id);

  if (![ESTADO_DESPACHADO, ESTADO_ENTREGADO].includes(estado.nombre)) {
    throw new ConflictError(
      'Solo se registra la evidencia de entrega cuando el pedido está Despachado o Entregado.'
    );
  }

  if (!evidencia && !pedido.evidencia_entrega) {
    throw new UnprocessableEntityError('La evidencia fotográfica de la entrega es obligatoria.');
  }

  const campos = {};
  if (evidencia) campos.evidencia_entrega = evidencia;
  if (datos.observacionesEntrega !== undefined) {
    campos.observaciones_entrega = limpiarTexto(datos.observacionesEntrega);
  }

  await pedidoModel.actualizarEntrega(id, campos);
  return obtenerPedidoCompleto(id);
}

export async function eliminar(id) {
  const actual = await pedidoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Pedido no encontrado.');

  // Las líneas se eliminan en cascada (FK productoPedido.id_pedido).
  await pedidoModel.eliminar(id);
}
