// src/services/pedido.service.js
// Reglas de negocio del módulo de pedidos: cálculo de precios en el servidor,
// transiciones de estado y alcance por rol (cada cliente solo ve lo suyo).
import {
  UMBRAL_COTIZACION_FRESAS,
  VENTANA_MAXIMA_DIAS,
  diasAnticipacionParaFresas,
} from '../config/capacidad.js';
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
import * as capacidadService from './capacidad.service.js';
import * as emailService from './emailService.js';
import * as municipioService from './municipio.service.js';
import {
  borrarImagenComprobante,
  borrarImagenEvidencia,
  subirImagenComprobante,
  subirImagenEvidencia,
} from '../utils/cloudinaryStorage.js';
import { redondear2 } from '../utils/number.js';
import {
  fechaActualLocal,
  formatearFecha,
  parseFecha,
  sumarDias,
} from '../utils/dates.js';
import { construirMeta, leerPaginacion } from '../utils/paginacion.js';
import { serializarPedido } from '../utils/serializers.js';

const ROL_CLIENTE = 'Cliente';
const ROL_REPARTIDOR = 'Repartidor';

const ESTADO_PENDIENTE = 'Pendiente';
const ESTADO_RECHAZADO = 'Rechazado';
const ESTADO_DESPACHADO = 'Despachado';
const ESTADO_ENTREGADO = 'Entregado';
const ESTADO_CANCELADO = 'Cancelado';

const VENTANA_REPROGRAMACION_MS = 2 * 24 * 60 * 60 * 1000;

// Los pedidos grandes que llegan por teléfono se registran desde el panel y
// quedan exentos del umbral de cotización de la tienda en línea.
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

/** Convierte el nombre canónico de la BD al slug que usa el frontend. */
function slugEstado(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, '_');
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

/** Suma las fresas de líneas preparadas o de filas de `productoPedido`. */
function fresasDeLineas(lineas) {
  return lineas.reduce((suma, linea) => {
    if (linea.fresas !== undefined && linea.fresas !== null) {
      return suma + Number(linea.fresas);
    }
    return (
      suma +
      Number(linea.cantidad_productos ?? 0) * Number(linea.cantidad_fresas ?? 0)
    );
  }, 0);
}

/**
 * Reglas de volumen y fechas:
 * - La tienda en línea no puede superar el umbral de cotización.
 * - La anticipación mínima depende de las fresas del pedido.
 * - La entrega no puede superar la ventana máxima de programación.
 */
function validarReglasPedido(fresas, fechaEntrega, usuario) {
  const total = Number(fresas) || 0;

  if (esRol(usuario, ROL_CLIENTE) && total > UMBRAL_COTIZACION_FRESAS) {
    throw new UnprocessableEntityError(
      `El pedido tiene ${total} fresas y supera el máximo en línea de ${UMBRAL_COTIZACION_FRESAS}. Requiere cotización con la administradora. Puedes contactarte al teléfono: ${TELEFONO_PEDIDOS_GRANDES}.`,
      [
        {
          campo: 'lineas',
          mensaje: `Máximo ${UMBRAL_COTIZACION_FRESAS} fresas por pedido en línea.`,
        },
      ]
    );
  }

  const fecha = parseFecha(fechaISO(fechaEntrega));
  if (!fecha) {
    throw new UnprocessableEntityError('La fecha de entrega no es válida.', [
      {
        campo: 'fechaEntrega',
        mensaje: 'Selecciona una fecha de entrega válida.',
      },
    ]);
  }

  const hoy = fechaActualLocal();
  const minima = sumarDias(hoy, diasAnticipacionParaFresas(total));

  if (fecha < minima) {
    throw new UnprocessableEntityError(
      `Para un pedido de ${total} fresas, la entrega más próxima es el ${fechaCorta(minima)}.`,
      [
        {
          campo: 'fechaEntrega',
          mensaje: `La entrega más próxima es el ${fechaCorta(minima)}.`,
        },
      ]
    );
  }

  const maxima = sumarDias(hoy, VENTANA_MAXIMA_DIAS);
  if (fecha > maxima) {
    throw new UnprocessableEntityError(
      `La entrega no puede programarse después del ${fechaCorta(maxima)}.`,
      [
        {
          campo: 'fechaEntrega',
          mensaje: `La fecha máxima de entrega es el ${fechaCorta(maxima)}.`,
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

export async function obtenerPedidoCompleto(id) {
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
export async function listar(
  filtros = {},
  usuario,
  { soloPropios = false, paginar = true } = {}
) {
  let estado;
  if (filtros.estado) {
    estado = normalizarEstado(filtros.estado);
    if (!estado) {
      throw new UnprocessableEntityError(`Estado no válido para filtrar: "${filtros.estado}".`);
    }
  }

  const limitarAlPropio = soloPropios || esRol(usuario, ROL_CLIENTE);
  const idUsuario = limitarAlPropio ? usuario.id : filtros.idUsuario;
  const paginacion = paginar
    ? leerPaginacion(filtros)
    : { paginado: false, page: null, limit: null, offset: 0 };

  const filtrosBase = {
    estado,
    idEstado: filtros.idEstado,
    idMunicipio: filtros.idMunicipio,
    idUsuario,
    cliente: filtros.cliente,
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
  };

  let filas;
  let total = null;

  if (paginacion.paginado) {
    [filas, total] = await Promise.all([
      pedidoModel.listar({
        ...filtrosBase,
        page: paginacion.page,
        limit: paginacion.limit,
        orden: filtros.orden,
      }),
      pedidoModel.contar(filtrosBase),
    ]);
  } else {
    filas = await pedidoModel.listar(filtrosBase);
  }

  let data = [];

  if (filas.length > 0) {
    const ids = filas.map((fila) => fila.id);
    const [lineas, comprobantes] = await Promise.all([
      productoPedidoModel.listarPorPedidos(ids),
      comprobantePagoModel.listarPorPedidos(ids),
    ]);
    const mapaLineas = agruparLineas(lineas);
    const mapaComprobantes = agruparComprobantes(comprobantes);
    data = filas.map((fila) =>
      serializarPedido(
        fila,
        mapaLineas.get(fila.id) ?? [],
        mapaComprobantes.get(fila.id) ?? []
      )
    );
  }

  if (!paginacion.paginado) return data;

  const meta = construirMeta({
    total,
    page: paginacion.page,
    limit: paginacion.limit,
  });

  // Los contadores de los chips son globales: no dependen del estado ni de
  // la búsqueda, pero sí del alcance propio de un cliente.
  const conteos = await pedidoModel.contarPorEstado(
    limitarAlPropio ? { idUsuario: usuario.id } : {}
  );

  meta.estados = Object.entries(conteos).reduce((acumulado, [nombre, cantidad]) => {
    acumulado[slugEstado(nombre)] = cantidad;
    return acumulado;
  }, {});

  return { data, meta };
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
function validarLetrasFresas(letras, fresas, numero, indice) {
  const caracteres = letras
    ? Array.from(letras.replace(/\s/g, '')).length
    : 0;

  if (letras && caracteres > fresas) {
    throw new UnprocessableEntityError(
      `Línea ${numero}: las letras para las fresas tienen ${caracteres} caracteres sin contar espacios y la presentación solo admite ${fresas} (una letra de chocolate por fresa).`,
      [
        {
          campo: `lineas.${indice}.letrasFresas`,
          mensaje: `Máximo ${fresas} caracteres para esta presentación.`,
        },
      ]
    );
  }
}

/** El mensaje de la tarjeta no depende de las fresas: solo cuenta sin espacios. */
function validarMensajeTarjetaLinea(mensaje, numero, indice) {
  const caracteres = mensaje
    ? Array.from(mensaje.replace(/\s/g, '')).length
    : 0;

  if (mensaje && caracteres > 255) {
    throw new UnprocessableEntityError(
      `Línea ${numero}: el mensaje de la tarjeta tiene ${caracteres} caracteres sin contar espacios y el máximo es 255.`,
      [
        {
          campo: `lineas.${indice}.mensajeTarjeta`,
          mensaje: 'Máximo 255 caracteres sin contar espacios.',
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

    const letrasFresas = limpiarTexto(linea.letrasFresas);
    const mensajeTarjeta = limpiarTexto(linea.mensajeTarjeta);
    const cantidad = linea.cantidadProductos;

    // Línea existente que conserva producto, presentación y glaseado: se
    // mantiene el precio unitario guardado al crear el pedido.
    if (existente && conservaDatosDePrecio(existente, linea)) {
      const fresas = Number(existente.cantidad_fresas);
      validarLetrasFresas(letrasFresas, fresas, numero, indice);
      validarMensajeTarjetaLinea(mensajeTarjeta, numero, indice);

      const precioUnitario = redondear2(existente.precio_unitario);
      preparadas.push({
        id_producto: existente.id_producto,
        id_presentacion: existente.id_presentacion,
        cantidad_productos: cantidad,
        precio_unitario: precioUnitario,
        subtotal: redondear2(precioUnitario * cantidad),
        letras_fresas: letrasFresas,
        mensaje_tarjeta: mensajeTarjeta,
        id_color_glaseado: existente.id_color_glaseado,
        fresas: fresas * cantidad,
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
    validarLetrasFresas(letrasFresas, fresas, numero, indice);
    validarMensajeTarjetaLinea(mensajeTarjeta, numero, indice);

    const precioUnitario = redondear2(presentacion.precio);
    preparadas.push({
      id_producto: producto.id,
      id_presentacion: presentacion.id,
      cantidad_productos: cantidad,
      precio_unitario: precioUnitario,
      subtotal: redondear2(precioUnitario * cantidad),
      letras_fresas: letrasFresas,
      mensaje_tarjeta: mensajeTarjeta,
      id_color_glaseado: color.id,
      fresas: fresas * cantidad,
    });
  }

  return preparadas;
}

export async function crear(datos, usuario, comprobante) {
  const esCliente = esRol(usuario, ROL_CLIENTE);

  // El checkout del cliente exige comprobante; el panel del admin puede crear
  // el pedido sin él y subirlo después.
  if (esCliente && !comprobante) {
    throw new UnprocessableEntityError('El comprobante de pago es obligatorio.');
  }

  const idUsuario = await resolverUsuarioPedido(datos.idUsuario, usuario);
  const municipio = await municipioService.resolverActivo(datos.idMunicipio);
  const estado = await resolverEstado(ESTADO_PENDIENTE);

  const lineas = await prepararLineas(datos.lineas);
  const fresas = fresasDeLineas(lineas);
  validarReglasPedido(fresas, datos.fechaEntrega, usuario);

  let comprobanteInicial = null;
  let comprobanteSubido = null;

  if (comprobante) {
    // Un comprobante subido por el admin/staff no pasa por aprobación manual:
    // se registra ya aprobado por el total del pedido.
    const autoAprobado = !esCliente;
    const nombreEstadoComprobante = autoAprobado ? 'Aprobado' : 'Pendiente';
    const estadoComprobante = await estadoComprobanteModel.buscarPorNombre(
      nombreEstadoComprobante
    );

    if (!estadoComprobante) {
      throw new AppError(
        `El estado "${nombreEstadoComprobante}" de comprobantes no está configurado en la base de datos.`,
        500
      );
    }

    const subtotal = lineas.reduce(
      (suma, linea) => suma + Number(linea.subtotal ?? 0),
      0
    );
    const total = redondear2(subtotal + Number(municipio.precio_domicilio));

    comprobanteSubido = await subirImagenComprobante(comprobante);
    comprobanteInicial = {
      url: comprobanteSubido.url,
      public_id: comprobanteSubido.public_id,
      id_estado: estadoComprobante.id,
      monto: autoAprobado ? total : null,
    };
  }

  let creado = false;
  try {
    const id = await capacidadService.reservarCupoYEjecutar(
      { fecha: datos.fechaEntrega, fresas },
      (conexion) =>
        pedidoModel.crearConLineas(
          {
            pedido: {
              fecha_entrega: normalizarFechaEntrega(datos.fechaEntrega),
              direccion: datos.direccion,
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
            comprobante: comprobanteInicial,
          },
          conexion
        )
    );

    creado = true;
    const pedido = await obtenerPedidoCompleto(id);
    if (esCliente) {
      void emailService.enviarPedidoRecibido({ pedido });
    }
    return pedido;
  } catch (error) {
    if (!creado && comprobanteSubido) {
      await borrarImagenComprobante(comprobanteSubido.public_id);
    }
    throw error;
  }
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

  if (datos.fechaEntrega !== undefined) campos.fecha_entrega = normalizarFechaEntrega(datos.fechaEntrega);
  if (datos.direccion !== undefined) campos.direccion = datos.direccion;
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

  const cambiaFecha = datos.fechaEntrega !== undefined;
  const cambiaLineas = datos.lineas !== undefined;

  if (cambiaFecha || cambiaLineas) {
    const lineasActuales = await productoPedidoModel.listarPorPedido(id);
    const lineas = cambiaLineas
      ? await prepararLineas(datos.lineas, lineasActuales)
      : lineasActuales;
    const fresas = fresasDeLineas(lineas);
    const fechaResultante = cambiaFecha ? datos.fechaEntrega : actual.fecha_entrega;

    validarReglasPedido(fresas, fechaResultante, usuario);

    await capacidadService.reservarCupoYEjecutar(
      { fecha: fechaISO(fechaResultante), fresas, excluirPedidoId: id },
      (conexion) => {
        if (cambiaLineas) {
          return pedidoModel.actualizarConLineas(id, campos, lineas, conexion);
        }
        return pedidoModel.actualizar(id, campos, conexion);
      }
    );
  } else {
    await pedidoModel.actualizar(id, campos);
  }

  return obtenerPedidoCompleto(id);
}

export async function cambiarEstado(id, nombreEstado, observacionesEntrega) {
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

  const motivoCancelacion = String(observacionesEntrega ?? '').trim();

  if (destino === ESTADO_CANCELADO) {
    if (!motivoCancelacion) {
      throw new UnprocessableEntityError('El motivo de cancelación es obligatorio.', [
        {
          campo: 'observacionesEntrega',
          mensaje: 'Escribe el motivo de la cancelación.',
        },
      ]);
    }
    if (motivoCancelacion.length < 5) {
      throw new UnprocessableEntityError(
        'El motivo de cancelación debe tener al menos 5 caracteres.',
        [
          {
            campo: 'observacionesEntrega',
            mensaje: 'El motivo debe tener al menos 5 caracteres.',
          },
        ]
      );
    }
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
    const saldo = Math.max(
      0,
      redondear2(Number(resumen?.total ?? 0) - Number(resumen?.pagado ?? 0))
    );

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
    observacionesEntrega: motivoCancelacion || null,
  });

  const actualizado = await obtenerPedidoCompleto(id);

  if (destino === 'En preparación') {
    void emailService.enviarPedidoEnPreparacion({ pedido: actualizado });
  } else if (destino === ESTADO_DESPACHADO) {
    void emailService.enviarPedidoDespachado({ pedido: actualizado });
  } else if (destino === ESTADO_CANCELADO) {
    void emailService.enviarPedidoCancelado({
      pedido: actualizado,
      motivo: motivoCancelacion,
    });
  }

  return actualizado;
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
  const lineas = await productoPedidoModel.listarPorPedido(id);
  const fresas = fresasDeLineas(lineas);

  await capacidadService.reservarCupoYEjecutar(
    { fecha: fechaEntrega, fresas, excluirPedidoId: id },
    (conexion) =>
      pedidoModel.reprogramarEntrega(
        id,
        normalizarFechaEntrega(fechaEntrega),
        despachado.id,
        conexion
      )
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
  const motivoLimpio = motivo.trim();
  await pedidoModel.rechazar(id, estadoRechazado.id, motivoLimpio);

  const actualizado = await obtenerPedidoCompleto(id);
  void emailService.enviarPedidoRechazado({ pedido: actualizado, motivo: motivoLimpio });
  return actualizado;
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
  let subida = null;
  let guardado = false;

  try {
    if (evidencia) {
      subida = await subirImagenEvidencia(evidencia);
      campos.evidencia_entrega = subida.url;
      campos.evidencia_public_id = subida.public_id;
    }
    if (datos.observacionesEntrega !== undefined) {
      campos.observaciones_entrega = limpiarTexto(datos.observacionesEntrega);
    }

    await pedidoModel.actualizarEntrega(id, campos);
    guardado = true;

    if (subida && pedido.evidencia_public_id) {
      await borrarImagenEvidencia(pedido.evidencia_public_id);
    }

    return await obtenerPedidoCompleto(id);
  } catch (error) {
    if (!guardado && subida) {
      await borrarImagenEvidencia(subida.public_id);
    }
    throw error;
  }
}

export async function eliminar(id) {
  const actual = await pedidoModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Pedido no encontrado.');

  const comprobantes = await comprobantePagoModel.listarPorPedido(id);

  // Las líneas y los comprobantes se eliminan en cascada por sus FKs.
  await pedidoModel.eliminar(id);
  await Promise.all([
    ...comprobantes.map((comprobante) =>
      borrarImagenComprobante(comprobante.public_id)
    ),
    borrarImagenEvidencia(actual.evidencia_public_id),
  ]);
}
