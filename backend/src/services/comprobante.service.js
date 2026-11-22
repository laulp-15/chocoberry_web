// src/services/comprobante.service.js
// Reglas de negocio de los comprobantes de pago: cupo de 3 pendientes, saldo,
// aprobación con monto verificado, devolución con motivo y borrado de pendientes.
import { withTransaction } from '../config/db.js';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../errors/index.js';
import * as comprobantePagoModel from '../models/comprobantePago.model.js';
import * as estadoComprobanteModel from '../models/estadoComprobante.model.js';
import {
  borrarImagenComprobante,
  subirImagenComprobante,
} from '../utils/cloudinaryStorage.js';
import { redondear2 } from '../utils/number.js';
import * as emailService from './emailService.js';
import * as pedidoService from './pedido.service.js';

const MAX_COMPROBANTES_PENDIENTES = 3;
const ESTADO_PENDIENTE = 'Pendiente';
const ROL_CLIENTE = 'Cliente';

function esRol(usuario, rol) {
  return String(usuario?.nombre_rol ?? '').trim().toLowerCase() === rol.toLowerCase();
}

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
  return Math.max(
    0,
    redondear2(Number(resumen?.total ?? 0) - Number(resumen?.pagado ?? 0))
  );
}

function formatearMonto(valor) {
  return `$${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
}

/**
 * Agrega un comprobante a un pedido. El cliente solo puede hacerlo sobre sus
 * propios pedidos y queda Pendiente de aprobación; el admin/staff puede subirlo
 * a cualquier pedido y queda Aprobado automáticamente por el saldo pendiente.
 * En ambos casos el pedido debe seguir Pendiente, tener saldo y menos de 3
 * comprobantes Pendientes de revisión (los aprobados y devueltos no ocupan cupo).
 */
export async function agregar(idPedido, archivo, usuario) {
  if (!archivo) {
    throw new UnprocessableEntityError('El comprobante de pago es obligatorio.');
  }

  const esCliente = esRol(usuario, ROL_CLIENTE);
  const estadoComprobante = await resolverEstado(
    esCliente ? ESTADO_PENDIENTE : 'Aprobado'
  );
  const subida = await subirImagenComprobante(archivo);

  try {
    return await withTransaction(async (conexion) => {
      const pedido = await comprobantePagoModel.buscarPedidoParaComprobante(
        idPedido,
        conexion
      );

      // Se responde 404 para no revelar pedidos de otros clientes. El personal
      // con permiso de creación sí puede subir comprobantes a cualquier pedido.
      if (!pedido || (esCliente && pedido.id_usuario !== usuario.id)) {
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

      if (Number(resumen?.pendientes ?? 0) >= MAX_COMPROBANTES_PENDIENTES) {
        throw new ConflictError(
          `Solo se permiten ${MAX_COMPROBANTES_PENDIENTES} comprobantes pendientes de revisión por pedido.`
        );
      }

      await comprobantePagoModel.crear(conexion, {
        url: subida.url,
        publicId: subida.public_id,
        idPedido,
        idEstado: estadoComprobante.id,
        monto: esCliente ? null : saldo,
      });

      return idPedido;
    });
  } catch (error) {
    await borrarImagenComprobante(subida.public_id);
    throw error;
  }
}

/**
 * Elimina un comprobante Pendiente del propio cliente. Los aprobados y
 * devueltos se conservan como historial. También borra el archivo físico.
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

    return {
      idPedido: comprobante.id_pedido,
      publicId: comprobante.public_id,
    };
  });

  await borrarImagenComprobante(eliminado.publicId);
  return eliminado.idPedido;
}

/**
 * Aprueba un comprobante Pendiente guardando el monto realmente transferido.
 * El monto puede ser parcial, pero no puede superar el saldo pendiente.
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

    if (montoVerificado > saldoAntes) {
      const saldoFormateado = formatearMonto(saldoAntes);
      throw new UnprocessableEntityError(
        `El monto verificado no puede superar el saldo pendiente (${saldoFormateado}).`,
        [
          {
            campo: 'monto',
            mensaje: `Saldo pendiente: ${saldoFormateado}.`,
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
      monto: montoVerificado,
      saldo: calcularSaldo(resumenDespues),
    };
  });

  const pedido = await pedidoService.obtenerPedidoCompleto(resultado.idPedido);
  void emailService.enviarComprobanteAprobado({
    pedido,
    monto: resultado.monto,
    saldo: resultado.saldo,
  });

  return resultado;
}

/**
 * Devuelve un comprobante Pendiente con un motivo obligatorio. El comprobante
 * queda en el historial, pero no cuenta para el total aprobado ni para el cupo.
 */
export async function devolver(id, motivo) {
  const motivoLimpio = String(motivo ?? '').trim();
  if (!motivoLimpio) {
    throw new UnprocessableEntityError('El motivo de la devolución es obligatorio.');
  }

  if (motivoLimpio.length < 5) {
    throw new UnprocessableEntityError(
      'El motivo de la devolución debe tener al menos 5 caracteres.'
    );
  }

  if (motivoLimpio.length > 255) {
    throw new UnprocessableEntityError(
      'El motivo de la devolución no puede superar los 255 caracteres.'
    );
  }

  const [estadoPendiente, estadoDevuelto] = await Promise.all([
    resolverEstado(ESTADO_PENDIENTE),
    resolverEstado('Devuelto'),
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
      throw new ConflictError('Solo se pueden devolver comprobantes Pendientes.');
    }

    const afectadas = await comprobantePagoModel.devolver(conexion, id, {
      motivo: motivoLimpio,
      idEstado: estadoDevuelto.id,
      idEstadoPendiente: estadoPendiente.id,
    });

    if (afectadas === 0) {
      throw new ConflictError('El comprobante ya no se encuentra Pendiente.');
    }

    return { idPedido: comprobante.id_pedido };
  });

  const pedido = await pedidoService.obtenerPedidoCompleto(resultado.idPedido);
  void emailService.enviarComprobanteDevuelto({
    pedido,
    motivo: motivoLimpio,
  });

  return resultado;
}
