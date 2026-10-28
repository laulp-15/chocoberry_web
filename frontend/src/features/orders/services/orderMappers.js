// src/features/orders/services/orderMappers.js
//
// Traduce las respuestas del backend de pedidos (/api/pedidos) a la forma que
// necesita la tienda/perfil: fechas y totales listos para mostrar, líneas con
// nombres e imágenes resueltas y el glaseado como datos simples.

import { imageUrl } from '../../../shared/utils/imageUrl';

function mapComprobante(comprobante) {
  if (!comprobante) return null;

  return {
    id: comprobante.id,
    url: imageUrl(comprobante.url),
    monto:
      comprobante.monto === null || comprobante.monto === undefined
        ? null
        : Number(comprobante.monto),
    fecha: comprobante.fecha,
    motivoRechazo: comprobante.motivoRechazo ?? '',
    estado: comprobante.estado?.nombre ?? '',
  };
}

function mapLinea(linea) {
  if (!linea) return null;

  return {
    id: linea.id,
    productoId: linea.producto?.id ?? null,
    nombre: linea.producto?.nombre ?? '',
    imagen: imageUrl(linea.producto?.imagen),
    presentacionId: linea.presentacion?.id ?? null,
    cantidadFresas: Number(linea.presentacion?.cantidadFresas ?? 0),
    unidades: Number(linea.cantidadProductos ?? 0),
    precioUnitario: Number(linea.precioUnitario ?? 0),
    subtotal: Number(linea.subtotal ?? 0),
    mensajePersonalizado: linea.mensajePersonalizado ?? '',
    personalizacionAdicional: linea.personalizacionAdicional ?? '',
    colorNombre: linea.colorGlaseado?.nombre ?? '',
    colorHex: linea.colorGlaseado?.codigoHex ?? '',
  };
}

export function mapPedido(pedido) {
  if (!pedido) return null;

  return {
    id: pedido.id,
    fecha: pedido.fecha,
    fechaEntrega: pedido.fechaEntrega,
    estadoId: pedido.estado?.id ?? null,
    estado: pedido.estado?.nombre ?? '',
    mensajeTarjeta: pedido.mensajeTarjeta ?? '',
    clienteId: pedido.cliente?.id ?? null,
    municipioId: pedido.municipio?.id ?? null,
    municipio: pedido.municipio?.nombre ?? '',
    direccion: pedido.direccion ?? '',
    barrio: pedido.barrio ?? '',
    precioDomicilio: Number(pedido.precioDomicilio ?? 0),
    nombreReceptor: pedido.nombreReceptor ?? '',
    telefonoReceptor: pedido.telefonoReceptor ?? '',
    instruccionesEntrega: pedido.instruccionesEntrega ?? '',
    motivoRechazo: pedido.motivoRechazo ?? '',
    subtotal: Number(pedido.subtotal ?? 0),
    total: Number(pedido.total ?? 0),
    totalPagado: Number(pedido.totalPagado ?? 0),
    saldo: Number(pedido.saldo ?? 0),
    puedeSubirComprobante: Boolean(pedido.puedeSubirComprobante),
    comprobantes: Array.isArray(pedido.comprobantes)
      ? pedido.comprobantes.map(mapComprobante)
      : [],
    lineas: Array.isArray(pedido.lineas) ? pedido.lineas.map(mapLinea) : [],
  };
}

export function mapPedidos(pedidos) {
  return Array.isArray(pedidos) ? pedidos.map(mapPedido) : [];
}
