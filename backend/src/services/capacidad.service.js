// src/services/capacidad.service.js
// Reglas de capacidad diaria: consulta para la admin, excepciones por fecha y
// reserva transaccional del cupo al crear o mover un pedido.
import { withTransaction } from '../config/db.js';
import {
  CAPACIDAD_ESTANDAR_DEFAULT,
  CLAVE_TOPE_ESTANDAR,
  ESTADOS_OCUPAN_CUPO,
  VENTANA_MAXIMA_DIAS,
} from '../config/capacidad.js';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '../errors/index.js';
import * as capacidadDiaModel from '../models/capacidadDia.model.js';
import * as configuracionModel from '../models/configuracion.model.js';
import {
  fechaActualLocal,
  formatearFecha,
  inicioMes,
  parseFecha,
  parseMes,
  sumarDias,
  sumarMeses,
} from '../utils/dates.js';

function numeroNoNegativo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

function fechaValida(fecha) {
  const valor = parseFecha(fecha);
  if (!valor) {
    throw new UnprocessableEntityError('La fecha debe tener el formato YYYY-MM-DD y ser válida.');
  }
  return valor;
}

/** `Date` UTC -> `DD/MM/YYYY` para los mensajes. */
function fechaCorta(fecha) {
  const [anio, mes, dia] = formatearFecha(fecha).split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Convierte el valor de configuracion a un tope válido. */
function leerTope(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 0
    ? numero
    : CAPACIDAD_ESTANDAR_DEFAULT;
}

async function leerTopeEstandar(conexion = null) {
  if (conexion) {
    const fila = await configuracionModel.obtener(CLAVE_TOPE_ESTANDAR, conexion);
    return leerTope(fila?.valor);
  }

  const fila = await configuracionModel.obtener(CLAVE_TOPE_ESTANDAR);
  return leerTope(fila?.valor);
}

/**
 * Dentro de una transacción, garantiza la fila de configuración y la bloquea.
 * Es el mutex que serializa las reservas y los cambios de capacidad.
 */
async function bloquearConfiguracion(conexion) {
  let fila = await configuracionModel.obtenerParaActualizar(
    CLAVE_TOPE_ESTANDAR,
    conexion
  );

  if (!fila) {
    await configuracionModel.guardar(
      CLAVE_TOPE_ESTANDAR,
      CAPACIDAD_ESTANDAR_DEFAULT,
      conexion
    );
    fila = await configuracionModel.obtenerParaActualizar(
      CLAVE_TOPE_ESTANDAR,
      conexion
    );
  }

  return leerTope(fila?.valor);
}

async function topeDeFecha(fecha, estandar, conexion = null) {
  const excepcion = await capacidadDiaModel.buscarPorFecha(fecha, conexion);
  return {
    tope: excepcion ? Number(excepcion.max_fresas) : estandar,
    tieneExcepcion: Boolean(excepcion),
  };
}

function serializarDia({ fecha, tope, fresasAgendadas, tieneExcepcion }) {
  return {
    fecha,
    tope,
    fresasAgendadas,
    tieneExcepcion,
    bloqueado: tope === 0,
    disponible: Math.max(tope - fresasAgendadas, 0),
  };
}

export async function obtenerTopeEstandar() {
  return { maxFresas: await leerTopeEstandar() };
}

export async function actualizarTopeEstandar(maxFresas) {
  const tope = numeroNoNegativo(maxFresas);
  if (tope === null || tope <= 0) {
    throw new UnprocessableEntityError('El tope estándar debe ser un entero mayor que cero.');
  }

  await withTransaction(async (conexion) => {
    await bloquearConfiguracion(conexion);
    await configuracionModel.guardar(CLAVE_TOPE_ESTANDAR, tope, conexion);
  });

  return { maxFresas: tope };
}

/** Devuelve todos los días de un mes con su tope y fresas agendadas. */
export async function listarMes(mes) {
  const referencia = parseMes(mes) ?? inicioMes(fechaActualLocal());
  const mesInicio = inicioMes(referencia);
  const finExclusivo = sumarMeses(mesInicio, 1);
  const desde = formatearFecha(mesInicio);
  const hasta = formatearFecha(finExclusivo);

  const [estandar, excepciones, agendadas] = await Promise.all([
    leerTopeEstandar(),
    capacidadDiaModel.listarPorRango(desde, hasta),
    capacidadDiaModel.sumarFresasPorDia({
      desde,
      hastaExclusiva: hasta,
      estados: ESTADOS_OCUPAN_CUPO,
    }),
  ]);

  const mapaExcepciones = new Map(
    excepciones.map((fila) => [fila.fecha, Number(fila.max_fresas)])
  );
  const mapaAgendadas = new Map(
    agendadas.map((fila) => [fila.fecha, fila.fresas])
  );

  const dias = [];
  for (let fecha = mesInicio; fecha < finExclusivo; fecha = sumarDias(fecha, 1)) {
    const clave = formatearFecha(fecha);
    const tieneExcepcion = mapaExcepciones.has(clave);
    dias.push(
      serializarDia({
        fecha: clave,
        tope: tieneExcepcion ? mapaExcepciones.get(clave) : estandar,
        fresasAgendadas: mapaAgendadas.get(clave) ?? 0,
        tieneExcepcion,
      })
    );
  }

  return {
    mes: formatearFecha(mesInicio).slice(0, 7),
    topeEstandar: estandar,
    dias,
  };
}

/** Detalle de una fecha: tope, fresas agendadas y pedidos que ocupan cupo. */
export async function obtenerDia(fecha) {
  const dia = fechaValida(fecha);
  const clave = formatearFecha(dia);
  const [estandar, excepcion, pedidos] = await Promise.all([
    leerTopeEstandar(),
    capacidadDiaModel.buscarPorFecha(clave),
    capacidadDiaModel.listarPedidosDia(clave, ESTADOS_OCUPAN_CUPO),
  ]);

  return {
    ...serializarDia({
      fecha: clave,
      tope: excepcion ? Number(excepcion.max_fresas) : estandar,
      fresasAgendadas: pedidos.reduce((total, pedido) => total + pedido.fresas, 0),
      tieneExcepcion: Boolean(excepcion),
    }),
    pedidos,
  };
}

/** Crea o actualiza la excepción de un día. `0` bloquea el día. */
export async function establecerTopeDia(fecha, maxFresas) {
  const dia = fechaValida(fecha);
  const clave = formatearFecha(dia);
  const tope = numeroNoNegativo(maxFresas);

  if (tope === null) {
    throw new UnprocessableEntityError('El tope del día debe ser un entero mayor o igual a cero.', [
      { campo: 'maxFresas', mensaje: 'Debe ser un entero mayor o igual a cero.' },
    ]);
  }

  await withTransaction(async (conexion) => {
    await bloquearConfiguracion(conexion);
    const agendadas = await capacidadDiaModel.sumarFresasDia(
      clave,
      ESTADOS_OCUPAN_CUPO,
      { conexion }
    );

    if (tope > 0 && tope < agendadas) {
      throw new ConflictError(
        `No se puede bajar el tope del ${fechaCorta(dia)} a ${tope}: ya hay ${agendadas} fresas agendadas.`,
        [
          {
            campo: 'maxFresas',
            mensaje: `El tope no puede ser menor que las ${agendadas} fresas ya agendadas.`,
          },
        ]
      );
    }

    await capacidadDiaModel.guardar(clave, tope, conexion);
  });

  return obtenerDia(clave);
}

export async function bloquearDia(fecha) {
  return establecerTopeDia(fecha, 0);
}

/** Elimina la excepción del día; vuelve a usar el tope estándar. */
export async function restablecerDia(fecha) {
  const dia = fechaValida(fecha);
  const clave = formatearFecha(dia);

  await withTransaction(async (conexion) => {
    await bloquearConfiguracion(conexion);
    await capacidadDiaModel.eliminarPorFecha(clave, conexion);
  });

  return obtenerDia(clave);
}

/** Busca la primera fecha posterior con cupo para el tamaño de pedido. */
async function siguienteFechaDisponible(
  fechaSolicitada,
  fresas,
  estandar,
  conexion,
  excluirPedidoId
) {
  const inicio = sumarDias(parseFecha(fechaSolicitada), 1);
  const limite = sumarDias(fechaActualLocal(), VENTANA_MAXIMA_DIAS);

  for (let fecha = inicio; fecha <= limite; fecha = sumarDias(fecha, 1)) {
    const clave = formatearFecha(fecha);
    const { tope } = await topeDeFecha(clave, estandar, conexion);
    if (tope === 0) continue;

    const agendadas = await capacidadDiaModel.sumarFresasDia(
      clave,
      ESTADOS_OCUPAN_CUPO,
      { excluirPedidoId, conexion }
    );
    if (agendadas + fresas <= tope) return clave;
  }

  return null;
}

/**
 * Valida el cupo y ejecuta `callback(conexion)` en la misma transacción.
 * `fresas` son las fresas totales del pedido; `excluirPedidoId` evita contar
 * dos veces el pedido que se está editando o reprogramando.
 */
export async function reservarCupoYEjecutar(
  { fecha, fresas, excluirPedidoId = null },
  callback
) {
  const dia = fechaValida(fecha);
  const clave = formatearFecha(dia);
  const total = Number(fresas) || 0;

  return withTransaction(async (conexion) => {
    const estandar = await bloquearConfiguracion(conexion);
    const { tope } = await topeDeFecha(clave, estandar, conexion);
    const agendadas = await capacidadDiaModel.sumarFresasDia(
      clave,
      ESTADOS_OCUPAN_CUPO,
      { excluirPedidoId, conexion }
    );

    if (tope === 0 || agendadas + total > tope) {
      const alternativa = await siguienteFechaDisponible(
        clave,
        total,
        estandar,
        conexion,
        excluirPedidoId
      );

      const mensaje = alternativa
        ? `Ese día no tiene cupo. La siguiente fecha disponible para este pedido es el ${fechaCorta(
            parseFecha(alternativa)
          )}.`
        : `Ese día no tiene cupo y no hay una fecha disponible dentro de los próximos ${VENTANA_MAXIMA_DIAS} días para un pedido de ${total} fresas.`;

      throw new ConflictError(mensaje, [
        { campo: 'fechaEntrega', mensaje: 'Selecciona otra fecha de entrega.' },
      ]);
    }

    return callback(conexion);
  });
}

/** Fresas totales de un pedido existente. */
export async function fresasDePedido(idPedido) {
  const pedido = await capacidadDiaModel.sumarFresasPedido(idPedido);
  if (pedido === 0) {
    throw new NotFoundError('No se encontraron líneas para el pedido.');
  }
  return pedido;
}
