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
import * as comprobantePagoModel from '../models/comprobantePago.model.js';
import * as estadoComprobanteModel from '../models/estadoComprobante.model.js';
import * as estadoPedidoModel from '../models/estadoPedido.model.js';
import * as pedidoModel from '../models/pedido.model.js';
import * as presentacionModel from '../models/presentacion.model.js';
import * as productoModel from '../models/producto.model.js';
import * as productoPedidoModel from '../models/productoPedido.model.js';
import * as usuarioModel from '../models/usuario.model.js';
import * as municipioService from './municipio.service.js';
import { eliminarArchivoSubido } from '../utils/archivos.js';
import { redondear2 } from '../utils/number.js';
import {
  fechaActualLocal,
  formatearFecha,
  parseFecha,
  sumarDias,
} from '../utils/dates.js';
import { serializarPedido } from '../utils/serializers.js';

const ROL_CLIENTE = 'Cliente';
const ROL_REPARTIDOR = 'Repartidor';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_DESPACHADO = 'Despachado';
const ESTADO_ENTREGADO = 'Entregado';
const ESTADO_CANCELADO = 'Cancelado';

const VENTANA_REPROGRAMACION_MS = 2 * 24 * 60 * 60 * 1000;

// Reglas de volumen de la tienda. El panel queda exento del tope total para
// poder registrar los pedidos grandes que llegan por teléfono.
const MAX_UNIDADES_POR_PEDIDO = 20;
const UMBRAL_PEDIDO_GRANDE = 10;
const TELEFONO_PEDIDOS_GRANDES = '317 217 5887';

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

/** Convierte un Date de MySQL o un texto a `YYYY-MM-DD`; null si no hay. */
function fechaISO(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);

  const anio = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** `Date` UTC -> `DD/MM/YYYY` para los mensajes de validación. */
function fechaCorta(fecha) {
  const [anio, mes, dia] = formatearFecha(fecha).split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Reglas de volumen del pedido:
 * - Un cliente no puede superar 20 unidades en total (el panel sí puede,
 *   para registrar pedidos telefónicos).
 * - Con más de 10 unidades en total, la entrega no puede ser para mañana:
 *   se exige desde pasado mañana.
 */
function validarLimitesPedido(lineas, fechaEntrega, usuario) {
  const total = lineas.reduce(
    (suma, linea) => suma + Number(linea.cantidad_productos ?? 0),
    0
  );

  if (esRol(usuario, ROL_CLIENTE) && total > MAX_UNIDADES_POR_PEDIDO) {
    throw new UnprocessableEntityError(
      `El pedido no puede superar las ${MAX_UNIDADES_POR_PEDIDO} unidades en total. Si quieres un pedido más grande puedes contactarte al teléfono: ${TELEFONO_PEDIDOS_GRANDES}.`,
      [
        {
          campo: 'lineas',
          mensaje: `Máximo ${MAX_UNIDADES_POR_PEDIDO} unidades por pedido.`,
        },
      ]
    );
  }

  if (total <= UMBRAL_PEDIDO_GRANDE) return;

  const fecha = parseFecha(fechaISO(fechaEntrega));
  const minima = sumarDias(fechaActualLocal(), 2);

  if (!fecha || fecha < minima) {
    throw new UnprocessableEntityError(
      `Para pedidos de más de ${UMBRAL_PEDIDO_GRANDE} unidades, la entrega más próxima es el ${fechaCorta(minima)}.`,
      [
        {
          campo: 'fechaEntrega',
          mensaje: `La entrega más próxima es el ${fechaCorta(minima)}.`,
        },
      ]
    );
  }
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

  const [lineas, comprobantes] = await Promise.all([
    productoPedidoModel.listarPorPedido(id),
    comprobantePagoModel.listarPorPedido(id),
  ]);
  return serializarPedido(fila, lineas, comprobantes);
}

function agruparLineas(filas) {
  const mapa = new Map();
  for (const fila of filas) {
    if (!mapa.has(fila.id_pedido)) mapa.set(fila.id_pedido, []);
    mapa.get(fila.id_pedido).push(fila);
  }
  return mapa;
}

function agruparComprobantes(filas) {
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

  const ids = filas.map((fila) => fila.id);
  const [lineas, comprobantes] = await Promise.all([
    productoPedidoModel.listarPorPedidos(ids),
    comprobantePagoModel.listarPorPedidos(ids),
  ]);
  const mapaLineas = agruparLineas(lineas);
  const mapaComprobantes = agruparComprobantes(comprobantes);
  return filas.map((fila) =>
    serializarPedido(
      fila,
      mapaLineas.get(fila.id) ?? [],
      mapaComprobantes.get(fila.id) ?? []
    )
  );
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

/** Valida la regla de las letras de chocolate (una letra por fresa). */
function validarMensajeLinea(mensaje, fresas, numero, indice) {
  const caracteres = mensaje ? Array.from(mensaje).length : 0;

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
}

/**
 * Determina si una línea existente conserva producto, presentación y glaseado.
 * En ese caso se mantiene su precio unitario histórico; si cambia cualquiera
 * de esos datos, la línea se valida contra el catálogo y se recalcula.
 */
function conservaDatosDePrecio(existente, linea) {
  return (
    Number(existente.id_producto) === Number(linea.idProducto) &&
    Number(existente.id_presentacion) === Number(linea.idPresentacion) &&
    Number(existente.id_color_glaseado) === Number(linea.idColorGlaseado)
  );
}

/**
 * Valida cada línea y calcula sus precios. En edición recibe las líneas
 * actuales del pedido para identificar las existentes por `id` y conservar el
 * precio histórico de las que no cambian de producto/presentación/glaseado.
 */
async function prepararLineas(lineas, existentes = []) {
  const preparadas = [];
  const existentesPorId = new Map(
    existentes.map((linea) => [Number(linea.id), linea])
  );
  const idsVistos = new Set();

  for (const [indice, linea] of lineas.entries()) {
    const numero = indice + 1;
    const idLinea = linea.id ? Number(linea.id) : null;
    const existente = idLinea ? existentesPorId.get(idLinea) : null;

    if (idLinea) {
      if (!existente) {
        throw new BadRequestError(`Línea ${numero}: no pertenece a este pedido.`);
      }
      if (idsVistos.has(idLinea)) {
        throw new BadRequestError(`Línea ${numero}: está repetida en la solicitud.`);
      }
      idsVistos.add(idLinea);
    }

    const mensaje = limpiarTexto(linea.mensajePersonalizado);
    const cantidad = linea.cantidadProductos;

    // Línea existente que conserva producto, presentación y glaseado: se
    // mantiene el precio unitario guardado al crear el pedido.
    if (existente && conservaDatosDePrecio(existente, linea)) {
      const fresas = Number(existente.cantidad_fresas);
      validarMensajeLinea(mensaje, fresas, numero, indice);

      const precioUnitario = redondear2(existente.precio_unitario);
      preparadas.push({
        id_producto: existente.id_producto,
        id_presentacion: existente.id_presentacion,
        cantidad_productos: cantidad,
        precio_unitario: precioUnitario,
        subtotal: redondear2(precioUnitario * cantidad),
        mensaje_personalizado: mensaje,
        id_color_glaseado: existente.id_color_glaseado,
        personalizacion_adicional: limpiarTexto(linea.personalizacionAdicional),
      });
      continue;
    }

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

    const fresas = Number(presentacion.cantidad_fresas);
    validarMensajeLinea(mensaje, fresas, numero, indice);

    const precioUnitario = redondear2(presentacion.precio);
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
  const estadoComprobante = await estadoComprobanteModel.buscarPorNombre('Pendiente');
  if (!estadoComprobante) {
    throw new AppError(
      'El estado "Pendiente" de comprobantes no está configurado en la base de datos.',
      500
    );
  }

  const lineas = await prepararLineas(datos.lineas);
  validarLimitesPedido(lineas, datos.fechaEntrega, usuario);

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
      instrucciones_entrega: limpiarTexto(datos.instruccionesEntrega),
      id_usuario: idUsuario,
      id_estado: estado.id,
      id_municipio: municipio.id,
    },
    lineas,
    comprobante: { url: comprobante, id_estado: estadoComprobante.id },
  });

  return obtenerPedidoCompleto(id);
}

/**
 * Edita un pedido pendiente. Se puede actualizar la cabecera y, si llega
 * `lineas`, reemplazar la lista completa de productos conservando el precio
 * histórico de las líneas que no cambian de producto/presentación/glaseado.
 */
export async function actualizar(id, datos, usuario) {
  if (esRol(usuario, ROL_REPARTIDOR)) {
    throw new ForbiddenError('El repartidor solo puede registrar la evidencia de entrega.');
  }

  const actual = await pedidoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Pedido no encontrado.');

  if (actual.estado !== ESTADO_PENDIENTE) {
    throw new ConflictError(
      `Solo se puede editar un pedido en estado "${ESTADO_PENDIENTE}".`
    );
  }

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

  if (datos.lineas !== undefined) {
    const lineasActuales = await productoPedidoModel.listarPorPedido(id);
    const lineas = await prepararLineas(datos.lineas, lineasActuales);
    validarLimitesPedido(
      lineas,
      datos.fechaEntrega !== undefined ? datos.fechaEntrega : actual.fecha_entrega,
      usuario
    );
    await pedidoModel.actualizarConLineas(id, campos, lineas);
  } else {
    if (datos.fechaEntrega !== undefined) {
      const lineasActuales = await productoPedidoModel.listarPorPedido(id);
      validarLimitesPedido(lineasActuales, datos.fechaEntrega, usuario);
    }
    await pedidoModel.actualizar(id, campos);
  }

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

  // El paso a preparación es manual, pero solo se permite cuando el pago ya
  // está completo. Los comprobantes aprobados definen el saldo.
  if (destino === 'En preparación') {
    const resumen = await comprobantePagoModel.resumenPago(id);
    const saldo = redondear2(Number(resumen?.total ?? 0) - Number(resumen?.pagado ?? 0));

    if (saldo > 0) {
      const monto = saldo.toLocaleString('es-CO', { maximumFractionDigits: 2 });
      throw new ConflictError(
        `No se puede pasar a "En preparación": el pedido tiene un saldo pendiente de $${monto}.`,
        [
          {
            campo: 'saldo',
            mensaje: `Saldo pendiente: $${monto}.`,
          },
        ]
      );
    }
  }

  const estado = await resolverEstado(destino);
  await pedidoModel.cambiarEstado(id, estado.id, {
    marcarCancelacion: destino === ESTADO_CANCELADO,
  });
  return obtenerPedidoCompleto(id);
}

function fechaDeValor(valor) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Reprograma un pedido cancelado dentro de las 48 horas posteriores a la
 * cancelación. La nueva entrega solo puede ser mañana o pasado mañana y el
 * pedido vuelve directamente a Despachado.
 */
export async function reprogramar(id, fechaEntrega) {
  const { pedido, estado } = await cargarPedidoYEstado(id);

  if (estado.nombre !== ESTADO_CANCELADO) {
    throw new ConflictError(
      `Solo se puede reprogramar un pedido en estado "${ESTADO_CANCELADO}".`
    );
  }

  const cancelacion = fechaDeValor(pedido.fecha_cancelacion);
  if (!cancelacion) {
    throw new ConflictError(
      'El pedido no tiene registrada la fecha de cancelación y no se puede reprogramar.'
    );
  }

  if (Date.now() - cancelacion.getTime() > VENTANA_REPROGRAMACION_MS) {
    throw new ConflictError(
      'El plazo máximo para reprogramar la entrega es de 2 días desde la cancelación.'
    );
  }

  const fecha = parseFecha(fechaEntrega);
  const manana = sumarDias(fechaActualLocal(), 1);
  const pasadoManana = sumarDias(fechaActualLocal(), 2);

  if (
    !fecha ||
    (fecha.getTime() !== manana.getTime() &&
      fecha.getTime() !== pasadoManana.getTime())
  ) {
    throw new UnprocessableEntityError(
      'La nueva entrega solo puede programarse para mañana o pasado mañana.',
      [
        {
          campo: 'fechaEntrega',
          mensaje: 'Selecciona mañana o pasado mañana.',
        },
      ]
    );
  }

  const despachado = await resolverEstado(ESTADO_DESPACHADO);
  await pedidoModel.reprogramarEntrega(
    id,
    normalizarFechaEntrega(fechaEntrega),
    despachado.id
  );
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

  const comprobantes = await comprobantePagoModel.listarPorPedido(id);

  // Las líneas y los comprobantes se eliminan en cascada por sus FKs.
  await pedidoModel.eliminar(id);
  await Promise.all(
    comprobantes.map((comprobante) => eliminarArchivoSubido(comprobante.url))
  );
}
