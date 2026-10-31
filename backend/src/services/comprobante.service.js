// src/services/comprobante.service.js
// Reglas de negocio de los comprobantes de pago: cupo de 3 activos, saldo,
// aprobación con monto verificado, rechazo con motivo y borrado de pendientes.
import { withTransaction } from '../config/db.js';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../errors/index.js';
import * as comprobantePagoModel from '../models/comprobantePago.model.js';
import * as estadoComprobanteModel from '../models/estadoComprobante.model.js';
import { eliminarArchivoSubido } from '../utils/archivos.js';
import { redondear2 } from '../utils/number.js';
import * as emailService from './emailService.js';
import * as pedidoService from './pedido.service.js';

const MAX_COMPROBANTES_ACTIVOS = 3;
const ESTADO_PENDIENTE = 'Pendiente';

async function resolverEstado(nombre) {
  const estado = await estadoComprobanteModel.buscarPorNombre(nombre);
  if (!estado) {
    throw new AppError(
      `El estado "${nombre}" de comprobantes no está configurado en la base de datos.`,
      500
    );
  }
  return estado;
}

function calcularSaldo(resumen) {
  return redondear2(Number(resumen?.total ?? 0) - Number(resumen?.pagado ?? 0));
}

function formatearMonto(valor) {
  return `$${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
}

/**
 * Agrega un comprobante a un pedido propio. Solo se permite mientras el pedido
 * está Pendiente, queda saldo y hay menos de 3 comprobantes activos
 * (Pendientes + Aprobados; los rechazados no cuentan).
 */
export async function agregar(idPedido, url, usuario) {
  if (!url) {
    throw new UnprocessableEntityError('El comprobante de pago es obligatorio.');
  }

  const estadoPendiente = await resolverEstado(ESTADO_PENDIENTE);

  return withTransaction(async (conexion) => {
    const pedido = await comprobantePagoModel.buscarPedidoParaComprobante(
      idPedido,
      conexion
    );

    // Se responde 404 para no revelar pedidos de otros clientes.
    if (!pedido || pedido.id_usuario !== usuario.id) {
      throw new NotFoundError('Pedido no encontrado.');
    }

    if (pedido.estado_pedido !== 'Pendiente') {
      throw new ConflictError(
        'Solo se pueden subir comprobantes mientras el pedido está Pendiente.'
      );
    }

    const resumen = await comprobantePagoModel.resumenPago(idPedido, conexion);
    const saldo = calcularSaldo(resumen);

    if (saldo <= 0) {
      throw new ConflictError('El pedido no tiene saldo pendiente por pagar.');
    }

    if (Number(resumen?.activos ?? 0) >= MAX_COMPROBANTES_ACTIVOS) {
      throw new ConflictError(
        `Solo se permiten ${MAX_COMPROBANTES_ACTIVOS} comprobantes activos por pedido.`
      );
    }

    await comprobantePagoModel.crear(conexion, {
      url,
      idPedido,
      idEstado: estadoPendiente.id,
    });

    return idPedido;
  });
}

/**
 * Elimina un comprobante Pendiente del propio cliente. Los aprobados y
 * rechazados se conservan como historial. También borra el archivo físico.
 */
export async function eliminar(id, usuario) {
  const estadoPendiente = await resolverEstado(ESTADO_PENDIENTE);

  const eliminado = await withTransaction(async (conexion) => {
    const comprobante = await comprobantePagoModel.buscarConPedido(id, {
      conexion,
      forUpdate: true,
    });

    if (!comprobante || comprobante.id_usuario !== usuario.id) {
      throw new NotFoundError('Comprobante de pago no encontrado.');
    }

    if (comprobante.estado_comprobante !== ESTADO_PENDIENTE) {
      throw new ConflictError('Solo se pueden eliminar comprobantes Pendientes.');
    }

    const afectadas = await comprobantePagoModel.eliminar(
      conexion,
      id,
      estadoPendiente.id
    );
    if (afectadas === 0) {
      throw new ConflictError('El comprobante ya no se encuentra Pendiente.');
    }

    return { idPedido: comprobante.id_pedido, url: comprobante.url };
  });

  await eliminarArchivoSubido(eliminado.url);
  return eliminado.idPedido;
}

/**
 * Aprueba un comprobante Pendiente guardando el monto realmente transferido.
 * Solo se permite cuando el monto coincide exactamente con el saldo pendiente.
 * El pedido NO cambia de estado: el paso a preparación es manual y se valida
 * en pedido.service.
 */
export async function aprobar(id, monto) {
  const montoVerificado = redondear2(monto);

  if (!Number.isFinite(montoVerificado) || montoVerificado <= 0) {
    throw new UnprocessableEntityError(
      'El monto verificado debe ser mayor que cero.'
    );
  }

  const [estadoPendiente, estadoAprobado] = await Promise.all([
    resolverEstado(ESTADO_PENDIENTE),
    resolverEstado('Aprobado'),
  ]);

  const resultado = await withTransaction(async (conexion) => {
    const comprobante = await comprobantePagoModel.buscarConPedido(id, {
      conexion,
      forUpdate: true,
    });

    if (!comprobante) {
      throw new NotFoundError('Comprobante de pago no encontrado.');
    }

    if (comprobante.estado_comprobante !== ESTADO_PENDIENTE) {
      throw new ConflictError('Solo se pueden aprobar comprobantes Pendientes.');
    }

    const resumenAntes = await comprobantePagoModel.resumenPago(
      comprobante.id_pedido,
      conexion
    );
    const saldoAntes = calcularSaldo(resumenAntes);

    if (saldoAntes <= 0) {
      throw new UnprocessableEntityError(
        'El pedido no tiene saldo pendiente por aprobar.'
      );
    }

    if (montoVerificado !== saldoAntes) {
      const saldoFormateado = formatearMonto(saldoAntes);
      throw new UnprocessableEntityError(
        `El monto debe coincidir exactamente con el saldo pendiente (${saldoFormateado}).`,
        [
          {
            campo: 'monto',
            mensaje: `Saldo pendiente exacto: ${saldoFormateado}.`,
          },
        ]
      );
    }

    const afectadas = await comprobantePagoModel.aprobar(conexion, id, {
      monto: montoVerificado,
      idEstado: estadoAprobado.id,
      idEstadoPendiente: estadoPendiente.id,
    });

    if (afectadas === 0) {
      throw new ConflictError('El comprobante ya no se encuentra Pendiente.');
    }

    // Se recalcula dentro de la misma transacción para dejar el saldo
    // consistente con el monto recién aprobado.
    const resumenDespues = await comprobantePagoModel.resumenPago(
      comprobante.id_pedido,
      conexion
    );

    return {
      idPedido: comprobante.id_pedido,
      advertencia: null,
      saldo: calcularSaldo(resumenDespues),
    };
  });

  const pedido = await pedidoService.obtenerPedidoCompleto(resultado.idPedido);
  void emailService.enviarComprobanteAprobado({ pedido });

  return resultado;
}

/**
 * Rechaza un comprobante Pendiente con un motivo y el valor realmente
 * entregado. Ese valor reduce el saldo, pero no puede completarlo: el pago
 * final debe aprobarse. Si el pedido ya no tiene saldo, solo se admite 0 para
 * poder descartar comprobantes duplicados.
 */
export async function rechazar(id, motivo, monto) {
  const motivoLimpio = String(motivo ?? '').trim();
  if (!motivoLimpio) {
    throw new UnprocessableEntityError('El motivo del rechazo es obligatorio.');
  }

  if (monto === null || monto === undefined || monto === '') {
    throw new UnprocessableEntityError('El valor entregado es obligatorio.');
  }

  const montoEntregado = redondear2(monto);
  if (!Number.isFinite(montoEntregado) || montoEntregado < 0) {
    throw new UnprocessableEntityError(
      'El valor entregado debe ser un número mayor o igual a cero.'
    );
  }

  const [estadoPendiente, estadoRechazado] = await Promise.all([
    resolverEstado(ESTADO_PENDIENTE),
    resolverEstado('Rechazado'),
  ]);

  const resultado = await withTransaction(async (conexion) => {
    const comprobante = await comprobantePagoModel.buscarConPedido(id, {
      conexion,
      forUpdate: true,
    });

    if (!comprobante) {
      throw new NotFoundError('Comprobante de pago no encontrado.');
    }

    if (comprobante.estado_comprobante !== ESTADO_PENDIENTE) {
      throw new ConflictError('Solo se pueden rechazar comprobantes Pendientes.');
    }

    const resumen = await comprobantePagoModel.resumenPago(
      comprobante.id_pedido,
      conexion
    );
    const saldo = calcularSaldo(resumen);

    if (saldo > 0) {
      if (montoEntregado === saldo) {
        throw new UnprocessableEntityError(
          'El valor entregado completa el saldo pendiente. Usa Aprobar para confirmar el pago.',
          [
            {
              campo: 'monto',
              mensaje: 'Si el valor completa el saldo, debe aprobarse el comprobante.',
            },
          ]
        );
      }

      if (montoEntregado > saldo) {
        throw new UnprocessableEntityError(
          `El valor entregado no puede superar el saldo pendiente (${formatearMonto(
            saldo
          )}).`,
          [
            {
              campo: 'monto',
              mensaje: `Saldo pendiente: ${formatearMonto(saldo)}.`,
            },
          ]
        );
      }
    } else if (montoEntregado !== 0) {
      throw new UnprocessableEntityError(
        'El pedido no tiene saldo pendiente; el valor entregado debe ser 0.',
        [
          {
            campo: 'monto',
            mensaje: 'Con saldo cero, el valor entregado debe ser 0.',
          },
        ]
      );
    }

    const afectadas = await comprobantePagoModel.rechazar(conexion, id, {
      motivo: motivoLimpio,
      monto: montoEntregado,
      idEstado: estadoRechazado.id,
      idEstadoPendiente: estadoPendiente.id,
    });

    if (afectadas === 0) {
      throw new ConflictError('El comprobante ya no se encuentra Pendiente.');
    }

    return { idPedido: comprobante.id_pedido };
  });

  const pedido = await pedidoService.obtenerPedidoCompleto(resultado.idPedido);
  void emailService.enviarComprobanteRechazado({
    pedido,
    motivo: motivoLimpio,
    monto: montoEntregado,
  });

  return resultado;
}
